import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ai, AI_MODEL } from "@/lib/ai";
import { extractJsonFromAIResponse } from "@/lib/ai-parse";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { resumeId } = await req.json();

    if (!resumeId) {
      return NextResponse.json({ error: "请选择简历" }, { status: 400 });
    }

    // 验证岗位归属
    const position = await prisma.jobPosition.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!position) {
      return NextResponse.json({ error: "岗位不存在" }, { status: 404 });
    }

    // 验证简历归属
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId: session.user.id,
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "简历不存在" }, { status: 404 });
    }

    const resumeContent =
      typeof resume.parsedContent === "string"
        ? resume.parsedContent
        : JSON.stringify(resume.parsedContent);

    const jdContent = position.parsedJd
      ? JSON.stringify(position.parsedJd)
      : position.description || "";

    const prompt = `请对比以下简历和岗位要求，分析匹配度。

岗位：${position.title}
岗位要求：
${jdContent}

候选人简历：
${resumeContent}

请以JSON格式返回：
{
  "matchPercentage": 75,
  "matchedSkills": ["匹配技能1", "匹配技能2"],
  "missingSkills": ["缺失技能1", "缺失技能2"],
  "gapAnalysis": "一段详细的差距分析和建议（150字左右）"
}

matchPercentage 为 0-100 的匹配度百分比。
只返回JSON，不要有其他文字。`;

    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: "你是一位专业的职业匹配分析师。必须返回有效的JSON。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0].message.content || "";
    const parsed = extractJsonFromAIResponse<{
      matchPercentage: number;
      matchedSkills: string[];
      missingSkills: string[];
      gapAnalysis: string;
    }>(responseContent);

    const matchResult = {
      matchPercentage: Math.min(100, Math.max(0, parsed.matchPercentage || 0)),
      matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills : [],
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills : [],
      gapAnalysis: parsed.gapAnalysis || "",
      resumeId,
      analyzedAt: new Date().toISOString(),
    };

    await prisma.jobPosition.update({
      where: { id: params.id },
      data: { matchResult: matchResult as never },
    });

    return NextResponse.json({ positionId: params.id, matchResult });
  } catch (error) {
    console.error("匹配分析错误:", error);
    return NextResponse.json({ error: "匹配分析失败" }, { status: 500 });
  }
}
