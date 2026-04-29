"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import "@/styles/brand-illustration.css";

/* ── 内联 SVG 图标（避免引入额外依赖） ───────────────────── */

const MailIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

const GitHubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

/* ── 品牌 SVG 动画插图：面试场景 ──────────────────────────── */

const BrandIllustration = () => (
  <div className="relative w-80 h-64">
    <svg className="w-full h-full" viewBox="0 0 320 256" fill="none">
      {/* ══════════ 笔记本电脑外壳 ══════════ */}
      <g style={{ animation: "float-gentle 5s ease-in-out infinite" }}>
        {/* 屏幕 */}
        <rect x="64" y="32" width="192" height="128" rx="8" fill="rgba(15,23,42,0.6)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
        {/* 屏幕内框 */}
        <rect x="72" y="40" width="176" height="112" rx="4" fill="rgba(30,41,59,0.8)" />

        {/* ── 屏幕内容：面试对话 ── */}
        {/* 顶部状态栏 */}
        <rect x="72" y="40" width="176" height="18" rx="4" fill="rgba(51,65,85,0.6)" />
        <circle cx="84" cy="49" r="3" fill="#ef4444" opacity="0.7" />
        <circle cx="94" cy="49" r="3" fill="#f59e0b" opacity="0.7" />
        <circle cx="104" cy="49" r="3" fill="#22c55e" opacity="0.7" />
        <rect x="120" y="46" width="60" height="6" rx="3" fill="rgba(255,255,255,0.1)" />

        {/* AI 提问气泡（左侧） */}
        <g style={{ animation: "fade-in 1s ease-out 0.3s both" }}>
          <rect x="80" y="64" width="120" height="28" rx="6" fill="rgba(59,130,246,0.25)" stroke="rgba(59,130,246,0.35)" strokeWidth="0.8" />
          <circle cx="80" cy="78" r="6" fill="rgba(59,130,246,0.3)" />
          <text x="83" y="81" fontSize="5" fill="rgba(255,255,255,0.6)" fontFamily="sans-serif">AI</text>
          {/* 问题文字行 - 逐行出现 */}
          <rect x="92" y="72" width="72" height="4" rx="2" fill="rgba(255,255,255,0.35)">
            <animate attributeName="width" values="0;72" dur="0.6s" begin="0.8s" fill="freeze" />
          </rect>
          <rect x="92" y="80" width="56" height="4" rx="2" fill="rgba(255,255,255,0.2)">
            <animate attributeName="width" values="0;56" dur="0.5s" begin="1.2s" fill="freeze" />
          </rect>
        </g>

        {/* 候选人回答气泡（右侧） */}
        <g style={{ animation: "slide-right 0.8s ease-out 2s both" }}>
          <rect x="120" y="100" width="120" height="24" rx="6" fill="rgba(34,197,94,0.2)" stroke="rgba(34,197,94,0.3)" strokeWidth="0.8" />
          <rect x="132" y="108" width="60" height="4" rx="2" fill="rgba(255,255,255,0.3)" />
          <rect x="132" y="115" width="44" height="3" rx="1.5" fill="rgba(255,255,255,0.15)" />
        </g>

        {/* 打字光标 */}
        <rect x="94" y="72" width="1.5" height="8" rx="0.75" fill="rgba(255,255,255,0.6)" style={{ animation: "blink 0.8s step-end infinite" }} />

        {/* 评分弹出 */}
        <g style={{ transformOrigin: "210px 138px", animation: "score-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) 3s both" }}>
          <rect x="190" y="130" width="32" height="16" rx="4" fill="rgba(34,197,94,0.35)" stroke="rgba(34,197,94,0.5)" strokeWidth="0.8" />
          <text x="200" y="141" fontSize="7" fontWeight="bold" fill="#4ade80" fontFamily="sans-serif">92</text>
          {/* 对勾 */}
          <path d="M218 135 l3 3 l6 -6" stroke="#4ade80" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>

        {/* ── 键盘底座 ── */}
        <path d="M56 160 L64 160 L72 160 L248 160 L256 160 L264 160 L268 172 L52 172 Z" fill="rgba(51,65,85,0.5)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        {/* 键盘按键暗示 */}
        <rect x="96" y="163" width="128" height="4" rx="2" fill="rgba(255,255,255,0.06)" />
      </g>

      {/* ══════════ 左侧：AI 面试官头像 ══════════ */}
      <g style={{ animation: "float-gentle 6s ease-in-out 0.5s infinite" }}>
        {/* 身体轮廓 */}
        <path d="M20 180 Q20 148 44 148 L44 148 Q68 148 68 180 L68 200 L20 200 Z" fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.3)" strokeWidth="1" />
        {/* 头部 */}
        <circle cx="44" cy="132" r="20" fill="rgba(59,130,246,0.12)" stroke="rgba(59,130,246,0.3)" strokeWidth="1.2" />
        {/* AI 眼睛 - 扫描动画 */}
        <g style={{ transformOrigin: "36px 128px", animation: "eye-scan 3s ease-in-out infinite" }}>
          <rect x="32" y="126" width="8" height="4" rx="2" fill="rgba(96,165,250,0.8)" />
        </g>
        <g style={{ transformOrigin: "52px 128px", animation: "eye-scan 3s ease-in-out infinite" }}>
          <rect x="48" y="126" width="8" height="4" rx="2" fill="rgba(96,165,250,0.8)" />
        </g>
        {/* 嘴巴 - 声波 */}
        <path d="M36 140 Q40 137 44 140 Q48 143 52 140" stroke="rgba(96,165,250,0.5)" strokeWidth="1.2" strokeLinecap="round" fill="none">
          <animate attributeName="d" values="M36 140 Q40 137 44 140 Q48 143 52 140;M36 140 Q40 143 44 140 Q48 137 52 140;M36 140 Q40 137 44 140 Q48 143 52 140" dur="2s" repeatCount="indefinite" />
        </path>
        {/* 天线 */}
        <line x1="44" y1="112" x2="44" y2="104" stroke="rgba(96,165,250,0.4)" strokeWidth="1.2" />
        <circle cx="44" cy="102" r="3" fill="rgba(96,165,250,0.6)" style={{ animation: "pulse-glow 2s ease-in-out infinite" }} />
        {/* 标签 */}
        <text x="31" y="196" fontSize="7" fill="rgba(147,197,253,0.6)" fontFamily="sans-serif">AI</text>
      </g>

      {/* ══════════ 右侧：候选人头像 ══════════ */}
      <g style={{ animation: "float-gentle 5s ease-in-out 1s infinite" }}>
        {/* 身体轮廓 */}
        <path d="M252 180 Q252 148 276 148 L276 148 Q300 148 300 180 L300 200 L252 200 Z" fill="rgba(168,85,247,0.15)" stroke="rgba(168,85,247,0.3)" strokeWidth="1" />
        {/* 头部 */}
        <circle cx="276" cy="132" r="20" fill="rgba(168,85,247,0.12)" stroke="rgba(168,85,247,0.3)" strokeWidth="1.2" />
        {/* 眼睛 */}
        <circle cx="268" cy="128" r="2.5" fill="rgba(216,180,254,0.7)" />
        <circle cx="284" cy="128" r="2.5" fill="rgba(216,180,254,0.7)" />
        {/* 嘴巴 - 微笑 */}
        <path d="M268 139 Q276 144 284 139" stroke="rgba(216,180,254,0.5)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        {/* 头发 */}
        <path d="M258 122 Q266 108 276 110 Q286 108 294 122" stroke="rgba(168,85,247,0.3)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        {/* 标签 */}
        <text x="264" y="196" fontSize="7" fill="rgba(216,180,254,0.6)" fontFamily="sans-serif">候选人</text>
      </g>

      {/* ══════════ 数据流连线 ══════════ */}
      {/* AI → 笔记本 */}
      <path d="M68 150 Q80 145 80 155" stroke="rgba(96,165,250,0.2)" strokeWidth="1" strokeDasharray="3 3" fill="none" style={{ animation: "data-flow 2s linear infinite" }} />
      {/* 候选人 → 笔记本 */}
      <path d="M252 150 Q240 145 240 155" stroke="rgba(168,85,247,0.2)" strokeWidth="1" strokeDasharray="3 3" fill="none" style={{ animation: "data-flow 2s linear 0.5s infinite" }} />

      {/* ══════════ 漂浮粒子 ══════════ */}
      {[
        { cx: 30, cy: 60, r: 2, dx: "5px", dy: "-8px", dur: "7s" },
        { cx: 100, cy: 20, r: 1.5, dx: "-4px", dy: "-6px", dur: "8s" },
        { cx: 280, cy: 50, r: 2, dx: "3px", dy: "-7px", dur: "6s" },
        { cx: 290, cy: 100, r: 1.5, dx: "-5px", dy: "-4px", dur: "9s" },
        { cx: 160, cy: 190, r: 2, dx: "4px", dy: "6px", dur: "7s" },
        { cx: 15, cy: 180, r: 1.5, dx: "-3px", dy: "5px", dur: "8s" },
      ].map((p, i) => (
        <circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill="rgba(255,255,255,0.15)"
          style={{
            "--dx": p.dx,
            "--dy": p.dy,
            animation: `particle-float ${p.dur} ease-in-out ${i * 0.8}s infinite`,
          } as React.CSSProperties}
        />
      ))}

      {/* ══════════ 底部装饰文字 ══════════ */}
      <g style={{ animation: "fade-in 1s ease-out 2.5s both" }}>
        <text x="116" y="210" fontSize="8" fill="rgba(255,255,255,0.2)" fontFamily="sans-serif" letterSpacing="2">
          AI INTERVIEW
        </text>
        {/* 进度条 */}
        <rect x="100" y="218" width="120" height="2" rx="1" fill="rgba(255,255,255,0.06)" />
        <rect x="100" y="218" width="0" height="2" rx="1" fill="rgba(96,165,250,0.3)">
          <animate attributeName="width" values="0;120" dur="4s" begin="3s" fill="freeze" />
        </rect>
      </g>
    </svg>
  </div>
);

/* ── 登录页面 ─────────────────────────────────────────────── */

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  /* 表单验证 */
  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errs.email = "请输入邮箱地址";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "邮箱格式不正确";
    }
    if (!password) {
      errs.password = "请输入密码";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* 提交 */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("邮箱或密码错误");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("登录过程中发生错误");
    } finally {
      setLoading(false);
    }
  };

  /* 第三方登录 */
  const handleOAuth = (provider: "github" | "google") => {
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen">
      {/* ── 左侧品牌面板 ───────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 to-blue-900">
        {/* 装饰光晕 */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

        {/* 网格点阵 */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* 居中内容 */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
              <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">AI 面试助手</span>
          </div>

          {/* 插图 */}
          <BrandIllustration />

          {/* 标语 */}
          <h1 className="text-3xl xl:text-4xl font-bold text-white text-center leading-snug mt-8 mb-3">
            精准匹配岗位
            <br />
            模拟真实面试
          </h1>
          <p className="text-blue-200/60 text-sm text-center max-w-xs leading-relaxed">
            AI 驱动的智能面试平台，帮你自信应对每一场面试
          </p>
        </div>

        {/* 底部装饰线 */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
      </div>

      {/* ── 右侧登录表单 ───────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-[400px]">
          {/* 移动端 Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-blue-900 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">AI 面试助手</span>
          </div>

          {/* 标题 */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1.5">欢迎回来</h2>
            <p className="text-sm text-gray-500">请输入您的邮箱和密码登录</p>
          </div>

          {/* 全局错误 */}
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4.5" noValidate>
            {/* 邮箱 */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                邮箱
              </Label>
              <div className="relative">
                <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
                  }}
                  className={`h-11 pl-10 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all ${
                    fieldErrors.email ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* 密码 */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                密码
              </Label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                  }}
                  className={`h-11 pl-10 pr-10 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all ${
                    fieldErrors.password ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-[18px] h-[18px]" />
                  ) : (
                    <EyeIcon className="w-[18px] h-[18px]" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* 登录按钮 */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-slate-900 to-blue-800 hover:from-slate-800 hover:to-blue-700 text-white font-medium shadow-lg shadow-blue-900/20 hover:shadow-blue-900/30 transition-all duration-200 mt-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  登录中...
                </span>
              ) : "登录"}
            </Button>
          </form>

          {/* 分隔线 */}
          <div className="relative my-6">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 bg-white text-xs text-gray-400">
              或
            </span>
          </div>

          {/* 第三方登录 */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuth("github")}
              className="h-11 rounded-xl border-gray-200 hover:bg-gray-50 transition-all"
            >
              <GitHubIcon className="w-5 h-5 mr-2" />
              GitHub
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuth("google")}
              className="h-11 rounded-xl border-gray-200 hover:bg-gray-50 transition-all"
            >
              <GoogleIcon className="w-5 h-5 mr-2" />
              Google
            </Button>
          </div>

          {/* 底部链接 */}
          <p className="mt-8 text-center text-sm text-gray-500">
            还没有账号？{" "}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
