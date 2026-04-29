"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Resume {
  id: string;
  name: string;
  createdAt: string;
}

interface ParsedJd {
  requiredSkills?: string[];
  experienceLevel?: string;
  educationRequirement?: string;
  keyResponsibilities?: string[];
  preferredSkills?: string[];
}

interface MatchResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  gapAnalysis: string;
}

interface QuestionItem {
  category: string;
  difficulty: string;
  question: string;
}

interface JdAnalysisPanelProps {
  positionId: string;
  parsedJd: ParsedJd | null;
  matchResult: MatchResult | null;
  questionBank: QuestionItem[] | null;
}

export function JdAnalysisPanel({
  positionId,
  parsedJd: initialParsedJd,
  matchResult: initialMatchResult,
  questionBank: initialQuestionBank,
}: JdAnalysisPanelProps) {
  const router = useRouter();
  const [parsedJd, setParsedJd] = useState<ParsedJd | null>(initialParsedJd);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(
    initialMatchResult
  );
  const [questionBank, setQuestionBank] = useState<QuestionItem[] | null>(
    initialQuestionBank
  );
  const [parsingJd, setParsingJd] = useState(false);
  const [matching, setMatching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");

  useEffect(() => {
    fetch("/api/resumes")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setResumes(data);
      })
      .catch(() => {});
  }, []);

  const handleParseJd = async () => {
    setParsingJd(true);
    try {
      const res = await fetch(`/api/positions/${positionId}/parse-jd`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "解析失败");
      }
      const data = await res.json();
      setParsedJd(data.parsedJd);
      toast.success("JD 解析完成");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "解析失败");
    } finally {
      setParsingJd(false);
    }
  };

  const handleMatchResume = async () => {
    if (!selectedResumeId) {
      toast.error("请先选择简历");
      return;
    }
    setMatching(true);
    try {
      const res = await fetch(`/api/positions/${positionId}/match-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: selectedResumeId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "分析失败");
      }
      const data = await res.json();
      setMatchResult(data.matchResult);
      toast.success("匹配分析完成");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "分析失败");
    } finally {
      setMatching(false);
    }
  };

  const handleGenerateBank = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/positions/${positionId}/question-bank`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "生成失败");
      }
      const data = await res.json();
      setQuestionBank(data.questions);
      toast.success("题库生成完成");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "生成失败");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* JD 解析 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">📋 JD 智能解析</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleParseJd}
              disabled={parsingJd}
            >
              {parsingJd
                ? "解析中..."
                : parsedJd
                ? "重新解析"
                : "AI 解析 JD"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {parsedJd ? (
            <div className="space-y-4">
              {parsedJd.experienceLevel && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    经验要求
                  </p>
                  <p className="text-sm text-gray-800">
                    {parsedJd.experienceLevel}
                  </p>
                </div>
              )}
              {parsedJd.educationRequirement && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    学历要求
                  </p>
                  <p className="text-sm text-gray-800">
                    {parsedJd.educationRequirement}
                  </p>
                </div>
              )}
              {parsedJd.requiredSkills &&
                parsedJd.requiredSkills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      必需技能
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {parsedJd.requiredSkills.map((s, i) => (
                        <Badge key={i} variant="danger">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              {parsedJd.preferredSkills &&
                parsedJd.preferredSkills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      加分技能
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {parsedJd.preferredSkills.map((s, i) => (
                        <Badge key={i} variant="info">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              {parsedJd.keyResponsibilities &&
                parsedJd.keyResponsibilities.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      核心职责
                    </p>
                    <ul className="space-y-1">
                      {parsedJd.keyResponsibilities.map((r, i) => (
                        <li key={i} className="text-sm text-gray-700">
                          • {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              点击「AI 解析 JD」提取岗位关键信息
            </p>
          )}
        </CardContent>
      </Card>

      {/* 简历匹配 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🎯 简历匹配度分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 mb-2">
                  选择简历
                </p>
                <select
                  className="w-full p-2 border rounded-md text-sm"
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                >
                  <option value="">请选择简历...</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleMatchResume}
                disabled={matching || !selectedResumeId}
              >
                {matching ? "分析中..." : "开始匹配"}
              </Button>
            </div>

            {matchResult && (
              <div className="space-y-4 pt-2">
                {/* 匹配百分比 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500">
                      匹配度
                    </span>
                    <span
                      className={`text-2xl font-bold ${
                        matchResult.matchPercentage >= 80
                          ? "text-green-600"
                          : matchResult.matchPercentage >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {matchResult.matchPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        matchResult.matchPercentage >= 80
                          ? "bg-green-500"
                          : matchResult.matchPercentage >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${matchResult.matchPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* 匹配技能 */}
                {matchResult.matchedSkills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-2">
                      ✅ 匹配技能
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {matchResult.matchedSkills.map((s, i) => (
                        <Badge key={i} variant="success">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 缺失技能 */}
                {matchResult.missingSkills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-red-700 mb-2">
                      ⚠️ 缺失技能
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {matchResult.missingSkills.map((s, i) => (
                        <Badge key={i} variant="danger">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 差距分析 */}
                {matchResult.gapAnalysis && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-700 mb-1">
                      💡 差距分析
                    </p>
                    <p className="text-sm text-blue-800">
                      {matchResult.gapAnalysis}
                    </p>
                  </div>
                )}
              </div>
            )}

            {!matchResult && (
              <p className="text-sm text-gray-400">
                选择简历后点击「开始匹配」分析简历与岗位的匹配度
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 面试题库 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">📚 岗位面试题库</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateBank}
              disabled={generating}
            >
              {generating
                ? "生成中..."
                : questionBank
                ? "重新生成"
                : "生成题库"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {questionBank && questionBank.length > 0 ? (
            <div className="space-y-3">
              {questionBank.map((q, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-3 bg-white"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={q.category === "技术面试" ? "success" : q.category === "项目追问" ? "info" : "secondary"}
                      className={q.category === "项目追问" ? "bg-purple-100 text-purple-800 border-purple-200" : q.category === "情景模拟" ? "bg-orange-100 text-orange-800 border-orange-200" : undefined}
                    >
                      {q.category}
                    </Badge>
                    <Badge variant={q.difficulty === "困难" ? "danger" : q.difficulty === "中等" ? "warning" : "success"}>
                      {q.difficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-800">{q.question}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              点击「生成题库」为该岗位生成专属面试题
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
