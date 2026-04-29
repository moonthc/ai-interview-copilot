"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function UploadResumePage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploading(true);
      setProgress(0);

      try {
        // 模拟上传进度
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 200);

        // 创建 FormData
        const formData = new FormData();
        formData.append("file", file);

        // 上传文件
        const uploadResponse = await fetch("/api/upload-resume", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!uploadResponse.ok) {
          const data = await uploadResponse.json();
          throw new Error(data.error || "上传失败");
        }

        const uploadData = await uploadResponse.json();
        setProgress(100);
        setUploading(false);
        setParsing(true);
        toast.success("文件上传成功，正在解析...");

        // 调用解析 API
        const parseResponse = await fetch("/api/parse-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeId: uploadData.resumeId,
            filePath: uploadData.filePath,
          }),
        });

        if (!parseResponse.ok) {
          const data = await parseResponse.json();
          throw new Error(data.error || "解析失败");
        }

        const parseData = await parseResponse.json();
        setParsing(false);
        toast.success("简历解析完成！");

        // 跳转到详情页
        router.push(`/dashboard/resumes/${parseData.resumeId}`);
      } catch (error) {
        setUploading(false);
        setParsing(false);
        setProgress(0);
        toast.error(
          error instanceof Error ? error.message : "上传或解析失败，请重试"
        );
      }
    },
    [router]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
    disabled: uploading || parsing,
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">上传简历</h2>
        <p className="text-gray-500">支持 PDF 和图片格式（PNG、JPG），最大 5MB</p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>上传简历文件</CardTitle>
            <CardDescription>
              支持 PDF 和图片格式（PNG、JPG），最大 5MB
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : uploading || parsing
                  ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              }`}
            >
              <input {...getInputProps()} />

              {uploading ? (
                <div className="space-y-4">
                  <div className="text-4xl">📤</div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      上传中...
                    </p>
                    <div className="mt-4 w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">{progress}%</p>
                  </div>
                </div>
              ) : parsing ? (
                <div className="space-y-4">
                  <div className="text-4xl animate-spin">⚙️</div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      AI 正在解析简历...
                    </p>
                    <p className="text-sm text-gray-500">
                      这可能需要几秒钟，请稍候
                    </p>
                  </div>
                </div>
              ) : isDragActive ? (
                <div className="space-y-4">
                  <div className="text-4xl">📥</div>
                  <p className="text-lg font-medium text-blue-600">
                    释放鼠标上传文件
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-4xl">📄</div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      拖拽简历文件到这里
                    </p>
                    <p className="text-sm text-gray-500">
                      或者点击选择文件
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    支持 PDF、PNG、JPG 格式，最大 5MB
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
