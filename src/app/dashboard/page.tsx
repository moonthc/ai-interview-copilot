import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "我的简历",
    description: "管理你的简历信息",
    detail: "上传并解析你的简历，让 AI 更好地了解你的背景。",
    href: "/dashboard/resumes",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: "bg-blue-50 text-blue-600",
    button: "管理简历",
  },
  {
    title: "岗位分析",
    description: "JD 解析、匹配度分析、面试题库",
    detail: "管理目标岗位，AI 解析 JD、分析简历匹配度、生成专属题库。",
    href: "/dashboard/positions",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    color: "bg-purple-50 text-purple-600",
    button: "查看岗位",
  },
  {
    title: "模拟面试",
    description: "开始 AI 面试练习",
    detail: "基于你的简历和目标岗位，进行个性化的面试模拟。",
    href: "/dashboard/create-interview",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: "bg-green-50 text-green-600",
    button: "开始面试",
  },
  {
    title: "面试历史",
    description: "查看过往面试记录",
    detail: "回顾你的面试表现，查看历史报告和评分。",
    href: "/dashboard/history",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "bg-orange-50 text-orange-600",
    button: "查看历史",
  },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          欢迎回来
        </h2>
        <p className="text-gray-500">准备好开始你的面试之旅了吗？</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {features.map((feature) => (
          <Card key={feature.href} className="hover:shadow-md transition-shadow group">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${feature.color} group-hover:scale-105 transition-transform`}
                >
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">{feature.detail}</p>
              <Link href={feature.href}>
                <Button className="w-full">{feature.button}</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
