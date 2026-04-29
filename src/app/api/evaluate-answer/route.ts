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

    const { questionId, userAnswer, question, resumeContent, jobContext } =
      await req.json();

    if (!questionId || !userAnswer || !question) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    // 构建评估 prompt
    const prompt = `你是一位专业的面试评估专家。请对候选人的回答进行评分和分析。

面试问题：${question}
${jobContext ? `岗位背景：${jobContext}` : ""}
${resumeContent ? `候选人简历：${resumeContent}` : ""}

候选人回答：
${userAnswer}

请从以下维度评估回答：
1. 内容完整性
2. 逻辑清晰度
3. 专业深度
4. 表达能力

请以JSON格式返回评估结果：
{
  "score": 85,
  "strengths": ["优点1", "优点2"],
  "weaknesses": ["不足1", "不足2"],
  "suggestion": "改进建议"
}

评分标准：
- 90-100分：优秀，回答全面、深入、有见解
- 80-89分：良好，回答较为完整，有一定深度
- 70-79分：中等，回答基本正确但不够深入
- 60-69分：及格，回答有明显不足
- 60分以下：不及格，回答存在严重问题

只返回JSON，不要有其他文字。`;

    // 调用 MiMo API
    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content: "你是一位专业的面试评估专家，擅长分析候选人的回答质量。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const responseContent = completion.choices[0].message.content || "";
    console.log("MiMo 评估原始响应:", responseContent.substring(0, 500));

    if (!responseContent.trim()) {
      console.error("MiMo 返回空内容, finish_reason:", completion.choices[0].finish_reason);
      return NextResponse.json(
        { error: "AI 返回内容为空，请重试" },
        { status: 500 }
      );
    }

    let evaluation;

    try {
      // 提取 JSON（可能被包裹在 markdown 代码块中）
      let jsonStr = responseContent.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      // 清理可能的前后非 JSON 文字
      const jsonStart = jsonStr.indexOf("{");
      const jsonEnd = jsonStr.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
      }

      evaluation = JSON.parse(jsonStr);

      // 确保数据格式正确
      evaluation = {
        score: Math.min(100, Math.max(0, evaluation.score || 0)),
        strengths: Array.isArray(evaluation.strengths)
          ? evaluation.strengths
          : [],
        weaknesses: Array.isArray(evaluation.weaknesses)
          ? evaluation.weaknesses
          : [],
        suggestion: evaluation.suggestion || "",
      };
    } catch (e) {
      console.error("JSON 解析错误:", e, "原始内容:", responseContent);
      // 使用默认评估结果，避免阻塞用户
      evaluation = {
        score: 70,
        strengths: ["回答已提交"],
        weaknesses: ["AI 暂时无法详细分析"],
        suggestion: "系统评估暂时不可请稍后重试，或继续回答下一题。",
      };
    }

    // 保存答案到数据库
    const answer = await prisma.answer.create({
      data: {
        questionId,
        userId: session.user.id,
        userAnswer,
        score: evaluation.score,
        feedbackJson: evaluation,
      },
    });

    return NextResponse.json({
      answerId: answer.id,
      evaluation,
    });
  } catch (error) {
    console.error("评估答案错误:", error);
    return NextResponse.json({ error: "评估失败" }, { status: 500 });
  }
}
