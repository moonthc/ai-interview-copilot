import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET - 列出所有岗位
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const positions = await prisma.jobPosition.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        sessions: { select: { id: true } },
      },
    });

    const result = positions.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      parsedJd: p.parsedJd,
      sessionCount: p.sessions.length,
      createdAt: p.createdAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("获取岗位列表错误:", error);
    return NextResponse.json({ error: "获取岗位列表失败" }, { status: 500 });
  }
}

// POST - 创建新岗位
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { title, description } = await req.json();

    if (!title) {
      return NextResponse.json({ error: "请输入岗位名称" }, { status: 400 });
    }

    const position = await prisma.jobPosition.create({
      data: {
        userId: session.user.id,
        title,
        description: description || null,
      },
    });

    return NextResponse.json(position);
  } catch (error) {
    console.error("创建岗位错误:", error);
    return NextResponse.json({ error: "创建岗位失败" }, { status: 500 });
  }
}
