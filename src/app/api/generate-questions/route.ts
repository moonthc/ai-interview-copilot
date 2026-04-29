import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ai, AI_MODEL } from "@/lib/ai";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { resumeId, jobTitle, jobDescription } = await req.json();

    if (!jobTitle) {
      return NextResponse.json({ error: "请选择或输入岗位" }, { status: 400 });
    }

    // 获取简历内容
    let resumeContent = "";
    if (resumeId) {
      const resume = await prisma.resume.findUnique({
        where: { id: resumeId },
      });
      if (resume) {
        resumeContent =
          typeof resume.parsedContent === "string"
            ? resume.parsedContent
            : JSON.stringify(resume.parsedContent);
      }
    }

    // 构建 prompt
    const prompt = `请为以下岗位生成10道面试问题。

岗位：${jobTitle}
${jobDescription ? `岗位描述：${jobDescription}` : ""}
${resumeContent ? `候选人简历：${resumeContent}` : ""}

要求：
1. 行为面试问题 4 道（category: "行为面试"）
2. 技术面试问题 3 道（category: "技术面试"）
3. 项目追问 3 道（category: "项目追问"）

必须返回一个包含10个对象的JSON数组，格式如下：
[
{"category": "行为面试", "question": "问题1"},
{"category": "行为面试", "question": "问题2"},
{"category": "行为面试", "question": "问题3"},
{"category": "行为面试", "question": "问题4"},
{"category": "技术面试", "question": "问题5"},
{"category": "技术面试", "question": "问题6"},
{"category": "技术面试", "question": "问题7"},
{"category": "项目追问", "question": "问题8"},
{"category": "项目追问", "question": "问题9"},
{"category": "项目追问", "question": "问题10"}
]

请直接返回JSON数组，不要有其他文字。`;

    // 调用 MiMo API
    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: "你是一位专业的面试官，擅长生成高质量的面试问题。你必须返回一个包含10个问题的JSON数组，每个问题包含category和question字段。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseContent = completion.choices[0].message.content || "";
    console.log("MiMo 原始响应:", responseContent.substring(0, 500));

    let questions: { category: string; question: string }[] = [];

    try {
      // 提取 JSON 内容（可能被包裹在 markdown 代码块中）
      let jsonStr = responseContent.trim();

      // 如果是 markdown 代码块，提取其中的 JSON
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      // 清理 JSON 字符串
      jsonStr = jsonStr.trim();

      // 如果不是以 [ 开头，可能是多个对象用逗号分隔，需要包装成数组
      if (!jsonStr.startsWith("[")) {
        // 检查是否是多个对象用逗号分隔
        if (jsonStr.includes("},{")) {
          jsonStr = "[" + jsonStr + "]";
        } else {
          // 单个对象
          jsonStr = "[" + jsonStr + "]";
        }
      }

      const parsed = JSON.parse(jsonStr);

      if (Array.isArray(parsed)) {
        questions = parsed;
      }

      console.log("解析后的问题数量:", questions.length);
    } catch (e) {
      console.error("JSON 解析错误:", e);
      return NextResponse.json(
        { error: "生成问题格式错误" },
        { status: 500 }
      );
    }

    // 创建或获取岗位
    let jobPosition = await prisma.jobPosition.findFirst({
      where: {
        userId: session.user.id,
        title: jobTitle,
      },
    });

    if (!jobPosition) {
      jobPosition = await prisma.jobPosition.create({
        data: {
          userId: session.user.id,
          title: jobTitle,
          description: jobDescription || null,
        },
      });
    }

    // 创建面试会话
    const interviewSession = await prisma.interviewSession.create({
      data: {
        userId: session.user.id,
        resumeId: resumeId || null,
        jobPositionId: jobPosition.id,
        status: "created",
      },
    });

    // 保存问题到数据库
    const savedQuestions = await Promise.all(
      questions.map((q, index) =>
        prisma.question.create({
          data: {
            sessionId: interviewSession.id,
            category: q.category || "未分类",
            content: q.question || "",
            order: index + 1,
          },
        })
      )
    );

    console.log("生成的问题数量:", savedQuestions.length);
    console.log("返回的问题:", JSON.stringify(savedQuestions.slice(0, 2)));

    return NextResponse.json({
      sessionId: interviewSession.id,
      questions: savedQuestions,
    });
  } catch (error) {
    console.error("生成问题错误:", error);
    return NextResponse.json({ error: "生成问题失败" }, { status: 500 });
  }
}
