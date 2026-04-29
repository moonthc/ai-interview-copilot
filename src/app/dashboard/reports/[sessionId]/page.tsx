import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

interface PageProps {
  params: { sessionId: string };
}

interface FeedbackJson {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestion: string;
}

export default async function ReportPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // 获取会话信息
  const interviewSession = await prisma.interviewSession.findFirst({
    where: {
      id: params.sessionId,
      userId: session.user.id,
    },
    include: {
      jobPosition: true,
    },
  });

  if (!interviewSession) {
    notFound();
  }

  // 获取所有问题和答案
  const questions = await prisma.question.findMany({
    where: { sessionId: params.sessionId },
    orderBy: { order: "asc" },
    include: {
      answers: {
        where: { userId: session.user.id },
      },
    },
  });

  // 计算统计数据
  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter(
    (q) => q.answers.length > 0
  ).length;
  const scores = questions
    .flatMap((q) => q.answers)
    .map((a) => {
      const feedback = a.feedbackJson as unknown as FeedbackJson;
      return feedback?.score || 0;
    });
  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  // 获取分数颜色
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  // 获取分数等级
  const getScoreGrade = (score: number) => {
    if (score >= 90) return "优秀";
    if (score >= 80) return "良好";
    if (score >= 70) return "中等";
    if (score >= 60) return "及格";
    return "不及格";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">面试报告</h2>
          <p className="text-gray-500">
            {interviewSession.jobPosition?.title || "未知岗位"} -{" "}
            {new Date(interviewSession.createdAt).toLocaleDateString("zh-CN")}
          </p>
        </div>
        <Link href="/dashboard/history">
          <Button variant="outline" size="sm">返回面试历史</Button>
        </Link>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* 总览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className={`text-5xl font-bold ${getScoreColor(averageScore)}`}>
                {averageScore}
              </div>
              <p className="text-sm text-gray-500 mt-2">平均分</p>
              <p className={`text-lg font-medium ${getScoreColor(averageScore)}`}>
                {getScoreGrade(averageScore)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-5xl font-bold text-gray-900">
                {answeredQuestions}/{totalQuestions}
              </div>
              <p className="text-sm text-gray-500 mt-2">完成题目</p>
              <p className="text-lg font-medium text-gray-700">
                {Math.round((answeredQuestions / totalQuestions) * 100)}% 完成
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-5xl font-bold text-gray-900">
                {interviewSession.jobPosition?.title || "未知岗位"}
              </div>
              <p className="text-sm text-gray-500 mt-2">面试岗位</p>
              <p className="text-lg font-medium text-gray-700">
                {new Date(interviewSession.createdAt).toLocaleDateString(
                  "zh-CN"
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 详细报告 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>详细评分</CardTitle>
            <CardDescription>
              每道题的得分和反馈
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {questions.map((question, index) => {
                const answer = question.answers[0];
                const feedback = answer?.feedbackJson as FeedbackJson | null;
                const score = feedback?.score || 0;

                return (
                  <div
                    key={question.id}
                    className="border rounded-lg p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              question.category === "行为面试"
                                ? "bg-blue-100 text-blue-800"
                                : question.category === "技术面试"
                                ? "bg-green-100 text-green-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {question.category}
                          </span>
                          <span className="text-sm text-gray-500">
                            第 {index + 1} 题
                          </span>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {question.content}
                        </h3>
                      </div>
                      <div
                        className={`text-3xl font-bold ${getScoreColor(score)}`}
                      >
                        {score}
                      </div>
                    </div>

                    {answer ? (
                      <div className="space-y-4">
                        {/* 用户答案 */}
                        <div>
                          <h4 className="font-medium text-gray-700 mb-2">
                            你的回答
                          </h4>
                          <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                            {answer.userAnswer}
                          </p>
                        </div>

                        {/* 反馈 */}
                        {feedback && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* 优点 */}
                            {feedback.strengths &&
                              feedback.strengths.length > 0 && (
                                <div className="bg-green-50 p-4 rounded-lg">
                                  <h4 className="font-medium text-green-700 mb-2">
                                    ✅ 优点
                                  </h4>
                                  <ul className="space-y-1">
                                    {feedback.strengths.map((s, i) => (
                                      <li
                                        key={i}
                                        className="text-sm text-green-800"
                                      >
                                        • {s}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                            {/* 不足 */}
                            {feedback.weaknesses &&
                              feedback.weaknesses.length > 0 && (
                                <div className="bg-orange-50 p-4 rounded-lg">
                                  <h4 className="font-medium text-orange-700 mb-2">
                                    ⚠️ 不足
                                  </h4>
                                  <ul className="space-y-1">
                                    {feedback.weaknesses.map((w, i) => (
                                      <li
                                        key={i}
                                        className="text-sm text-orange-800"
                                      >
                                        • {w}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                            {/* 建议 */}
                            {feedback.suggestion && (
                              <div className="bg-blue-50 p-4 rounded-lg">
                                <h4 className="font-medium text-blue-700 mb-2">
                                  💡 改进建议
                                </h4>
                                <p className="text-sm text-blue-800">
                                  {feedback.suggestion}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">未作答</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex justify-center gap-4">
          <Link href="/dashboard/create-interview">
            <Button size="lg">重新面试</Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline">
              返回仪表板
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
