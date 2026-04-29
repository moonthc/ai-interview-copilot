"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

interface Resume {
  id: string;
  name: string;
  createdAt: string;
}

interface Question {
  id: string;
  category: string;
  content: string;
  order: number;
}

const PRESET_JOBS = [
  { title: "前端开发工程师", description: "负责 Web 前端开发，熟悉 React/Vue 等框架" },
  { title: "后端开发工程师", description: "负责后端服务开发，熟悉 Node.js/Java/Python 等" },
  { title: "全栈开发工程师", description: "负责前后端全栈开发" },
  { title: "产品经理", description: "负责产品规划、需求分析和项目管理" },
  { title: "UI/UX 设计师", description: "负责用户界面设计和用户体验优化" },
  { title: "数据分析师", description: "负责数据分析和可视化" },
  { title: "测试工程师", description: "负责软件测试和质量保证" },
  { title: "运维工程师", description: "负责系统运维和部署" },
];

export default function CreateInterviewPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 加载简历列表
  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await fetch("/api/resumes");
      if (response.ok) {
        const data = await response.json();
        setResumes(data);
      }
    } catch (error) {
      console.error("获取简历列表失败:", error);
    }
  };

  // 选择预设岗位
  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    const preset = PRESET_JOBS.find((j) => j.title === value);
    if (preset) {
      setJobTitle(preset.title);
      setJobDescription(preset.description);
    }
  };

  // 生成面试问题
  const handleGenerate = async () => {
    if (!jobTitle) {
      toast.error("请选择或输入岗位名称");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: selectedResumeId || null,
          jobTitle,
          jobDescription,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "生成失败");
      }

      const data = await response.json();
      console.log("API 返回数据:", data);
      console.log("问题列表:", data.questions);
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      toast.success("面试问题生成成功！");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "生成问题失败，请重试"
      );
    } finally {
      setLoading(false);
    }
  };

  // 更新问题内容
  const handleQuestionChange = (id: string, content: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, content } : q))
    );
  };

  // 更新问题类别
  const handleCategoryChange = (id: string, category: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, category } : q))
    );
  };

  // 删除问题
  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // 添加新问题
  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      category: "行为面试",
      content: "",
      order: questions.length + 1,
    };
    setQuestions((prev) => [...prev, newQuestion]);
  };

  // 保存问题
  const handleSave = async () => {
    if (!sessionId) {
      toast.error("请先生成面试问题");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/save-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questions: questions.map((q, index) => ({
            category: q.category,
            content: q.content,
            order: index + 1,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("保存失败");
      }

      const data = await response.json();
      setQuestions(data.questions);
      toast.success("问题保存成功！");
    } catch {
      toast.error("保存问题失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  // 获取类别颜色
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">创建面试</h2>
        <p className="text-gray-500">配置岗位信息，生成个性化面试问题</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：配置面板 */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>岗位信息</CardTitle>
                <CardDescription>选择预设岗位或手动输入</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>预设岗位</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedPreset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                  >
                    <option value="">选择预设岗位...</option>
                    {PRESET_JOBS.map((job) => (
                      <option key={job.title} value={job.title}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">岗位名称</Label>
                  <Input
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="输入岗位名称"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobDescription">岗位描述 (JD)</Label>
                  <Textarea
                    id="jobDescription"
                    className="min-h-[100px]"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="输入岗位描述..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>选择简历</CardTitle>
                <CardDescription>选择一份已上传的简历（可选）</CardDescription>
              </CardHeader>
              <CardContent>
                <select
                  className="w-full p-2 border rounded-md"
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                >
                  <option value="">不使用简历</option>
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.name} -{" "}
                      {new Date(resume.createdAt).toLocaleString("zh-CN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </option>
                  ))}
                </select>
                {resumes.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    暂无简历，请先上传简历
                  </p>
                )}
              </CardContent>
            </Card>

            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={loading || !jobTitle}
            >
              {loading ? "生成中..." : "生成面试问题"}
            </Button>
          </div>

          {/* 右侧：问题列表 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>面试问题</CardTitle>
                    <CardDescription>
                      {questions.length > 0
                        ? `共 ${questions.length} 道问题，可编辑内容和顺序`
                        : "生成后可编辑问题内容"}
                    </CardDescription>
                  </div>
                  {questions.length > 0 && (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleAddQuestion}>
                        添加问题
                      </Button>
                      <Button onClick={handleSave} disabled={saving}>
                        {saving ? "保存中..." : "保存修改"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {questions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">🎯</div>
                    <p>配置岗位信息后，点击「生成面试问题」开始</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="border rounded-lg p-4 bg-white"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-500">
                                #{index + 1}
                              </span>
                              <select
                                className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                                  question.category
                                )}`}
                                value={question.category}
                                onChange={(e) =>
                                  handleCategoryChange(
                                    question.id,
                                    e.target.value
                                  )
                                }
                              >
                                <option value="行为面试">行为面试</option>
                                <option value="技术面试">技术面试</option>
                                <option value="项目追问">项目追问</option>
                              </select>
                            </div>
                            <textarea
                              className="w-full p-2 border rounded-md min-h-[60px] text-sm"
                              value={question.content}
                              onChange={(e) =>
                                handleQuestionChange(
                                  question.id,
                                  e.target.value
                                )
                              }
                              placeholder="输入问题内容..."
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (index > 0) {
                                  const newQuestions = [...questions];
                                  [newQuestions[index - 1], newQuestions[index]] =
                                    [
                                      newQuestions[index],
                                      newQuestions[index - 1],
                                    ];
                                  setQuestions(newQuestions);
                                }
                              }}
                              disabled={index === 0}
                            >
                              ↑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (index < questions.length - 1) {
                                  const newQuestions = [...questions];
                                  [newQuestions[index], newQuestions[index + 1]] =
                                    [
                                      newQuestions[index + 1],
                                      newQuestions[index],
                                    ];
                                  setQuestions(newQuestions);
                                }
                              }}
                              disabled={index === questions.length - 1}
                            >
                              ↓
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() =>
                                handleDeleteQuestion(question.id)
                              }
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              {/* 开始面试按钮 */}
              {questions.length > 0 && sessionId && (
                <div className="px-6 pb-6">
                  <Link href={`/interview/${sessionId}`}>
                    <Button size="lg" className="w-full">
                      开始面试 ({questions.length} 道题)
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>
    </div>
  );
}
