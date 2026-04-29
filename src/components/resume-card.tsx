"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";

interface ResumeCardProps {
  resume: {
    id: string;
    filePath: string;
    createdAt: Date;
    parsedContent: unknown;
  };
}

export function ResumeCard({ resume }: ResumeCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const parsedContent = resume.parsedContent as {
    name?: string;
    skills?: string[];
  } | null;

  const handleDelete = async () => {
    if (!confirm("确定要删除这份简历吗？此操作不可撤销。")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch("/api/delete-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: resume.id }),
      });

      if (!response.ok) {
        throw new Error("删除失败");
      }

      toast.success("简历已删除");
      router.refresh();
    } catch {
      toast.error("删除失败，请重试");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">
          {parsedContent?.name || "未命名简历"}
        </CardTitle>
        <CardDescription>
          {new Date(resume.createdAt).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {parsedContent?.skills && parsedContent.skills.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2">技能</p>
              <div className="flex flex-wrap gap-1">
                {parsedContent.skills.slice(0, 5).map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs"
                  >
                    {skill}
                  </span>
                ))}
                {parsedContent.skills.length > 5 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    +{parsedContent.skills.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Link href={`/dashboard/resumes/${resume.id}`} className="flex-1">
              <Button variant="outline" className="w-full">
                查看详情
              </Button>
            </Link>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "删除中..." : "删除"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
