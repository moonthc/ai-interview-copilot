"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export function PositionCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("请输入岗位名称");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "创建失败");
      }

      toast.success("岗位创建成功");
      setTitle("");
      setDescription("");
      setExpanded(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "创建失败");
    } finally {
      setLoading(false);
    }
  };

  if (!expanded) {
    return (
      <div className="mb-6">
        <Button onClick={() => setExpanded(true)}>+ 添加岗位</Button>
      </div>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>添加新岗位</CardTitle>
        <CardDescription>填写岗位信息，后续可用 AI 进行分析</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">岗位名称</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="如：前端开发工程师"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">岗位描述 (JD)</Label>
          <Textarea
            id="description"
            className="min-h-[120px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="粘贴完整的岗位描述，AI 将自动解析..."
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "创建中..." : "创建岗位"}
          </Button>
          <Button variant="outline" onClick={() => setExpanded(false)}>
            取消
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
