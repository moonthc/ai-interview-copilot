"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface RadarDimension {
  dimension: string;
  value: number;
}

interface AISummary {
  summary: string;
  skillMatch: string;
  communication: string;
  recommendations: string[];
  radarData: RadarDimension[];
}

interface CategoryAverage {
  category: string;
  averageScore: number;
  count: number;
}

interface DialogueMessage {
  role: string;
  content: string;
  round: number;
}

interface QuestionDetail {
  index: number;
  category: string;
  content: string;
  userAnswer: string | null;
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestion: string;
  followUpQuestion?: string | null;
  dialogueMessages?: DialogueMessage[];
}

interface ReportData {
  session: {
    id: string;
    jobTitle: string;
    createdAt: string;
  };
  stats: {
    totalQuestions: number;
    answeredQuestions: number;
    totalScore: number;
    averageScore: number;
    categoryAverages: CategoryAverage[];
  };
  aiSummary: AISummary;
  questions: QuestionDetail[];
}

export default function ReportPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const router = useRouter();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const fetchReport = async () => {
    try {
      const res = await fetch(
        `/api/session-report?sessionId=${params.sessionId}`
      );
      if (!res.ok) throw new Error("获取报告失败");
      const result = await res.json();
      setData(result);
    } catch {
      toast.error("加载报告失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.sessionId]);

  const getScoreColorClass = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "优秀";
    if (score >= 80) return "良好";
    if (score >= 70) return "中等";
    if (score >= 60) return "及格";
    return "不及格";
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "行为面试":
        return "bg-blue-100 text-blue-800";
      case "技术面试":
        return "bg-green-100 text-green-800";
      case "项目追问":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleExportJSON = () => {
    if (!data) return;

    // 构建结构化 JSON，字段与数据库表对应，方便后续 SQL 导入
    const exportData = {
      // === InterviewSession ===
      session: {
        id: data.session.id,
        jobTitle: data.session.jobTitle,
        createdAt: data.session.createdAt,
        exportedAt: new Date().toISOString(),
      },
      // === 统计汇总 ===
      stats: {
        totalQuestions: data.stats.totalQuestions,
        answeredQuestions: data.stats.answeredQuestions,
        totalScore: data.stats.totalScore,
        averageScore: data.stats.averageScore,
        categoryAverages: data.stats.categoryAverages,
      },
      // === AI 综合评价 ===
      aiSummary: {
        summary: data.aiSummary.summary,
        skillMatch: data.aiSummary.skillMatch,
        communication: data.aiSummary.communication,
        recommendations: data.aiSummary.recommendations,
        radarData: data.aiSummary.radarData,
      },
      // === Question + Answer（每题一条，对应 questions + answers 表）===
      questions: data.questions.map((q) => ({
        order: q.index,
        category: q.category,
        content: q.content,
        answer: q.userAnswer
          ? {
              userAnswer: q.userAnswer,
              score: q.score,
              feedback: {
                strengths: q.strengths,
                weaknesses: q.weaknesses,
                suggestion: q.suggestion,
              },
            }
          : null,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `面试报告_${data.session.jobTitle}_${new Date(
      data.session.createdAt
    )
      .toLocaleDateString("zh-CN")
      .replace(/\//g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON 导出成功");
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#f9fafb",
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? "landscape" : "portrait",
        unit: "px",
        format: [imgWidth / 2, imgHeight / 2],
      });

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth / 2, imgHeight / 2);
      pdf.save(`面试报告_${data?.session.jobTitle || "report"}.pdf`);
      toast.success("PDF 导出成功");
    } catch (e) {
      console.error("PDF 导出失败:", e);
      toast.error("PDF 导出失败");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">AI 正在生成面试报告...</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">这可能需要一些时间</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-gray-600">报告加载失败</p>
          <Button className="mt-4" onClick={() => router.push("/dashboard")}>
            返回仪表板
          </Button>
        </div>
      </div>
    );
  }

  const barChartColors = [
    "#2563eb",
    "#16a34a",
    "#ca8a04",
    "#ea580c",
    "#dc2626",
    "#7c3aed",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              面试评估报告
            </h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportJSON}>
                📋 导出 JSON
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={exporting}
              >
                {exporting ? "导出中..." : "📄 导出 PDF"}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
              >
                返回仪表板
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 报告内容区域 */}
      <main ref={reportRef} className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* 总览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <div
                className={`text-5xl font-bold ${getScoreColorClass(
                  data.stats.averageScore
                )}`}
              >
                {data.stats.averageScore}
              </div>
              <p className="text-sm text-gray-500 mt-1">平均分</p>
              <p
                className={`text-base font-medium ${getScoreColorClass(
                  data.stats.averageScore
                )}`}
              >
                {getScoreGrade(data.stats.averageScore)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-5xl font-bold text-gray-900">
                {data.stats.answeredQuestions}/{data.stats.totalQuestions}
              </div>
              <p className="text-sm text-gray-500 mt-1">完成题目</p>
              <p className="text-base font-medium text-gray-700">
                {Math.round(
                  (data.stats.answeredQuestions /
                    data.stats.totalQuestions) *
                    100
                )}
                % 完成
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-gray-900 truncate">
                {data.session.jobTitle}
              </div>
              <p className="text-sm text-gray-500 mt-1">面试岗位</p>
              <p className="text-base font-medium text-gray-700">
                {new Date(data.session.createdAt).toLocaleDateString("zh-CN")}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-5xl font-bold text-gray-900">
                {data.stats.totalScore}
              </div>
              <p className="text-sm text-gray-500 mt-1">总分</p>
              <p className="text-base font-medium text-gray-700">
                满分 {data.stats.totalQuestions * 100}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI 综合评价 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🤖</span> AI 综合评价
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-800 leading-relaxed">
                {data.aiSummary.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-700 mb-2">
                  🎯 技能匹配度
                </h4>
                <p className="text-sm text-gray-700">
                  {data.aiSummary.skillMatch}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-700 mb-2">
                  💬 沟通表现
                </h4>
                <p className="text-sm text-gray-700">
                  {data.aiSummary.communication}
                </p>
              </div>
            </div>

            {data.aiSummary.recommendations.length > 0 && (
              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-medium text-amber-700 mb-2">
                  📚 推荐学习资源
                </h4>
                <ul className="space-y-1">
                  {data.aiSummary.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-gray-700">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 雷达图和分类得分 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 雷达图 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">能力雷达图</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={data.aiSummary.radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fill: "#374151", fontSize: 13 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                  />
                  <Radar
                    name="能力得分"
                    dataKey="value"
                    stroke="#2563eb"
                    fill="#2563eb"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 分类得分柱状图 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">分类得分</CardTitle>
            </CardHeader>
            <CardContent>
              {data.stats.categoryAverages.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={data.stats.categoryAverages}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="category"
                      tick={{ fill: "#374151", fontSize: 12 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                      formatter={(value) => [`${value} 分`, "平均分"]}
                    />
                    <Bar dataKey="averageScore" radius={[6, 6, 0, 0]}>
                      {data.stats.categoryAverages.map((_, index) => (
                        <Cell
                          key={index}
                          fill={
                            barChartColors[index % barChartColors.length]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[350px] text-gray-400">
                  暂无分类数据
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 每题详情 */}
        <Card>
          <CardHeader>
            <CardTitle>题目详情</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {data.questions.map((q) => (
                <div
                  key={q.index}
                  className="border rounded-lg p-5 bg-white"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                            q.category
                          )}`}
                        >
                          {q.category}
                        </span>
                        <span className="text-sm text-gray-500">
                          第 {q.index} 题
                        </span>
                      </div>
                      <h3 className="text-base font-medium text-gray-900">
                        {q.content}
                      </h3>
                    </div>
                    {q.userAnswer && (
                      <div
                        className={`text-3xl font-bold ${getScoreColorClass(
                          q.score
                        )}`}
                      >
                        {q.score}
                      </div>
                    )}
                  </div>

                  {q.userAnswer ? (
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          你的回答
                        </h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                          {q.userAnswer}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {q.strengths.length > 0 && (
                          <div className="bg-green-50 p-3 rounded-lg">
                            <h4 className="text-sm font-medium text-green-700 mb-1">
                              ✅ 优点
                            </h4>
                            <ul className="space-y-0.5">
                              {q.strengths.map((s, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-green-800"
                                >
                                  • {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {q.weaknesses.length > 0 && (
                          <div className="bg-orange-50 p-3 rounded-lg">
                            <h4 className="text-sm font-medium text-orange-700 mb-1">
                              ⚠️ 不足
                            </h4>
                            <ul className="space-y-0.5">
                              {q.weaknesses.map((w, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-orange-800"
                                >
                                  • {w}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {q.suggestion && (
                          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-1">
                              💡 建议
                            </h4>
                            <p className="text-xs text-blue-800 dark:text-blue-300">
                              {q.suggestion}
                            </p>
                          </div>
                        )}
                        {q.followUpQuestion && (
                          <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                            <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                              💬 AI 追问
                            </h4>
                            <p className="text-xs text-amber-800 dark:text-amber-300">
                              {q.followUpQuestion}
                            </p>
                          </div>
                        )}
                        {q.dialogueMessages && q.dialogueMessages.length > 0 && (
                          <details className="mt-3">
                            <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100">
                              💬 对话记录 ({q.dialogueMessages.length} 条)
                            </summary>
                            <div className="mt-2 space-y-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                              {q.dialogueMessages.map((msg, i) => (
                                <div key={i}>
                                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {msg.role === "ai" ? "面试官" : "候选人"}
                                  </span>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {msg.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">未作答</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 底部操作 */}
        <div className="flex justify-center gap-4 print:hidden">
          <Button size="lg" variant="outline" onClick={handleExportJSON}>
            📋 导出 JSON
          </Button>
          <Button
            size="lg"
            onClick={handleExportPDF}
            disabled={exporting}
          >
            {exporting ? "导出中..." : "📄 导出 PDF"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push("/dashboard/create-interview")}
          >
            重新面试
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            返回仪表板
          </Button>
        </div>
      </main>
    </div>
  );
}
