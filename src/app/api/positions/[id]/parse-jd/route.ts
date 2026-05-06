import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ai, AI_MODEL } from "@/lib/ai";
import { extractJsonFromAIResponse } from "@/lib/ai-parse";

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

    if (!position.description) {
      return NextResponse.json(
        { error: "请先填写岗位描述" },
        { status: 400 }
      );
    }

    const prompt = `请分析以下岗位描述（JD），提取结构化信息。

岗位：${position.title}
岗位描述：
${position.description}

请以JSON格式返回：
{
  "requiredSkills": ["必需技能1", "必需技能2"],
  "experienceLevel": "经验要求（如：3-5年）",
  "educationRequirement": "学历要求（如：本科及以上）",
  "keyResponsibilities": ["核心职责1", "核心职责2"],
  "preferredSkills": ["加分技能1", "加分技能2"]
}

只返回JSON，不要有其他文字。`;

    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: "你是一位专业的职位分析师，擅长从JD中提取关键信息。必须返回有效的JSON。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0].message.content || "";
    const parsedJd = extractJsonFromAIResponse(responseContent);

    await prisma.jobPosition.update({
      where: { id: params.id },
      data: { parsedJd: parsedJd as never },
    });

    return NextResponse.json({ positionId: params.id, parsedJd });
  } catch (error) {
    console.error("解析JD错误:", error);
    return NextResponse.json({ error: "解析JD失败" }, { status: 500 });
  }
}
