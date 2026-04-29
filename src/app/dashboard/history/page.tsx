import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SessionCard } from "@/components/session-card";

interface FeedbackJson {
  score: number;
}

export default async function HistoryPage() {
  const session = await auth();

  const interviewSessions = await prisma.interviewSession.findMany({
    where: { userId: session!.user!.id },
    orderBy: { createdAt: "desc" },
    include: {
      jobPosition: true,
      questions: {
        include: {
          answers: {
            where: { userId: session!.user!.id },
            select: { feedbackJson: true },
          },
        },
      },
    },
  });

  const sessionsWithStats = interviewSessions.map((s) => {
    const totalQuestions = s.questions.length;
    let answeredCount = 0;
    let scoreSum = 0;
    let scoreCount = 0;

    for (const question of s.questions) {
      if (question.answers.length > 0) {
        answeredCount++;
        const feedback = question.answers[0]
          .feedbackJson as unknown as FeedbackJson | null;
        if (feedback?.score != null) {
          scoreSum += feedback.score;
          scoreCount++;
        }
      }
    }

    return {
      id: s.id,
      jobTitle: s.jobPosition?.title || "未知岗位",
      date: s.createdAt,
      averageScore: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0,
      answeredCount,
      totalQuestions,
      status: s.status,
    };
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">面试历史记录</h2>
        <p className="text-gray-500">回顾你的面试表现，查看历史报告和评分</p>
      </div>

      {sessionsWithStats.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">还没有面试记录</h3>
          <p className="text-gray-400 text-sm">开始你的第一次模拟面试吧</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sessionsWithStats.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  );
}
