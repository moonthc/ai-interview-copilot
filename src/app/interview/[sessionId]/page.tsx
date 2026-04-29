"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface Question {
  id: string;
  category: string;
  content: string;
  order: number;
}

interface Evaluation {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestion: string;
}

interface AnswerRecord {
  questionId: string;
  userAnswer: string;
  evaluation: Evaluation;
}

export default function InterviewRoomPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [evaluating, setEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] =
    useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 加载问题
  const fetchQuestions = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/interview-questions?sessionId=${params.sessionId}`
      );
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      } else {
        toast.error("加载问题失败");
        router.push("/dashboard");
      }
    } catch {
      toast.error("加载问题失败");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [params.sessionId, router]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // 提交答案
  const handleSubmit = async () => {
    if (!userAnswer.trim()) {
      toast.error("请输入答案");
      return;
    }

    setEvaluating(true);
    try {
      const response = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: questions[currentIndex].id,
          sessionId: params.sessionId,
          userAnswer: userAnswer.trim(),
          question: questions[currentIndex].content,
        }),
      });

      if (!response.ok) {
        throw new Error("评估失败");
      }

      const data = await response.json();
      const evaluation = data.evaluation;

      // 记录答案
      const newAnswer: AnswerRecord = {
        questionId: questions[currentIndex].id,
        userAnswer: userAnswer.trim(),
        evaluation,
      };

      const newAnswers = [...answers, newAnswer];
      setAnswers(newAnswers);
      setCurrentEvaluation(evaluation);

      // 检查是否完成所有题目
      if (currentIndex >= questions.length - 1) {
        toast.success("面试完成！");
        // 跳转到报告页
        setTimeout(() => {
          router.push(`/interview/${params.sessionId}/report`);
        }, 2000);
      }
    } catch {
      toast.error("评估失败，请重试");
    } finally {
      setEvaluating(false);
    }
  };

  // 下一题
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer("");
      setCurrentEvaluation(null);
      textareaRef.current?.focus();
    }
  };

  // 计算平均分
  const averageScore =
    answers.length > 0
      ? Math.round(
          answers.reduce((sum, a) => sum + a.evaluation.score, 0) /
            answers.length
        )
      : 0;

  // 计算进度
  const progress =
    questions.length > 0
      ? Math.round((answers.length / questions.length) * 100)
      : 0;

  // 获取分数颜色
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⚙️</div>
          <p className="text-gray-600">加载面试问题中...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600">未找到面试问题</p>
          <Button className="mt-4" onClick={() => router.push("/dashboard")}>
            返回仪表板
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex >= questions.length - 1;
  const hasAnswered = currentEvaluation !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部进度栏 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-gray-900">面试进行中</h1>
            <div className="flex items-center gap-4">
              {answers.length > 0 && (
                <div className="text-sm">
                  平均分：{" "}
                  <span className={`font-bold ${getScoreColor(averageScore)}`}>
                    {averageScore}
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-500">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
          </div>
          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：题目和答案 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 当前题目 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      currentQuestion.category === "行为面试"
                        ? "bg-blue-100 text-blue-800"
                        : currentQuestion.category === "技术面试"
                        ? "bg-green-100 text-green-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {currentQuestion.category}
                  </span>
                  <span className="text-sm text-gray-500">
                    第 {currentIndex + 1} 题
                  </span>
                </div>
                <CardTitle className="text-2xl">
                  {currentQuestion.content}
                </CardTitle>
              </CardHeader>
            </Card>

            {/* 答案输入 */}
            {!hasAnswered && (
              <Card>
                <CardContent className="pt-6">
                  <textarea
                    ref={textareaRef}
                    className="w-full p-4 border rounded-lg min-h-[150px] text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入你的答案..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    disabled={evaluating}
                  />
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-500">
                      按 Enter 提交，Shift + Enter 换行
                    </p>
                    <Button
                      onClick={handleSubmit}
                      disabled={evaluating || !userAnswer.trim()}
                    >
                      {evaluating ? "评估中..." : "提交答案"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 评估结果 */}
            {hasAnswered && currentEvaluation && (
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <span
                      className={`text-4xl font-bold ${getScoreColor(
                        currentEvaluation.score
                      )}`}
                    >
                      {currentEvaluation.score}
                    </span>
                    <span className="text-lg text-gray-500">/ 100</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 优点 */}
                  {currentEvaluation.strengths.length > 0 && (
                    <div>
                      <h4 className="font-medium text-green-700 mb-2">
                        ✅ 优点
                      </h4>
                      <ul className="space-y-1">
                        {currentEvaluation.strengths.map((s, i) => (
                          <li
                            key={i}
                            className="text-sm text-gray-700 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-green-500"
                          >
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 不足 */}
                  {currentEvaluation.weaknesses.length > 0 && (
                    <div>
                      <h4 className="font-medium text-orange-700 mb-2">
                        ⚠️ 不足
                      </h4>
                      <ul className="space-y-1">
                        {currentEvaluation.weaknesses.map((w, i) => (
                          <li
                            key={i}
                            className="text-sm text-gray-700 pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-orange-500"
                          >
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 改进建议 */}
                  {currentEvaluation.suggestion && (
                    <div>
                      <h4 className="font-medium text-blue-700 mb-2">
                        💡 改进建议
                      </h4>
                      <p className="text-sm text-gray-700">
                        {currentEvaluation.suggestion}
                      </p>
                    </div>
                  )}

                  {/* 下一题按钮 */}
                  <div className="flex justify-end pt-4">
                    {isLastQuestion ? (
                      <Button
                        onClick={() =>
                          router.push(
                            `/interview/${params.sessionId}/report`
                          )
                        }
                      >
                        查看报告
                      </Button>
                    ) : (
                      <Button onClick={handleNext}>下一题</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：题目列表和统计 */}
          <div className="space-y-6">
            {/* 统计卡片 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">面试统计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div
                    className={`text-5xl font-bold ${getScoreColor(
                      averageScore
                    )}`}
                  >
                    {averageScore}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">平均分</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {answers.length}
                    </div>
                    <p className="text-xs text-gray-500">已答题</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {questions.length - answers.length}
                    </div>
                    <p className="text-xs text-gray-500">剩余</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 题目列表 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">题目列表</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {questions.map((q, index) => {
                    const answer = answers.find(
                      (a) => a.questionId === q.id
                    );
                    return (
                      <div
                        key={q.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          index === currentIndex
                            ? "border-blue-500 bg-blue-50"
                            : answer
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          if (index <= answers.length) {
                            setCurrentIndex(index);
                            if (index < answers.length) {
                              setCurrentEvaluation(
                                answers[index].evaluation
                              );
                              setUserAnswer(answers[index].userAnswer);
                            } else {
                              setCurrentEvaluation(null);
                              setUserAnswer("");
                            }
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            {index + 1}. {q.category}
                          </span>
                          {answer && (
                            <span
                              className={`text-sm font-bold ${getScoreColor(
                                answer.evaluation.score
                              )}`}
                            >
                              {answer.evaluation.score}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
