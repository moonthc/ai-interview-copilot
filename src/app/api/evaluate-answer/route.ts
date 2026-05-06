import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ai, AI_MODEL } from "@/lib/ai";
import { evaluateAnswerSchema } from "@/lib/validations";
import { extractJsonFromAIResponse } from "@/lib/ai-parse";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = evaluateAnswerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { questionId, userAnswer, question, resumeContent, jobContext } = parsed.data;

    // 检查是否为对话模式，加载对话历史
    let dialogueHistory = "";
    let isDialogueMode = false;
    if (parsed.data.sessionId) {
      const session = await prisma.interviewSession.findFirst({
        where: { id: parsed.data.sessionId },
      });
      if (session?.mode === "dialogue") {
        isDialogueMode = true;
        const messages = await prisma.dialogueMessage.findMany({
          where: { questionId },
          orderBy: { round: "asc" },
        });
        if (messages.length > 0) {
          dialogueHistory = messages
            .map(
              (m) =>
                `${m.role === "ai" ? "面试官" : "候选人"}（第${m.round}轮）：${m.content}`
            )
            .join("\n");
        }
      }
    }

    // 构建评估 prompt（包含追问生成）
    const prompt = isDialogueMode
      ? `你是一位专业的面试评估专家。请对候选人在多轮对话中的表现进行综合评分和分析。

面试问题：${question}
${jobContext ? `岗位背景：${jobContext}` : ""}
${resumeContent ? `候选人简历：${resumeContent}` : ""}

以下是面试官与候选人的完整对话记录：
${dialogueHistory}

请综合所有对话轮次中候选人的表现进行评估。

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
  "suggestion": "改进建议",
  "followUpQuestion": ""
}

评分标准：
- 90-100分：优秀，回答全面、深入、有见解
- 80-89分：良好，回答较为完整，有一定深度
- 70-79分：中等，回答基本正确但不够深入
- 60-69分：及格，回答有明显不足
- 60分以下：不及格，回答存在严重问题

只返回JSON，不要有其他文字。`
      : `你是一位专业的面试评估专家。请对候选人的回答进行评分和分析，并生成一个追问问题。

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
  "suggestion": "改进建议",
  "followUpQuestion": "基于回答中的不足或亮点，生成一个深入追问的问题"
}

评分标准：
- 90-100分：优秀，回答全面、深入、有见解
- 80-89分：良好，回答较为完整，有一定深度
- 70-79分：中等，回答基本正确但不够深入
- 60-69分：及格，回答有明显不足
- 60分以下：不及格，回答存在严重问题

追问问题要求：
- 如果这是首次回答，针对回答中的不足之处深入提问，或要求候选人补充更多细节
- 如果回答中包含此前追问的内容，请基于整体对话表现评估，并从不同角度追问
- 追问应该是开放式的，能引导候选人展示更深入的理解
- 如果回答已经非常优秀（90分以上），followUpQuestion 留空即可
- 避免重复之前追问过的内容，每次追问应挖掘新的维度

只返回JSON，不要有其他文字。`;

    // 调用 DeepSeek API
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
    console.log("DeepSeek 评估原始响应:", responseContent.substring(0, 500));

    if (!responseContent.trim()) {
      console.error("DeepSeek 返回空内容, finish_reason:", completion.choices[0].finish_reason);
      return NextResponse.json(
        { error: "AI 返回内容为空，请重试" },
        { status: 500 }
      );
    }

    let evaluation;

    try {
      const parsed = extractJsonFromAIResponse<Record<string, unknown>>(responseContent);

      // 确保数据格式正确
      evaluation = {
        score: Math.min(100, Math.max(0, (parsed.score as number) || 0)),
        strengths: Array.isArray(parsed.strengths)
          ? (parsed.strengths as string[])
          : [],
        weaknesses: Array.isArray(parsed.weaknesses)
          ? (parsed.weaknesses as string[])
          : [],
        suggestion: (parsed.suggestion as string) || "",
        followUpQuestion: (parsed.followUpQuestion as string) || "",
      };
    } catch (e) {
      console.error("JSON 解析错误:", e, "原始内容:", responseContent);
      // 使用默认评估结果，避免阻塞用户
      evaluation = {
        score: 70,
        strengths: ["回答已提交"],
        weaknesses: ["AI 暂时无法详细分析"],
        suggestion: "系统评估暂时不可用，请稍后重试，或继续回答下一题。",
        followUpQuestion: "",
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
        followUpQuestion: evaluation.followUpQuestion || null,
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
