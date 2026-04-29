import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { JdAnalysisPanel } from "@/components/jd-analysis-panel";

interface PageProps {
  params: { id: string };
}

export default async function PositionDetailPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const position = await prisma.jobPosition.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
    include: {
      sessions: {
        orderBy: { createdAt: "desc" },
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
    notFound();
  }

  // 计算每个会话的平均分
  const sessionsWithStats = position.sessions.map((s) => {
    let scoreSum = 0;
    let scoreCount = 0;
    for (const q of s.questions) {
      if (q.answers.length > 0) {
        const feedback = q.answers[0].feedbackJson as {
          score?: number;
        } | null;
        if (feedback?.score != null) {
          scoreSum += feedback.score;
          scoreCount++;
        }
      }
    }
    return {
      id: s.id,
      averageScore: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0,
      questionCount: s.questions.length,
      createdAt: s.createdAt,
    };
  });

  const parsedJd = position.parsedJd as {
    requiredSkills?: string[];
    experienceLevel?: string;
    educationRequirement?: string;
    keyResponsibilities?: string[];
    preferredSkills?: string[];
  } | null;

  const matchResult = position.matchResult as {
    matchPercentage: number;
    matchedSkills: string[];
    missingSkills: string[];
    gapAnalysis: string;
  } | null;

  const questionBank = position.questionBank as Array<{
    category: string;
    difficulty: string;
    question: string;
  }> | null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{position.title}</h2>
          <p className="text-gray-500">
            创建于{" "}
            {new Date(position.createdAt).toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Link href="/dashboard/positions">
          <Button variant="outline" size="sm">返回岗位列表</Button>
        </Link>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* 岗位描述 */}
        {position.description && (
        <Card>
          <CardHeader>
            <CardTitle>岗位描述</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
              {position.description}
            </p>
          </CardContent>
        </Card>
        )}

        {/* AI 分析面板 */}
        <JdAnalysisPanel
          positionId={position.id}
          parsedJd={parsedJd}
          matchResult={matchResult}
          questionBank={questionBank}
        />

        {/* 面试记录 */}
        {sessionsWithStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">面试记录</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sessionsWithStats.map((s) => (
                  <Link
                    key={s.id}
                    href={`/interview/${s.id}/report`}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm text-gray-500">
                        {new Date(s.createdAt).toLocaleDateString("zh-CN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-gray-400">
                        {s.questionCount} 道题
                      </p>
                    </div>
                    <div
                      className={`text-lg font-bold ${
                        s.averageScore >= 80
                          ? "text-green-600"
                          : s.averageScore >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {s.averageScore > 0 ? `${s.averageScore} 分` : "未完成"}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
