import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <main className="flex flex-col items-center gap-8 px-4 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            AI 面试助手
          </h1>
          <p className="mx-auto max-w-xl text-lg text-gray-600">
            智能面试准备工具，帮助你轻松应对每一场面试
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/login">
            <Button size="lg" className="px-8">
              登录
            </Button>
          </Link>
          <Link href="/register">
            <Button size="lg" variant="outline" className="px-8">
              注册新账户
            </Button>
          </Link>
        </div>

        <div className="mt-8 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-3 text-3xl">📝</div>
            <h3 className="mb-2 font-semibold text-gray-900">简历管理</h3>
            <p className="text-sm text-gray-600">
              上传并解析你的简历，让 AI 了解你的背景
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-3 text-3xl">🎯</div>
            <h3 className="mb-2 font-semibold text-gray-900">岗位分析</h3>
            <p className="text-sm text-gray-600">
              添加目标岗位，AI 将针对性地准备面试问题
            </p>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-3 text-3xl">🤖</div>
            <h3 className="mb-2 font-semibold text-gray-900">模拟面试</h3>
            <p className="text-sm text-gray-600">
              进行个性化面试模拟，获得实时反馈
            </p>
          </div>
        </div>
      </main>

      <footer className="mt-16 text-sm text-gray-500">
        © 2024 AI 面试助手. All rights reserved.
      </footer>
    </div>
  );
}
