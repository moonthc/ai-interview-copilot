import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";
import { deleteSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const resumeId = parsed.data.id;

    // 验证简历属于当前用户
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId: session.user.id,
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "简历不存在" }, { status: 404 });
    }

    // 删除文件
    try {
      const filePath = path.join(process.cwd(), "public", resume.filePath);
      await unlink(filePath);
    } catch (error) {
      console.warn("删除文件失败:", error);
    }

    // 删除数据库记录
    await prisma.resume.delete({
      where: { id: resumeId },
    });

    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除简历错误:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
