import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const resumes = await prisma.resume.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        filePath: true,
        createdAt: true,
        parsedContent: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 格式化返回数据
    const formattedResumes = resumes.map((resume) => {
      const parsed = resume.parsedContent as { name?: string } | null;
      return {
        id: resume.id,
        name: parsed?.name || "未命名简历",
        createdAt: resume.createdAt,
      };
    });

    return NextResponse.json(formattedResumes);
  } catch (error) {
    console.error("获取简历列表错误:", error);
    return NextResponse.json({ error: "获取简历列表失败" }, { status: 500 });
  }
}
