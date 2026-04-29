import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { readFile } from "fs/promises";
import path from "path";
import { ai, AI_MODEL, AI_VISION_MODEL } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { resumeId, filePath } = await req.json();

    if (!resumeId || !filePath) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 验证简历属于当前用户
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId: session.user.id,
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "简历不存在" }, { status: 404 });
    }

    // 读取文件
    const fullPath = path.join(process.cwd(), "public", filePath);
    const fileBuffer = await readFile(fullPath);

    // 根据文件类型处理
    const isPdf = filePath.endsWith(".pdf");
    let fileContent: string;

    if (isPdf) {
      // 对于 PDF，我们只能提取文件名信息
      // 实际应用中需要使用 pdf-parse 等库
      fileContent = `PDF 文件: ${path.basename(filePath)}`;
    } else {
      // 对于图片，使用 base64 编码
      const base64 = fileBuffer.toString("base64");
      const mimeType = filePath.endsWith(".png") ? "image/png" : "image/jpeg";
      fileContent = `data:${mimeType};base64,${base64}`;
    }

    // 调用 MiMo API 解析简历
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          '你是一位专业简历解析器。从简历中提取信息，只返回 JSON 格式：{ "name": "", "skills": [], "experience": [], "education": [], "summary": "" }。如果没有某字段，用空数组或空字符串。',
      },
    ];

    if (isPdf) {
      messages.push({
        role: "user",
        content: `请解析这份简历的文件名信息，提取可能的姓名和技能：${fileContent}`,
      });
    } else {
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: "请解析这份简历，提取个人信息、技能、工作经历、教育背景和摘要。",
          },
          {
            type: "image_url",
            image_url: { url: fileContent },
          },
        ],
      });
    }

    // 根据文件类型选择模型：图片使用 mimo-v2.5，其他使用默认模型
    const model = isPdf ? AI_MODEL : AI_VISION_MODEL;

    const completion = await ai.chat.completions.create({
      model,
      messages,
      temperature: 0.3,
    });

    const responseContent = completion.choices[0].message.content || "";
    let parsedData;

    try {
      // 提取 JSON 内容（可能被包裹在 markdown 代码块中）
      let jsonStr = responseContent.trim();

      // 如果是 markdown 代码块，提取其中的 JSON
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      parsedData = JSON.parse(jsonStr);
    } catch (e) {
      console.error("JSON 解析错误:", e, "原始内容:", responseContent);
      return NextResponse.json(
        { error: "简历解析格式错误" },
        { status: 500 }
      );
    }

    // 确保数据格式正确
    const resumeData = {
      name: parsedData.name || "",
      skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
      experience: Array.isArray(parsedData.experience)
        ? parsedData.experience
        : [],
      education: Array.isArray(parsedData.education)
        ? parsedData.education
        : [],
      summary: parsedData.summary || "",
    };

    // 更新数据库
    const updatedResume = await prisma.resume.update({
      where: { id: resumeId },
      data: {
        parsedContent: resumeData,
      },
    });

    return NextResponse.json({
      resumeId: updatedResume.id,
      parsedContent: resumeData,
    });
  } catch (error) {
    console.error("解析简历错误:", error);
    return NextResponse.json({ error: "解析简历失败" }, { status: 500 });
  }
}
