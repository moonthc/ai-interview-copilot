import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  sessionId: z.string().min(1),
  status: z.enum(["created", "completed"]),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { sessionId, status } = parsed.data;

    // 验证会话属于当前用户
    const interviewSession = await prisma.interviewSession.findFirst({
      where: { id: sessionId, userId: session.user.id },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: "会话不存在" }, { status: 404 });
    }

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: { status },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("更新会话状态错误:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
