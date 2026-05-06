"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { VoiceInputButton } from "@/components/voice-input-button";
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
  followUpQuestion?: string;
}

interface AnswerRecord {
  questionId: string;
  userAnswer: string;
  evaluation: Evaluation;
}

interface ChatMessage {
  role: "ai" | "user";
  content: string;
  round: number;
}

interface InterviewDialogueProps {
  sessionId: string;
  questions: Question[];
}

export function InterviewDialogue({
  sessionId,
  questions,
}: InterviewDialogueProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [currentEvaluation, setCurrentEvaluation] =
    useState<Evaluation | null>(null);
  const [concluded, setConcluded] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentQuestion = questions[currentIndex];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "行为面试":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "技术面试":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "项目追问":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 初始化第一题的开场白
  useEffect(() => {
    if (currentQuestion && messages.length === 0) {
      setMessages([
        {
          role: "ai",
          content: `你好，我们开始面试吧。请回答以下问题：\n\n${currentQuestion.content}`,
          round: 0,
        },
      ]);
    }
  }, [currentQuestion, messages.length]);

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || sending || concluded) return;

    const userMsg = inputValue.trim();
    setInputValue("");
    setSending(true);

    // 添加用户消息到界面
    const userMessage: ChatMessage = {
      role: "user",
      content: userMsg,
      round: messages.filter((m) => m.role === "user").length + 1,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch("/api/dialogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          userMessage: userMsg,
        }),
      });

      if (!response.ok) {
        throw new Error("对话请求失败");
      }

      const data = await response.json();

      // 添加 AI 回复到界面
      const aiMessage: ChatMessage = {
        role: "ai",
        content: data.aiMessage,
        round: userMessage.round,
      };
      setMessages((prev) => [...prev, aiMessage]);

      if (data.shouldConclude) {
        setConcluded(true);
        // 自动触发评估
        await handleEvaluate(userMsg);
      }
    } catch {
      toast.error("对话失败，请重试");
      // 移除失败的用户消息
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  // 评估当前问题
  const handleEvaluate = async (lastAnswer: string) => {
    setEvaluating(true);
    try {
      const allUserAnswers = messages
        .filter((m) => m.role === "user")
        .map((m) => m.content)
        .concat(lastAnswer ? [lastAnswer] : []);

      const response = await fetch("/api/evaluate-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          sessionId,
          userAnswer: allUserAnswers[0] + (allUserAnswers.length > 1 ? `（含${allUserAnswers.length}轮对话）` : ""),
          question: currentQuestion.content,
        }),
      });

      if (!response.ok) {
        throw new Error("评估失败");
      }

      const data = await response.json();
      setCurrentEvaluation(data.evaluation);
      setAnswers((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          userAnswer: allUserAnswers.join("\n"),
          evaluation: data.evaluation,
        },
      ]);
    } catch {
      toast.error("评估失败，请稍后重试");
    } finally {
      setEvaluating(false);
    }
  };

  // 手动结束当前题目
  const handleForceConclude = async () => {
    setConcluded(true);
    await handleEvaluate("");
  };

  // 进入下一题
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setMessages([]);
      setCurrentEvaluation(null);
      setConcluded(false);
      setInputValue("");
      textareaRef.current?.focus();
    } else {
      // 面试完成
      toast.success("面试完成！正在生成报告...");
      fetch("/api/update-session-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, status: "completed" }),
      }).catch(() => {});
      setTimeout(() => {
        router.push(`/interview/${sessionId}/report`);
      }, 1500);
    }
  };

  // 键盘提交
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 平均分
  const averageScore =
    answers.length > 0
      ? Math.round(
          answers.reduce((sum, a) => sum + a.evaluation.score, 0) /
            answers.length
        )
      : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
      {/* 左侧：对话区域 */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* 问题头部 */}
        <Card className="mb-4">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-500">
                  第 {currentIndex + 1}/{questions.length} 题
                </span>
                <Badge className={getCategoryColor(currentQuestion?.category || "")}>
                  {currentQuestion?.category}
                </Badge>
              </div>
              {!concluded && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleForceConclude}
                  disabled={sending || evaluating}
                >
                  结束此题
                </Button>
              )}
            </div>
            <CardTitle className="text-base mt-2">
              {currentQuestion?.content}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* 对话消息区域 */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "ai"
                    ? "bg-white dark:bg-gray-800 border shadow-sm"
                    : "bg-blue-600 text-white"
                }`}
              >
                <div className="text-xs font-medium mb-1 opacity-60">
                  {msg.role === "ai" ? "面试官" : "你"}
                </div>
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="animate-pulse">面试官正在思考...</span>
                </div>
              </div>
            </div>
          )}

          {evaluating && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border rounded-2xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="animate-pulse">正在评估回答...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 评估结果卡片 */}
        {currentEvaluation && (
          <Card className="mt-4 border-green-200 dark:border-green-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm text-gray-500">本题评分</span>
                <span
                  className={`text-2xl font-bold ${getScoreColor(currentEvaluation.score)}`}
                >
                  {currentEvaluation.score}
                </span>
              </div>
              {currentEvaluation.strengths.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-green-600 mb-1">
                    优点
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {currentEvaluation.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-green-500 mt-0.5">+</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {currentEvaluation.weaknesses.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-medium text-orange-600 mb-1">
                    不足
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {currentEvaluation.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-orange-500 mt-0.5">-</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {currentEvaluation.suggestion && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-blue-600 mb-1">
                    改进建议
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentEvaluation.suggestion}
                  </p>
                </div>
              )}
              <Button className="w-full" onClick={handleNext}>
                {currentIndex < questions.length - 1
                  ? "下一题"
                  : "查看面试报告"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 输入区域 */}
        {!concluded && !currentEvaluation && (
          <div className="mt-4 border-t pt-4">
            <div className="flex gap-2">
              <textarea
                ref={textareaRef}
                className="flex-1 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
                rows={3}
                placeholder="输入你的回答... (Enter 发送, Shift+Enter 换行)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={sending}
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || sending}
                  className="h-full"
                >
                  发送
                </Button>
              </div>
            </div>
            <div className="mt-2">
              <VoiceInputButton
                onTranscript={(text) =>
                  setInputValue((prev) => prev + text)
                }
                disabled={sending}
              />
            </div>
          </div>
        )}
      </div>

      {/* 右侧：统计面板 */}
      <div className="w-full lg:w-72 space-y-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">面试进度</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">已完成</span>
              <span className="font-medium">
                {answers.length}/{questions.length}
              </span>
            </div>
            <Progress
              value={(answers.length / questions.length) * 100}
              className="h-2"
            />
            {answers.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">平均分</span>
                <span className={`font-bold ${getScoreColor(averageScore)}`}>
                  {averageScore}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">题目列表</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {questions.map((q, i) => {
                const answer = answers.find(
                  (a) => a.questionId === q.id
                );
                const isCurrent = i === currentIndex;
                return (
                  <div
                    key={q.id}
                    className={`flex items-center gap-2 p-2 rounded text-sm cursor-pointer ${
                      isCurrent
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                        : answer
                          ? "text-gray-500"
                          : "text-gray-400"
                    }`}
                    onClick={() => {
                      if (answer || isCurrent) {
                        setCurrentIndex(i);
                        setMessages([]);
                        setCurrentEvaluation(null);
                        setConcluded(false);
                      }
                    }}
                  >
                    <span className="w-5 text-center">
                      {answer ? (
                        <span className="text-green-500">✓</span>
                      ) : isCurrent ? (
                        <span className="text-blue-500">●</span>
                      ) : (
                        <span>{i + 1}</span>
                      )}
                    </span>
                    <span className="truncate flex-1">{q.content}</span>
                    {answer && (
                      <span
                        className={`font-medium ${getScoreColor(answer.evaluation.score)}`}
                      >
                        {answer.evaluation.score}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
