import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "缺少会话 ID" }, { status: 400 });
    }

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

    // 获取问题列表
    const questions = await prisma.question.findMany({
      where: { sessionId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("获取面试问题错误:", error);
    return NextResponse.json({ error: "获取问题失败" }, { status: 500 });
  }
}
