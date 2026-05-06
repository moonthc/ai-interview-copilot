import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveQuestionsSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = saveQuestionsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { sessionId, questions } = parsed.data;

    // 验证会话属于当前用户
    const interviewSession = await prisma.interviewSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: "会话不存在" }, { status: 404 });
    }

    // 删除原有问题
    await prisma.question.deleteMany({
      where: { sessionId },
    });

    // 保存新问题
    const savedQuestions = await Promise.all(
      questions.map(
        (q: { id?: string; category?: string; content: string }, index: number) =>
          prisma.question.create({
            data: {
              sessionId,
              category: q.category,
              content: q.content,
              order: index + 1,
            },
          })
      )
    );

    return NextResponse.json({ questions: savedQuestions });
  } catch (error) {
    console.error("保存问题错误:", error);
    return NextResponse.json({ error: "保存问题失败" }, { status: 500 });
  }
}
