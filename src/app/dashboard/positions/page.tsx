import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { PositionCard } from "@/components/position-card";
import { PositionCreateForm } from "@/components/position-create-form";

export default async function PositionsPage() {
  const session = await auth();

  // 优化：使用 select 避免加载 matchResult 和 questionBank 大 JSON 字段
  const positions = await prisma.jobPosition.findMany({
    where: { userId: session!.user!.id },
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

  const positionsWithCount = positions.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    parsedJd: p.parsedJd as {
      requiredSkills?: string[];
      experienceLevel?: string;
      educationRequirement?: string;
    } | null,
    sessionCount: p._count.sessions,
    createdAt: p.createdAt,
  }));

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">岗位管理</h2>
        <p className="text-gray-500">管理目标岗位，进行 JD 解析、匹配分析和题库生成</p>
      </div>

      <PositionCreateForm />

      {positionsWithCount.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">还没有岗位</h3>
          <p className="text-gray-400 text-sm">添加你感兴趣的岗位，开始 AI 分析</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {positionsWithCount.map((p) => (
            <PositionCard key={p.id} position={p} />
          ))}
        </div>
      )}
    </div>
  );
}
