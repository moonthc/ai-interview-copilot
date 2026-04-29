"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

interface DashboardHeaderProps {
  userName: string;
}

export function DashboardHeader({ userName }: DashboardHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          欢迎，<span className="font-medium text-gray-900">{userName}</span>
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          退出登录
        </Button>
      </div>
    </header>
  );
}
