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
  params: { id: string };
}

interface Experience {
  company?: string;
  position?: string;
  duration?: string;
  description?: string;
}

interface Education {
  school?: string;
  degree?: string;
  major?: string;
  duration?: string;
}

interface ParsedContent {
  name?: string;
  skills?: string[];
  experience?: (Experience | string)[];
  education?: (Education | string)[];
  summary?: string;
}

export default async function ResumeDetailPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const resume = await prisma.resume.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  });

  if (!resume) {
    notFound();
  }

  const parsedContent = resume.parsedContent as ParsedContent | null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">简历详情</h2>
          <p className="text-gray-500">
            上传于{" "}
            {new Date(resume.createdAt).toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <Link href="/dashboard/resumes">
          <Button variant="outline" size="sm">返回简历列表</Button>
        </Link>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* 基本信息 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>
              上传于{" "}
              {new Date(resume.createdAt).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">文件路径</p>
                <p className="mt-1 text-sm text-gray-900">{resume.filePath}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">姓名</p>
                <p className="mt-1 text-sm text-gray-900">
                  {parsedContent?.name || "未提取"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {parsedContent ? (
          <>
            {/* 个人摘要 */}
            {parsedContent.summary && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>个人摘要</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{parsedContent.summary}</p>
                </CardContent>
              </Card>
            )}

            {/* 技能 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>技能</CardTitle>
                <CardDescription>
                  共 {parsedContent.skills?.length || 0} 项技能
                </CardDescription>
              </CardHeader>
              <CardContent>
                {parsedContent.skills && parsedContent.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {parsedContent.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">未提取到技能信息</p>
                )}
              </CardContent>
            </Card>

            {/* 工作经历 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>工作经历</CardTitle>
                <CardDescription>
                  共 {parsedContent.experience?.length || 0} 段经历
                </CardDescription>
              </CardHeader>
              <CardContent>
                {parsedContent.experience &&
                parsedContent.experience.length > 0 ? (
                  <ul className="space-y-4">
                    {parsedContent.experience.map((exp, index) => (
                      <li
                        key={index}
                        className="p-4 bg-gray-50 rounded-lg border"
                      >
                        {typeof exp === "string" ? (
                          <p className="text-gray-700">{exp}</p>
                        ) : (
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {exp.position}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {exp.company}
                                </p>
                              </div>
                              {exp.duration && (
                                <span className="text-sm text-gray-500">
                                  {exp.duration}
                                </span>
                              )}
                            </div>
                            {exp.description && (
                              <p className="text-gray-700 mt-2">
                                {exp.description}
                              </p>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">未提取到工作经历</p>
                )}
              </CardContent>
            </Card>

            {/* 教育背景 */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>教育背景</CardTitle>
                <CardDescription>
                  共 {parsedContent.education?.length || 0} 条记录
                </CardDescription>
              </CardHeader>
              <CardContent>
                {parsedContent.education &&
                parsedContent.education.length > 0 ? (
                  <ul className="space-y-4">
                    {parsedContent.education.map((edu, index) => (
                      <li
                        key={index}
                        className="p-4 bg-gray-50 rounded-lg border"
                      >
                        {typeof edu === "string" ? (
                          <p className="text-gray-700">{edu}</p>
                        ) : (
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {edu.school}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {edu.degree} {edu.major && `- ${edu.major}`}
                                </p>
                              </div>
                              {edu.duration && (
                                <span className="text-sm text-gray-500">
                                  {edu.duration}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">未提取到教育背景</p>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-4xl mb-4">📄</div>
              <p className="text-gray-500">简历尚未解析</p>
              <Link href="/dashboard/upload-resume">
                <Button className="mt-4">重新上传解析</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
