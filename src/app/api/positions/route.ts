import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { positionSchema } from "@/lib/validations";

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
      select: {
        id: true,
        title: true,
        description: true,
        parsedJd: true,
        createdAt: true,
        _count: { select: { sessions: true } },
      },
    });

    const result = positions.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      parsedJd: p.parsedJd,
      sessionCount: p._count.sessions,
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

    const body = await req.json();
    const parsed = positionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { title, description } = parsed.data;

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
