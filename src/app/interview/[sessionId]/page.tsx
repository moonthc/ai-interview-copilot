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
import { VoiceInputButton } from "@/components/voice-input-button";
import { InterviewDialogue } from "@/components/interview-dialogue";

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
  followUpQuestion?: string;
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
  const [mode, setMode] = useState<"standard" | "dialogue">("standard");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [evaluating, setEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] =
    useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpAnswer, setFollowUpAnswer] = useState("");
  const [followUpEvaluating, setFollowUpEvaluating] = useState(false);
  const [followUpRound, setFollowUpRound] = useState(0);
  const [followUpHistory, setFollowUpHistory] = useState<{question: string; answer: string}[]>([]);
  const MAX_FOLLOW_UP_ROUNDS = 3;
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
        setMode(data.mode || "standard");
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
        // 更新会话状态为已完成
        fetch("/api/update-session-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: params.sessionId, status: "completed" }),
        }).catch(() => {});
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
      setShowFollowUp(false);
      setFollowUpAnswer("");
      setFollowUpRound(0);
      setFollowUpHistory([]);
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">加载面试问题中...</p>
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

  // 对话模式：使用独立组件
  if (mode === "dialogue") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <header className="bg-white dark:bg-gray-900 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                AI 对话面试
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI 面试官将根据你的回答进行多轮追问
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm("确定要结束面试吗？已作答的题目将被保留，可查看报告。")) {
                  fetch("/api/update-session-status", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sessionId: params.sessionId, status: "completed" }),
                  }).catch(() => {});
                  router.push(`/interview/${params.sessionId}/report`);
                }
              }}
            >
              结束面试
            </Button>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <InterviewDialogue sessionId={params.sessionId} questions={questions} />
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (answers.length > 0) {
                    if (confirm("确定要结束面试吗？已作答的题目将被保留，可查看报告。")) {
                      fetch("/api/update-session-status", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ sessionId: params.sessionId, status: "completed" }),
                      }).catch(() => {});
                      router.push(`/interview/${params.sessionId}/report`);
                    }
                  } else {
                    if (confirm("确定要退出面试吗？")) {
                      router.push("/dashboard");
                    }
                  }
                }}
              >
                结束面试
              </Button>
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
                    className="w-full p-4 border rounded-lg min-h-[150px] text-base focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
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
                    <div className="flex items-center gap-3">
                      <VoiceInputButton
                        onTranscript={(text) =>
                          setUserAnswer((prev) => prev + text)
                        }
                        disabled={evaluating}
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        按 Enter 提交，Shift + Enter 换行
                      </p>
                    </div>
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

                  {/* 追问按钮 */}
                  {currentEvaluation.followUpQuestion && !showFollowUp && followUpRound < MAX_FOLLOW_UP_ROUNDS && currentEvaluation.score < 90 && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowFollowUp(true)}
                      >
                        回答追问 {followUpRound > 0 ? `(第 ${followUpRound + 1} 轮)` : ""}
                      </Button>
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

            {/* 追问卡片 */}
            {hasAnswered && currentEvaluation?.followUpQuestion && showFollowUp && (
              <Card className="border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span>💬</span> AI 追问
                    {followUpRound > 0 && (
                      <span className="text-xs font-normal text-amber-600 dark:text-amber-400">
                        (第 {followUpRound + 1} 轮)
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                {/* 追问历史 */}
                {followUpHistory.length > 0 && (
                  <div className="px-6 pb-2 space-y-2">
                    {followUpHistory.map((h, i) => (
                      <div key={i} className="text-sm border-l-2 border-amber-300 dark:border-amber-700 pl-3">
                        <p className="text-amber-700 dark:text-amber-300 font-medium">追问 {i + 1}：{h.question}</p>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">回答：{h.answer}</p>
                      </div>
                    ))}
                  </div>
                )}
                <CardContent className="space-y-4">
                  <p className="text-gray-800 dark:text-gray-200">
                    {currentEvaluation.followUpQuestion}
                  </p>
                  <textarea
                    className="w-full p-3 border rounded-lg min-h-[100px] text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                    placeholder="请输入你的回答..."
                    value={followUpAnswer}
                    onChange={(e) => setFollowUpAnswer(e.target.value)}
                    disabled={followUpEvaluating}
                  />
                  <div className="flex justify-between items-center">
                    <VoiceInputButton
                      onTranscript={(text) =>
                        setFollowUpAnswer((prev) => prev + text)
                      }
                      disabled={followUpEvaluating}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowFollowUp(false);
                          setFollowUpAnswer("");
                        }}
                      >
                        跳过
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!followUpAnswer.trim()) return;
                          setFollowUpEvaluating(true);
                          try {
                            // 构建包含历史追问的上下文
                            const followUpContext = followUpHistory.length > 0
                              ? `此前追问：\n${followUpHistory.map((h, i) => `追问${i+1}：${h.question}\n回答：${h.answer}`).join("\n\n")}\n\n当前追问：${currentEvaluation!.followUpQuestion}\n当前回答：${followUpAnswer}`
                              : followUpAnswer;

                            const res = await fetch("/api/evaluate-answer", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                questionId: currentQuestion.id,
                                userAnswer: followUpContext,
                                question: currentEvaluation!.followUpQuestion,
                                sessionId: params.sessionId,
                              }),
                            });
                            if (res.ok) {
                              const data = await res.json();
                              const nextRound = followUpRound + 1;
                              const newHistory = [
                                ...followUpHistory,
                                { question: currentEvaluation!.followUpQuestion!, answer: followUpAnswer },
                              ];

                              // 更新评估结果
                              setCurrentEvaluation(data.evaluation);
                              setFollowUpHistory(newHistory);
                              setFollowUpRound(nextRound);
                              setFollowUpAnswer("");

                              // 判断是否继续追问
                              if (
                                data.evaluation.followUpQuestion &&
                                nextRound < MAX_FOLLOW_UP_ROUNDS &&
                                data.evaluation.score < 90
                              ) {
                                setShowFollowUp(true);
                                toast.success(`第 ${nextRound} 轮追问已完成，继续追问`);
                              } else {
                                setShowFollowUp(false);
                                toast.success("追问已完成");
                              }
                            }
                          } catch {
                            toast.error("提交失败");
                          } finally {
                            setFollowUpEvaluating(false);
                          }
                        }}
                        disabled={followUpEvaluating || !followUpAnswer.trim()}
                      >
                        {followUpEvaluating ? "评估中..." : "提交追问回答"}
                      </Button>
                    </div>
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
