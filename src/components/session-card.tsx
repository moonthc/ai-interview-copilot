"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { toast } from "sonner";

interface SessionCardProps {
  session: {
    id: string;
    jobTitle: string;
    date: Date;
    averageScore: number;
    answeredCount: number;
    totalQuestions: number;
    status: string;
  };
}

export function SessionCard({ session }: SessionCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "已完成";
      case "created":
        return "待开始";
      default:
        return status;
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这条面试记录吗？此操作不可撤销。")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch("/api/delete-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });

      if (!response.ok) {
        throw new Error("删除失败");
      }

      toast.success("面试记录已删除");
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
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{session.jobTitle}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(session.date).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <Badge variant={session.status === "completed" ? "success" : "warning"}>
            {getStatusText(session.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均分</p>
              <p className={`text-2xl font-bold ${getScoreColor(session.averageScore)}`}>
                {session.averageScore > 0 ? session.averageScore : "--"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">答题进度</p>
              <p className="text-lg font-semibold text-gray-900">
                {session.answeredCount}/{session.totalQuestions}
              </p>
            </div>
          </div>

          {/* 进度条 */}
          <Progress
            className="h-1.5"
            indicatorClassName="bg-blue-600"
            value={
              session.totalQuestions > 0
                ? Math.round(
                    (session.answeredCount / session.totalQuestions) * 100
                  )
                : 0
            }
          />

          <div className="flex gap-2 pt-2">
            <Link
              href={`/interview/${session.id}/report`}
              className="flex-1"
            >
              <Button variant="outline" className="w-full">
                查看报告
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
