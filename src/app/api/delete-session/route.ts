import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { sessionId } = await req.json();

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

    // 删除会话（级联删除关联的 questions 和 answers）
    await prisma.interviewSession.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除会话错误:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
