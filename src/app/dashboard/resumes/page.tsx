import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ResumeCard } from "@/components/resume-card";

export default async function ResumesPage() {
  const session = await auth();

  const resumes = await prisma.resume.findMany({
    where: { userId: session!.user!.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">我的简历</h2>
          <p className="text-gray-500">管理你的简历信息</p>
        </div>
        <Link href="/dashboard/upload-resume">
          <Button>上传新简历</Button>
        </Link>
      </div>

      {resumes.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">还没有上传简历</h3>
          <p className="text-gray-400 text-sm mb-4">上传简历让 AI 更好地了解你的背景</p>
          <Link href="/dashboard/upload-resume">
            <Button>上传第一份简历</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resumes.map((resume) => (
            <ResumeCard key={resume.id} resume={resume} />
          ))}
        </div>
      )}
    </div>
  );
}
