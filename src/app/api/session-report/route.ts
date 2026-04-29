import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ai, AI_MODEL } from "@/lib/ai";

interface FeedbackJson {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestion: string;
}

interface RadarDimension {
  dimension: string;
  value: number;
}

interface AIReportSummary {
  summary: string;
  skillMatch: string;
  communication: string;
  recommendations: string[];
  radarData: RadarDimension[];
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "缺少 sessionId" }, { status: 400 });
    }

    // 验证会话归属
    const interviewSession = await prisma.interviewSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id,
      },
      include: {
        jobPosition: true,
      },
    });

    if (!interviewSession) {
      return NextResponse.json({ error: "会话不存在" }, { status: 404 });
    }

    // 获取所有问题和答案
    const questions = await prisma.question.findMany({
      where: { sessionId },
      orderBy: { order: "asc" },
      include: {
        answers: {
          where: { userId: session.user.id },
        },
      },
    });

    // 计算统计数据
    const totalQuestions = questions.length;
    const answeredQuestions = questions.filter(
      (q) => q.answers.length > 0
    ).length;

    const allAnswers = questions.flatMap((q) => q.answers);
    const scores = allAnswers.map((a) => {
      const feedback = a.feedbackJson as unknown as FeedbackJson;
      return feedback?.score || 0;
    });

    const totalScore = scores.reduce((a, b) => a + b, 0);
    const averageScore =
      scores.length > 0 ? Math.round(totalScore / scores.length) : 0;

    // 按分类计算平均分
    const categoryScores: Record<string, { total: number; count: number }> =
      {};
    questions.forEach((q) => {
      const answer = q.answers[0];
      if (answer) {
        const feedback = answer.feedbackJson as unknown as FeedbackJson;
        const score = feedback?.score || 0;
        const cat = q.category || "未分类";
        if (!categoryScores[cat]) {
          categoryScores[cat] = { total: 0, count: 0 };
        }
        categoryScores[cat].total += score;
        categoryScores[cat].count += 1;
      }
    });

    const categoryAverages = Object.entries(categoryScores).map(
      ([category, data]) => ({
        category,
        averageScore: Math.round(data.total / data.count),
        count: data.count,
      })
    );

    const jobTitle = interviewSession.jobPosition?.title || "未知岗位";

    // 检查是否已有缓存的 AI 报告
    let aiSummary: AIReportSummary;
    const cachedReport = interviewSession.reportJson as unknown as AIReportSummary | null;

    if (cachedReport && cachedReport.summary && cachedReport.radarData) {
      // 直接使用缓存
      console.log("使用缓存的 AI 报告, sessionId:", sessionId);
      aiSummary = cachedReport;
    } else {
      // 调用 MiMo 生成综合评价
      const questionsSummary = questions
        .map((q, index) => {
          const answer = q.answers[0];
          const feedback = answer?.feedbackJson as unknown as FeedbackJson;
          return `第${index + 1}题 [${q.category}] ${q.content}
回答：${answer?.userAnswer || "未作答"}
评分：${feedback?.score || 0}分
优点：${feedback?.strengths?.join("、") || "无"}
不足：${feedback?.weaknesses?.join("、") || "无"}`;
        })
        .join("\n\n");

      const aiPrompt = `你是一位资深的面试评估专家。请根据以下面试记录，生成一份详细的综合评价报告。

面试岗位：${jobTitle}
题目总数：${totalQuestions}
已答题数：${answeredQuestions}
平均分：${averageScore}

各题详情：
${questionsSummary}

请以JSON格式返回以下内容：
{
  "summary": "一段200字左右的综合评价，涵盖整体表现、优势和改进方向",
  "skillMatch": "对该岗位的技能匹配度评价（100字左右）",
  "communication": "沟通表达能力评价（100字左右）",
  "recommendations": ["推荐学习资源1", "推荐学习资源2", "推荐学习资源3"],
  "radarData": [
    {"dimension": "技术深度", "value": 80},
    {"dimension": "沟通表达", "value": 75},
    {"dimension": "项目经验", "value": 85},
    {"dimension": "逻辑思维", "value": 70},
    {"dimension": "问题解决", "value": 80},
    {"dimension": "学习能力", "value": 75}
  ]
}

radarData 中的 value 是 0-100 的分数，请根据候选人的实际回答表现给出合理评分。
只返回JSON，不要有其他文字。`;

      try {
        const completion = await ai.chat.completions.create({
          model: AI_MODEL,
          messages: [
            {
              role: "system",
              content:
                "你是一位资深面试评估专家，擅长分析候选人的综合能力。你必须返回有效的JSON格式数据。",
            },
            { role: "user", content: aiPrompt },
          ],
          temperature: 0.5,
          max_tokens: 3000,
        });

        const responseContent = completion.choices[0].message.content || "";
        console.log("MiMo 报告原始响应:", responseContent.substring(0, 300));

        let jsonStr = responseContent.trim();
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1].trim();
        }

        const jsonStart = jsonStr.indexOf("{");
        const jsonEnd = jsonStr.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
        }

        const parsed = JSON.parse(jsonStr);

        aiSummary = {
          summary: parsed.summary || "暂无综合评价",
          skillMatch: parsed.skillMatch || "暂无技能匹配度评价",
          communication: parsed.communication || "暂无沟通评价",
          recommendations: Array.isArray(parsed.recommendations)
            ? parsed.recommendations
            : [],
          radarData: Array.isArray(parsed.radarData)
            ? parsed.radarData
            : [
                { dimension: "技术深度", value: 70 },
                { dimension: "沟通表达", value: 70 },
                { dimension: "项目经验", value: 70 },
                { dimension: "逻辑思维", value: 70 },
                { dimension: "问题解决", value: 70 },
                { dimension: "学习能力", value: 70 },
              ],
        };

        // 保存到数据库
        await prisma.interviewSession.update({
          where: { id: sessionId },
          data: { reportJson: aiSummary as never },
        });
        console.log("AI 报告已保存到数据库, sessionId:", sessionId);
      } catch (e) {
        console.error("AI 报告生成失败:", e);
        aiSummary = {
          summary: "AI 综合评价暂时不可用，请稍后刷新页面重试。",
          skillMatch: "暂无评价",
          communication: "暂无评价",
          recommendations: ["暂无推荐"],
          radarData: [
            { dimension: "技术深度", value: 70 },
            { dimension: "沟通表达", value: 70 },
            { dimension: "项目经验", value: 70 },
            { dimension: "逻辑思维", value: 70 },
            { dimension: "问题解决", value: 70 },
            { dimension: "学习能力", value: 70 },
          ],
        };
      }
    }

    // 构建每题详情
    const questionDetails = questions.map((q, index) => {
      const answer = q.answers[0];
      const feedback = answer?.feedbackJson as unknown as FeedbackJson;
      return {
        index: index + 1,
        category: q.category || "未分类",
        content: q.content,
        userAnswer: answer?.userAnswer || null,
        score: feedback?.score || 0,
        strengths: feedback?.strengths || [],
        weaknesses: feedback?.weaknesses || [],
        suggestion: feedback?.suggestion || "",
      };
    });

    return NextResponse.json({
      session: {
        id: interviewSession.id,
        jobTitle,
        createdAt: interviewSession.createdAt,
      },
      stats: {
        totalQuestions,
        answeredQuestions,
        totalScore,
        averageScore,
        categoryAverages,
      },
      aiSummary,
      questions: questionDetails,
    });
  } catch (error) {
    console.error("生成报告错误:", error);
    return NextResponse.json({ error: "生成报告失败" }, { status: 500 });
  }
}
