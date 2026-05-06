import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { readFile } from "fs/promises";
import path from "path";
import { ai, AI_MODEL } from "@/lib/ai";
import { parseResumeSchema } from "@/lib/validations";
import { extractJsonFromAIResponse } from "@/lib/ai-parse";

const LONGCAT_API_KEY = process.env.LONGCAT_API_KEY || "";
const LONGCAT_BASE_URL = process.env.LONGCAT_BASE_URL || "https://api.longcat.chat/openai";
const LONGCAT_MODEL = process.env.LONGCAT_MODEL || "LongCat-Flash-Omni-2603";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = parseResumeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { resumeId } = parsed.data;

    // 验证简历属于当前用户，并从数据库获取 filePath（不信任客户端传入）
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId: session.user.id,
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "简历不存在" }, { status: 404 });
    }

    // 使用数据库中的 filePath，并验证路径安全
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const fullPath = path.resolve(path.join(process.cwd(), "public", resume.filePath));
    if (!fullPath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: "文件路径非法" }, { status: 400 });
    }

    const fileName = path.basename(resume.filePath, path.extname(resume.filePath));
    const isPdf = resume.filePath.endsWith(".pdf");

    let responseContent: string;

    if (isPdf) {
      // PDF 无法直接读取内容，基于文件名提取信息
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content:
            '你是一位专业简历解析器。根据提供的文件名信息，尽可能提取简历相关信息，只返回 JSON 格式：{ "name": "", "skills": [], "experience": [], "education": [], "summary": "" }。如果没有某字段，用空数组或空字符串。',
        },
        {
          role: "user",
          content: `请根据以下简历文件名信息，尽可能提取候选人的姓名和技能等信息。文件名：${fileName}`,
        },
      ];

      const completion = await ai.chat.completions.create({
        model: AI_MODEL,
        messages,
        temperature: 0.3,
      });
      responseContent = completion.choices[0].message.content || "";
      console.log("DeepSeek 解析响应:", responseContent.substring(0, 200));
    } else {
      // 图片文件：LongCat OCR 提取原始文本 -> DeepSeek 结构化
      const fileBuffer = await readFile(fullPath);
      const base64 = fileBuffer.toString("base64");
      const mimeType = resume.filePath.endsWith(".png") ? "image/png" : "image/jpeg";

      // Step 1: LongCat 视觉模型提取图片中的所有文字
      const longcatBody = {
        model: LONGCAT_MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "input_image",
                input_image: { type: "base64", data: [base64] },
              },
              { type: "text", text: "请提取这张图片中的所有文字内容，原样输出，不要遗漏任何信息。不要做任何修改或总结。" },
            ],
          },
        ],
        max_tokens: 4096,
        stream: false,
      };

      console.log("LongCat OCR 请求, 图片大小:", Math.round(base64.length * 0.75 / 1024), "KB");

      const longcatRes = await fetch(`${LONGCAT_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LONGCAT_API_KEY}`,
        },
        body: JSON.stringify(longcatBody),
      });

      if (!longcatRes.ok) {
        const errText = await longcatRes.text();
        console.error("LongCat API 错误:", longcatRes.status, errText);
        throw new Error(`LongCat API 返回 ${longcatRes.status}`);
      }

      const longcatData = await longcatRes.json();
      const ocrText = longcatData.choices?.[0]?.message?.content || "";
      console.log("LongCat OCR 文本长度:", ocrText.length);

      if (!ocrText.trim()) {
        throw new Error("LongCat 未能提取到文字");
      }

      // Step 2: DeepSeek 将 OCR 文本解析为结构化 JSON
      const deepseekMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: '你是简历解析专家。从文本中提取信息，只返回JSON。格式：{"name":"姓名","skills":["技能1","技能2"],"experience":[{"company":"公司","position":"职位","duration":"时间","description":"描述"}],"education":[{"school":"学校","degree":"学位","major":"专业","year":"年份"}],"summary":"一句话简介"}',
        },
        {
          role: "user",
          content: `请解析以下简历文本：\n\n${ocrText.substring(0, 4000)}`,
        },
      ];

      const completion = await ai.chat.completions.create({
        model: AI_MODEL,
        messages: deepseekMessages,
        temperature: 0.3,
      });
      responseContent = completion.choices[0].message.content || "";
      console.log("DeepSeek 解析响应:", responseContent.substring(0, 200));
    }

    let parsedData: Record<string, unknown>;

    try {
      parsedData = extractJsonFromAIResponse<Record<string, unknown>>(responseContent);
    } catch (e) {
      console.error("JSON 解析错误:", e);
      parsedData = { name: fileName, skills: [], experience: [], education: [], summary: "" };
    }

    // 确保数据格式正确
    const resumeData = {
      name: (parsedData.name as string) || fileName,
      skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
      experience: Array.isArray(parsedData.experience)
        ? parsedData.experience
        : [],
      education: Array.isArray(parsedData.education)
        ? parsedData.education
        : [],
      summary: (parsedData.summary as string) || "",
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
