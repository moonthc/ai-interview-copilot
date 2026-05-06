import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email("邮箱格式不正确").max(255),
  password: z.string().min(8, "密码至少8个字符").max(128),
});

export const evaluateAnswerSchema = z.object({
  questionId: z.string().min(1),
  userAnswer: z.string().min(1, "请输入回答").max(5000, "回答过长"),
  question: z.string().min(1),
  sessionId: z.string().optional(),
  resumeContent: z.string().optional(),
  jobContext: z.string().optional(),
});

export const generateQuestionsSchema = z.object({
  jobTitle: z.string().min(1, "请选择或输入岗位").max(200),
  jobDescription: z.string().max(5000).optional(),
  resumeId: z.string().optional(),
  mode: z.enum(["standard", "dialogue"]).optional().default("standard"),
});

export const parseResumeSchema = z.object({
  resumeId: z.string().min(1),
});

export const positionSchema = z.object({
  title: z.string().min(1, "请输入岗位名称").max(200),
  description: z.string().max(5000).optional(),
});

export const positionUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
});

export const deleteSchema = z.object({
  id: z.string().min(1),
});

export const saveQuestionsSchema = z.object({
  sessionId: z.string().min(1),
  questions: z.array(
    z.object({
      id: z.string().optional(),
      category: z.string().max(50).optional(),
      content: z.string().min(1).max(2000),
      order: z.number().int().min(0),
    })
  ).min(1).max(50),
});

export const dialogueMessageSchema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  userMessage: z.string().min(1, "请输入回答").max(5000, "回答过长"),
});
