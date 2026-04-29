import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ai, AI_MODEL } from "@/lib/ai";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const position = await prisma.jobPosition.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!position) {
      return NextResponse.json({ error: "岗位不存在" }, { status: 404 });
    }

    const jdInfo = position.parsedJd
      ? `\n岗位分析：${JSON.stringify(position.parsedJd)}`
      : position.description
      ? `\n岗位描述：${position.description}`
      : "";

    const prompt = `请为以下岗位生成15道面试题库。

岗位：${position.title}${jdInfo}

要求：
1. 行为面试题 4 道（category: "行为面试"）
2. 技术面试题 4 道（category: "技术面试"）
3. 项目追问 3 道（category: "项目追问"）
4. 情景模拟 4 道（category: "情景模拟"）

每道题包含分类和难度（简单/中等/困难）。

请以JSON格式返回：
{
  "questions": [
    {"category": "行为面试", "difficulty": "简单", "question": "问题1"},
    {"category": "技术面试", "difficulty": "困难", "question": "问题2"}
  ]
}

只返回JSON，不要有其他文字。`;

    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: "你是一位专业的面试官，擅长生成高质量的面试题库。必须返回有效的JSON。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseContent = completion.choices[0].message.content || "";
    let jsonStr = responseContent.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    const jsonStart = jsonStr.indexOf("{");
    const jsonEnd = jsonStr.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
    }

    const parsed = JSON.parse(jsonStr);
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];

    await prisma.jobPosition.update({
      where: { id: params.id },
      data: { questionBank: questions as never },
    });

    return NextResponse.json({ positionId: params.id, questions });
  } catch (error) {
    console.error("生成题库错误:", error);
    return NextResponse.json({ error: "生成题库失败" }, { status: 500 });
  }
}
