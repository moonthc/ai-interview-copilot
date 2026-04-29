# AI 面试助手 (AI Interview Copilot)

一个基于 Next.js 14 的智能面试准备工具，使用 AI 技术帮助用户准备面试。

## 技术栈

- **前端**: Next.js 14 App Router, TypeScript, Tailwind CSS, Shadcn/ui
- **后端**: Next.js API Routes, Prisma ORM
- **数据库**: MySQL
- **认证**: NextAuth v5 (Beta)
- **AI**: OpenAI API (预留)

## 功能特性

- 用户注册/登录系统
- 简历管理与解析
- 岗位信息管理
- AI 面试模拟 (待实现)
- 面试问题生成 (待实现)

## 快速开始

### 前置要求

- Node.js 18+
- MySQL 数据库
- npm 或 yarn

### 安装步骤

1. **克隆项目**
   ```bash
   cd ai-interview-copilot
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   编辑 `.env` 文件，配置数据库连接：
   ```env
   DATABASE_URL="mysql://用户名:密码@localhost:3306/ai_interview_copilot"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **创建数据库**
   ```sql
   CREATE DATABASE ai_interview_copilot;
   ```

5. **运行数据库迁移**
   ```bash
   npx prisma db push
   ```

6. **启动开发服务器**
   ```bash
   npm run dev
   ```

7. **访问应用**
   打开浏览器访问 http://localhost:3000

## 项目结构

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  # NextAuth API 路由
│   │   └── register/            # 注册 API
│   ├── dashboard/               # 受保护的仪表板页面
│   ├── login/                   # 登录页面
│   ├── register/                # 注册页面
│   ├── layout.tsx               # 根布局
│   └── page.tsx                 # 首页
├── components/
│   ├── ui/                      # Shadcn/ui 组件
│   └── providers.tsx            # Session Provider
├── lib/
│   ├── prisma.ts                # Prisma 客户端
│   ├── password.ts              # 密码哈希工具
│   └── utils.ts                 # 工具函数
├── auth.ts                      # NextAuth 配置
└── middleware.ts                 # 路由保护中间件
```

## 数据库模型

- **User**: 用户信息
- **Resume**: 简历信息
- **JobPosition**: 岗位信息
- **InterviewSession**: 面试会话
- **Question**: 面试问题
- **Answer**: 用户回答

## 认证系统

- 使用 NextAuth v5 (Beta)
- 支持邮箱/密码登录
- JWT 会话策略
- 自动保护 `/dashboard` 路由

## 开发指南

### 添加新页面

1. 在 `src/app/` 目录下创建新文件夹
2. 添加 `page.tsx` 文件
3. 如需保护路由，在 `middleware.ts` 中添加路径

### 数据库操作

```typescript
import { prisma } from "@/lib/prisma";

// 创建用户
const user = await prisma.user.create({
  data: { email, name, passwordHash }
});

// 查询用户
const user = await prisma.user.findUnique({
  where: { email }
});
```

## 部署

### Vercel 部署

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量
4. 部署

### Docker 部署

```bash
# 构建镜像
docker build -t ai-interview-copilot .

# 运行容器
docker run -p 3000:3000 ai-interview-copilot
```

## 待实现功能

- [ ] 简历上传与解析
- [ ] 岗位信息管理
- [ ] AI 面试问题生成
- [ ] 面试模拟对话
- [ ] 回答评分与反馈
- [ ] 面试历史记录

## 许可证

MIT License