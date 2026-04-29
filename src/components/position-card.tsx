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
import Link from "next/link";
import { toast } from "sonner";

interface ParsedJd {
  requiredSkills?: string[];
  experienceLevel?: string;
  educationRequirement?: string;
}

interface PositionCardProps {
  position: {
    id: string;
    title: string;
    description: string | null;
    parsedJd: ParsedJd | null;
    sessionCount: number;
    createdAt: Date;
  };
}

export function PositionCard({ position }: PositionCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("确定要删除这个岗位吗？关联的面试记录也将被删除。")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/positions/${position.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("删除失败");
      }

      toast.success("岗位已删除");
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
          <CardTitle className="text-lg">{position.title}</CardTitle>
          {position.sessionCount > 0 && (
            <Badge variant="info">{position.sessionCount} 次面试</Badge>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {new Date(position.createdAt).toLocaleDateString("zh-CN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {position.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {position.description}
            </p>
          )}

          {position.parsedJd?.requiredSkills &&
            position.parsedJd.requiredSkills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {position.parsedJd.requiredSkills.slice(0, 5).map((skill, i) => (
                  <Badge key={i} variant="success">{skill}</Badge>
                ))}
                {position.parsedJd.requiredSkills.length > 5 && (
                  <Badge variant="secondary">
                    +{position.parsedJd.requiredSkills.length - 5}
                  </Badge>
                )}
              </div>
            )}

          <div className="flex gap-2 pt-2">
            <Link
              href={`/dashboard/positions/${position.id}`}
              className="flex-1"
            >
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
