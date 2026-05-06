import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ai, AI_MODEL } from "@/lib/ai";
import { dialogueMessageSchema } from "@/lib/validations";

const MAX_ROUNDS = 5;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = dialogueMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { sessionId, questionId, userMessage } = parsed.data;

    // 验证会话属于当前用户
    const interviewSession = await prisma.interviewSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
      include: { jobPosition: true },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: "会话不存在" }, { status: 404 });
    }

    // 获取当前问题
    const question = await prisma.question.findFirst({
      where: { id: questionId, sessionId },
    });

    if (!question) {
      return NextResponse.json({ error: "问题不存在" }, { status: 404 });
    }

    // 加载对话历史
    const existingMessages = await prisma.dialogueMessage.findMany({
      where: { questionId },
      orderBy: { round: "asc" },
    });

    const currentRound = existingMessages.length + 1;

    // 保存用户消息
    await prisma.dialogueMessage.create({
      data: {
        questionId,
        role: "user",
        content: userMessage,
        round: currentRound,
      },
    });

    // 构建对话历史文本
    const historyText = existingMessages
      .map(
        (m) =>
          `${m.role === "ai" ? "面试官" : "候选人"}（第${m.round}轮）：${m.content}`
      )
      .join("\n");

    const jobContext = interviewSession.jobPosition?.title || "";

    // 判断是否强制结束
    const forceConclude = currentRound >= MAX_ROUNDS;

    const prompt = `你是一位经验丰富的面试官，正在进行一场面对面的面试。

当前面试问题：${question.content}
${jobContext ? `岗位背景：${jobContext}` : ""}

以下是与候选人在此问题上的对话历史：
${historyText}

候选人的最新回答：
${userMessage}

请根据候选人的回答，以自然的面试对话方式回应：
1. 如果回答有亮点，给予简短认可
2. 如果回答有不足或不够深入，追问具体细节
3. 如果候选人提到了有趣的项目或经验，追问技术细节
4. 保持专业但友善的语气
${forceConclude ? "\n注意：此问题已经讨论了多轮，请给出简短总结并结束此话题。在回复末尾加上 [CONCLUDE] 标记。" : "\n请判断是否已经对此话题进行了足够深入的探讨。如果已经追问了2-3轮且候选人已经充分展示（或明显无法深入），请在回复末尾加上标记 [CONCLUDE]。如果还需要继续追问，不要加任何标记。"}

只返回你的对话回复，不要有其他格式。`;

    const completion = await ai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "你是一位经验丰富的面试官，擅长通过对话深入了解候选人的能力。你的语气专业但友善，善于引导候选人展示最佳水平。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    let aiMessage = completion.choices[0].message.content || "";

    // 检测 [CONCLUDE] 标记
    const shouldConclude =
      forceConclude || aiMessage.includes("[CONCLUDE]");
    aiMessage = aiMessage.replace(/\[CONCLUDE\]/g, "").trim();

    // 保存 AI 消息
    await prisma.dialogueMessage.create({
      data: {
        questionId,
        role: "ai",
        content: aiMessage,
        round: currentRound,
      },
    });

    return NextResponse.json({
      aiMessage,
      shouldConclude,
      round: currentRound,
    });
  } catch (error) {
    console.error("对话错误:", error);
    return NextResponse.json({ error: "对话失败" }, { status: 500 });
  }
}
