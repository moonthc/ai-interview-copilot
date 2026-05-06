import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "不支持的文件格式，请上传 PDF 或图片" },
        { status: 400 }
      );
    }

    // 验证文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "文件大小超过 5MB 限制" },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const ext = path.extname(file.name).toLowerCase();
    const fileName = `${session.user.id}_${timestamp}${ext}`;

    // 确保 uploads 目录存在
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // 保存文件
    const filePath = path.join(uploadsDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 服务端魔数校验（防止 MIME 类型伪造）
    if (ext === ".pdf" && !(buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46)) {
      return NextResponse.json({ error: "文件内容与扩展名不匹配" }, { status: 400 });
    }
    if (ext === ".png" && !(buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47)) {
      return NextResponse.json({ error: "文件内容与扩展名不匹配" }, { status: 400 });
    }
    if ((ext === ".jpg" || ext === ".jpeg") && !(buffer[0] === 0xFF && buffer[1] === 0xD8)) {
      return NextResponse.json({ error: "文件内容与扩展名不匹配" }, { status: 400 });
    }

    await writeFile(filePath, buffer);

    // 记录到数据库
    const resume = await prisma.resume.create({
      data: {
        userId: session.user.id,
        filePath: `/uploads/${fileName}`,
      },
    });

    return NextResponse.json({
      resumeId: resume.id,
      filePath: resume.filePath,
    });
  } catch (error) {
    console.error("上传简历错误:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
