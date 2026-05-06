import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { positionUpdateSchema } from "@/lib/validations";

// GET - 获取岗位详情
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const position = await prisma.jobPosition.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        sessions: {
          include: {
            questions: {
              include: {
                answers: {
                  where: { userId: session.user.id },
                  select: { feedbackJson: true },
                },
              },
            },
          },
        },
      },
    });

    if (!position) {
      return NextResponse.json({ error: "岗位不存在" }, { status: 404 });
    }

    return NextResponse.json(position);
  } catch (error) {
    console.error("获取岗位详情错误:", error);
    return NextResponse.json({ error: "获取岗位详情失败" }, { status: 500 });
  }
}

// PUT - 更新岗位
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const position = await prisma.jobPosition.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!position) {
      return NextResponse.json({ error: "岗位不存在" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = positionUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { title, description } = parsed.data;

    const updated = await prisma.jobPosition.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("更新岗位错误:", error);
    return NextResponse.json({ error: "更新岗位失败" }, { status: 500 });
  }
}

// DELETE - 删除岗位
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const position = await prisma.jobPosition.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!position) {
      return NextResponse.json({ error: "岗位不存在" }, { status: 404 });
    }

    await prisma.jobPosition.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除岗位错误:", error);
    return NextResponse.json({ error: "删除岗位失败" }, { status: 500 });
  }
}
