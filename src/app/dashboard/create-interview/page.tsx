"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

interface Resume {
  id: string;
  name: string;
  createdAt: string;
}

interface Question {
  id: string;
  category: string;
  content: string;
  order: number;
}

const PRESET_JOBS = [
  // 技术类
  {
    title: "前端开发工程师",
    category: "技术",
    description: `【岗位职责】
1. 负责公司核心产品的 Web 前端开发与维护，确保产品在多端的高质量交付
2. 参与前端架构设计与技术选型，推动前端工程化、组件化建设
3. 与产品、设计、后端团队紧密协作，将产品需求转化为高质量的技术实现
4. 持续优化前端性能，提升页面加载速度和用户交互体验
5. 参与代码评审，保障代码质量，推动团队最佳实践

【任职要求】
1. 3年以上 Web 前端开发经验，计算机相关专业本科及以上
2. 精通 React 或 Vue.js 生态，熟悉 TypeScript
3. 扎实的 HTML/CSS/JavaScript 基础，熟悉响应式设计
4. 熟悉前端工程化工具（Webpack/Vite/ESLint/Prettier）
5. 了解 RESTful API 和 GraphQL，有前后端协作经验
6. 良好的代码风格和团队协作能力

【加分项】
- 有 Next.js/Nuxt.js 等 SSR 框架经验
- 了解 Node.js，有 BFF 层开发经验
- 有性能优化、微前端、低代码平台等实践经验
- 有开源项目贡献或技术博客`,
  },
  {
    title: "后端开发工程师",
    category: "技术",
    description: `【岗位职责】
1. 负责后端服务的设计、开发与维护，保障系统高可用和高性能
2. 参与系统架构设计，制定技术方案，解决复杂业务场景下的技术难题
3. 设计和优化数据库模型，编写高效的 SQL 查询
4. 编写单元测试和集成测试，保障代码质量
5. 参与线上问题排查和性能调优

【任职要求】
1. 3年以上后端开发经验，计算机相关专业本科及以上
2. 精通 Java/Go/Node.js 至少一门语言，了解其生态和最佳实践
3. 熟悉 MySQL/PostgreSQL 等关系型数据库，了解 Redis 缓存方案
4. 熟悉 RESTful API 设计，了解微服务架构
5. 掌握常用设计模式和数据结构算法
6. 了解 Docker、CI/CD 流程

【加分项】
- 有分布式系统、高并发场景处理经验
- 熟悉 Kafka/RabbitMQ 等消息队列
- 了解 Kubernetes 容器编排
- 有开源项目贡献`,
  },
  {
    title: "全栈开发工程师",
    category: "技术",
    description: `【岗位职责】
1. 负责产品前后端全栈开发，独立完成从需求分析到上线的完整流程
2. 参与产品技术方案设计，兼顾前端体验和后端性能
3. 构建和维护 RESTful API，确保前后端数据交互高效可靠
4. 参与数据库设计和优化，保障数据一致性
5. 推动团队工程化实践，提升开发效率

【任职要求】
1. 3年以上全栈开发经验，计算机相关专业本科及以上
2. 前端精通 React/Vue.js，后端精通 Node.js/Python/Java 至少一门
3. 熟悉 TypeScript，有良好的类型系统设计能力
4. 熟悉 MySQL/PostgreSQL/MongoDB 至少一种数据库
5. 了解 Docker、CI/CD、云服务部署
6. 具备良好的系统设计能力和代码质量意识

【加分项】
- 有 Next.js/Nuxt.js 全栈框架实战经验
- 了解 DevOps 流程，有自动化部署经验
- 有 SaaS 产品开发经验
- 技术视野开阔，乐于学习新技术`,
  },
  {
    title: "移动端开发工程师",
    category: "技术",
    description: `【岗位职责】
1. 负责 iOS/Android 移动应用的开发与维护
2. 参与移动端架构设计，制定技术方案
3. 优化应用性能，提升启动速度、降低内存占用和功耗
4. 与产品、设计团队紧密协作，还原高质量 UI 交互
5. 关注移动端前沿技术，推动技术升级

【任职要求】
1. 3年以上移动端开发经验
2. 精通 Swift/Kotlin 或 React Native/Flutter 至少一种技术栈
3. 熟悉移动端 UI 开发、网络编程、数据存储
4. 了解移动端性能优化方法和工具
5. 有完整的 App 上架和迭代经验
6. 良好的代码规范和团队协作能力

【加分项】
- 有跨平台开发（Flutter/RN）经验
- 了解 CI/CD 自动化打包发布
- 有音视频、推送、地图等 SDK 集成经验
- 有大型 App 架构优化经验`,
  },
  {
    title: "算法工程师",
    category: "技术",
    description: `【岗位职责】
1. 负责机器学习/深度学习算法的研发与落地
2. 针对业务场景设计算法方案，进行模型训练、评估和优化
3. 处理大规模数据，构建数据处理和特征工程流水线
4. 跟踪前沿算法研究，推动技术创新
5. 与工程团队协作，将算法模型部署到生产环境

【任职要求】
1. 计算机、数学、统计等相关专业硕士及以上
2. 扎实的机器学习/深度学习理论基础，熟悉常用算法
3. 精通 Python，熟悉 PyTorch/TensorFlow 至少一种框架
4. 有 NLP/CV/推荐系统/搜索 至少一个方向的实战经验
5. 良好的数学基础和论文阅读能力
6. 有较强的数据分析和问题解决能力

【加分项】
- 有大模型（LLM）微调和应用经验
- 在 Kaggle 等平台有竞赛获奖经历
- 有顶会论文发表
- 有模型压缩、推理优化经验`,
  },
  {
    title: "嵌入式开发工程师",
    category: "技术",
    description: `【岗位职责】
1. 负责嵌入式系统的软件开发与调试
2. 编写底层驱动程序和 BSP 适配
3. 参与硬件方案选型和系统架构设计
4. 进行系统性能优化，确保实时性和稳定性
5. 编写技术文档，参与代码评审

【任职要求】
1. 电子、通信、计算机等相关专业本科及以上
2. 精通 C/C++ 语言，熟悉数据结构和算法
3. 熟悉 ARM 架构，了解 RTOS 或嵌入式 Linux
4. 有 SPI/I2C/UART 等外设驱动开发经验
5. 具备硬件调试能力，能使用示波器等工具
6. 良好的问题分析和解决能力

【加分项】
- 有物联网（IoT）产品开发经验
- 了解蓝牙/WiFi/ZigBee 等无线协议
- 有 FPGA 或 DSP 开发经验
- 了解 Rust 嵌入式开发`,
  },
  {
    title: "架构师",
    category: "技术",
    description: `【岗位职责】
1. 负责系统整体架构设计，制定技术路线和发展规划
2. 解决复杂业务场景下的技术难题，提供架构层面的解决方案
3. 主导技术选型和框架搭建，建立技术规范和最佳实践
4. 指导和评审团队成员的技术方案和代码质量
5. 推动技术债务治理和系统重构
6. 关注前沿技术，推动技术创新和团队技术能力提升

【任职要求】
1. 8年以上后端或全栈开发经验，3年以上架构设计经验
2. 精通至少一门主流编程语言及其生态
3. 深入理解分布式系统、微服务架构、高并发高可用方案
4. 熟悉主流中间件（消息队列、缓存、搜索引擎等）
5. 具备优秀的系统设计能力和技术视野
6. 良好的沟通能力和团队领导力

【加分项】
- 有大规模系统架构设计和落地经验
- 熟悉云原生架构（K8s/Service Mesh）
- 有技术博客或开源项目
- 在知名互联网公司有架构经验`,
  },
  {
    title: "技术经理 / Tech Lead",
    category: "技术",
    description: `【岗位职责】
1. 负责技术团队的管理和项目交付，确保项目按时高质量上线
2. 制定团队技术规划，推动技术栈升级和架构优化
3. 参与需求评审和技术方案设计，把控技术风险
4. 指导和培养团队成员，提升团队整体技术能力
5. 协调跨团队沟通，推动项目顺利推进
6. 建设团队工程文化，提升研发效率

【任职要求】
1. 5年以上开发经验，2年以上团队管理经验
2. 扎实的技术功底，能独立进行技术方案设计和评审
3. 有项目管理经验，熟悉敏捷开发流程
4. 优秀的沟通协调能力和团队领导力
5. 具备良好的产品意识和业务理解能力
6. 能平衡技术理想和业务需求

【加分项】
- 有从0到1搭建团队经验
- 有跨部门大型项目协调经验
- 有技术培训和知识体系建设经验
- 在快速发展的创业公司有管理经验`,
  },
  {
    title: "DevOps 工程师",
    category: "技术",
    description: `【岗位职责】
1. 负责 CI/CD 流水线的建设与维护，提升研发交付效率
2. 管理和优化云基础设施，保障系统稳定性和可用性
3. 实施自动化运维方案，减少人工操作和故障响应时间
4. 建设监控告警体系，及时发现和处理线上问题
5. 推动容器化和微服务部署方案落地

【任职要求】
1. 3年以上运维或 DevOps 经验
2. 熟悉 Linux 系统管理和 Shell 脚本编写
3. 熟悉 Docker、Kubernetes 容器编排技术
4. 有 CI/CD 工具（Jenkins/GitLab CI/GitHub Actions）实践经验
5. 熟悉至少一种云平台（AWS/阿里云/腾讯云）
6. 了解 Terraform/Ansible 等基础设施即代码工具

【加分项】
- 有 SRE 实践经验
- 熟悉 Prometheus/Grafana 监控体系
- 了解 Service Mesh（Istio）
- 有安全运维经验`,
  },
  // 产品与设计
  {
    title: "产品经理",
    category: "产品设计",
    description: `【岗位职责】
1. 负责产品规划和需求分析，制定产品路线图
2. 深入了解用户需求和市场趋势，输出产品需求文档（PRD）
3. 协调设计、开发、测试团队，推动产品从概念到上线的全流程
4. 进行数据分析和用户反馈收集，持续优化产品体验
5. 竞品分析和行业研究，制定差异化产品策略

【任职要求】
1. 3年以上互联网产品经理经验
2. 具备优秀的需求分析和产品设计能力
3. 熟练使用 Axure/Figma/Sketch 等原型工具
4. 有较强的数据分析能力，熟悉常用数据分析工具
5. 优秀的沟通协调能力和项目推动能力
6. 对用户体验有深刻理解

【加分项】
- 有 B 端/C 端/SaaS 产品经验（注明方向）
- 有 AI 产品设计经验
- 有从0到1产品经验
- 了解技术实现原理`,
  },
  {
    title: "UI/UX 设计师",
    category: "产品设计",
    description: `【岗位职责】
1. 负责产品的用户界面设计和交互设计
2. 进行用户研究和可用性测试，基于数据驱动设计决策
3. 建立和维护设计系统/组件库，确保设计一致性
4. 输出高保真设计稿和交互原型，与开发团队对接
5. 关注设计趋势，持续优化产品用户体验

【任职要求】
1. 3年以上 UI/UX 设计经验
2. 精通 Figma/Sketch 等设计工具
3. 具备扎实的设计基础（排版、色彩、构图）
4. 有用户研究和可用性测试经验
5. 了解前端实现原理，能与开发有效沟通
6. 有完整的设计作品集

【加分项】
- 有设计系统搭建经验
- 了解动效设计（Principle/After Effects）
- 有 B 端产品设计经验
- 了解无障碍设计（Accessibility）`,
  },
  {
    title: "视觉设计师",
    category: "产品设计",
    description: `【岗位职责】
1. 负责品牌视觉体系的建设和维护
2. 完成运营活动、市场推广的视觉设计
3. 设计产品图标、插画、动效等视觉元素
4. 与运营、产品团队协作，输出高质量视觉方案
5. 管理设计素材库，提升团队设计效率

【任职要求】
1. 2年以上视觉设计经验
2. 精通 Photoshop/Illustrator/Figma 等设计工具
3. 具备优秀的审美能力和创意表达能力
4. 有品牌设计、运营设计等多类型项目经验
5. 了解印刷和数字媒体的设计规范
6. 有完整的视觉设计作品集

【加分项】
- 有动效/视频制作能力
- 有 3D 设计经验
- 了解 AI 设计工具
- 有品牌从0到1建设经验`,
  },
  // 数据类
  {
    title: "数据分析师",
    category: "数据",
    description: `【岗位职责】
1. 负责业务数据的采集、清洗、分析和可视化
2. 搭建数据指标体系，监控业务健康度
3. 深入分析用户行为数据，发现增长机会和业务问题
4. 输出数据分析报告，为产品和运营决策提供数据支撑
5. 参与 A/B 测试设计和效果评估

【任职要求】
1. 2年以上数据分析经验，统计学/数学/计算机等相关专业
2. 精通 SQL，能编写复杂查询
3. 熟练使用 Python/R 进行数据分析
4. 熟悉常用可视化工具（Tableau/Power BI/ECharts）
5. 具备扎实的统计学基础
6. 优秀的业务理解和报告撰写能力

【加分项】
- 有机器学习建模经验
- 了解数据仓库建设
- 有用户增长分析经验
- 熟悉 Spark/Hadoop 等大数据工具`,
  },
  {
    title: "数据工程师",
    category: "数据",
    description: `【岗位职责】
1. 负责数据仓库和数据平台的建设与维护
2. 设计和开发 ETL 数据流水线，保障数据质量和时效
3. 优化数据处理流程，提升数据处理效率
4. 管理数据治理，建立数据标准和质量监控体系
5. 支撑数据分析和算法团队的数据需求

【任职要求】
1. 3年以上数据工程经验，计算机相关专业本科及以上
2. 精通 SQL，熟悉 Python/Scala/Java 至少一门语言
3. 熟悉数据仓库建模方法论（星型模型/雪花模型）
4. 有 Spark/Flink/Hive 等大数据处理框架实战经验
5. 了解 Kafka 等实时数据处理方案
6. 熟悉至少一种云平台的数据服务

【加分项】
- 有数据湖建设经验
- 了解 dbt/Airflow 等数据编排工具
- 有实时数仓建设经验
- 了解数据安全和隐私合规`,
  },
  {
    title: "商业分析师",
    category: "数据",
    description: `【岗位职责】
1. 深入理解业务模式，为管理层提供战略分析和决策支持
2. 搭建业务分析框架，建立关键业务指标监控体系
3. 进行市场研究和竞品分析，识别业务机会和风险
4. 输出高质量的分析报告和商业演示文档
5. 推动数据驱动的业务优化和流程改进

【任职要求】
1. 3年以上商业分析或战略咨询经验
2. 优秀的数据分析能力，精通 Excel/SQL
3. 具备出色的逻辑思维和商业洞察力
4. 优秀的报告撰写和演示能力
5. 有跨部门沟通和项目推动能力
6. 了解互联网行业商业模式

【加分项】
- 有咨询公司（MBB/四大）经验
- 有行业研究经验
- 了解财务分析
- 有 MBA 学位`,
  },
  // 质量与运维
  {
    title: "测试工程师",
    category: "质量运维",
    description: `【岗位职责】
1. 负责软件产品的功能测试、性能测试和自动化测试
2. 根据需求文档编写测试计划和测试用例
3. 搭建和维护自动化测试框架，提升测试效率
4. 跟踪和管理缺陷，推动问题及时修复
5. 参与需求评审和代码评审，从质量角度提出改进建议

【任职要求】
1. 2年以上测试经验，计算机相关专业本科及以上
2. 熟悉软件测试理论和方法论
3. 掌握至少一门编程语言（Python/Java）
4. 有自动化测试经验（Selenium/Cypress/Playwright）
5. 了解接口测试和性能测试工具
6. 细心严谨，具备良好的问题分析能力

【加分项】
- 有持续集成/持续测试经验
- 了解移动端测试
- 有安全测试经验
- 有测试平台开发经验`,
  },
  {
    title: "运维工程师 / SRE",
    category: "质量运维",
    description: `【岗位职责】
1. 负责线上服务的稳定性和可用性保障
2. 建设和优化监控告警体系，快速响应和处理故障
3. 管理服务器和云基础设施，进行容量规划和成本优化
4. 制定和演练容灾方案，提升系统韧性
5. 推动自动化运维，减少人工操作风险

【任职要求】
1. 3年以上运维或 SRE 经验
2. 精通 Linux 系统管理和网络知识
3. 熟悉 Docker/Kubernetes 容器化技术
4. 有监控系统（Prometheus/Zabbix/ELK）实践经验
5. 掌握 Shell/Python 脚本编写
6. 具备故障排查和应急处理能力

【加分项】
- 有大规模集群管理经验
- 了解 SLO/SLI 体系建设
- 有混沌工程实践经验
- 熟悉多云管理`,
  },
  {
    title: "安全工程师",
    category: "质量运维",
    description: `【岗位职责】
1. 负责公司产品和基础设施的安全评估与防护
2. 进行安全漏洞扫描和渗透测试，输出安全报告
3. 制定安全规范和流程，推动安全开发实践
4. 响应安全事件，进行应急处置和溯源分析
5. 跟踪安全情报，评估新漏洞影响并推动修复

【任职要求】
1. 3年以上安全工程经验
2. 熟悉 Web 安全、网络安全、系统安全等基础知识
3. 掌握常见漏洞原理和利用方式（OWASP Top 10）
4. 有渗透测试和安全审计实战经验
5. 了解安全工具（Burp Suite/Nmap/Wireshark）
6. 有良好的代码审计能力

【加分项】
- 有 CTF 竞赛经验
- 了解云安全和容器安全
- 有安全平台开发经验
- 持有 CISSP/CISP 等安全认证`,
  },
];

const PRESET_CATEGORIES = ["技术", "产品设计", "数据", "质量运维"];

export default function CreateInterviewPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [interviewMode, setInterviewMode] = useState<"standard" | "dialogue">("standard");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 加载简历列表
  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await fetch("/api/resumes");
      if (response.ok) {
        const data = await response.json();
        setResumes(data);
      }
    } catch (error) {
      console.error("获取简历列表失败:", error);
    }
  };

  // 选择预设岗位
  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    const preset = PRESET_JOBS.find((j) => j.title === value);
    if (preset) {
      setJobTitle(preset.title);
      setJobDescription(preset.description);
    }
  };

  // 生成面试问题
  const handleGenerate = async () => {
    if (!jobTitle) {
      toast.error("请选择或输入岗位名称");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: selectedResumeId || null,
          jobTitle,
          jobDescription,
          mode: interviewMode,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "生成失败");
      }

      const data = await response.json();
      console.log("API 返回数据:", data);
      console.log("问题列表:", data.questions);
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      toast.success("面试问题生成成功！");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "生成问题失败，请重试"
      );
    } finally {
      setLoading(false);
    }
  };

  // 更新问题内容
  const handleQuestionChange = (id: string, content: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, content } : q))
    );
  };

  // 更新问题类别
  const handleCategoryChange = (id: string, category: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, category } : q))
    );
  };

  // 删除问题
  const handleDeleteQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  // 添加新问题
  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `temp-${Date.now()}`,
      category: "行为面试",
      content: "",
      order: questions.length + 1,
    };
    setQuestions((prev) => [...prev, newQuestion]);
  };

  // 保存问题
  const handleSave = async () => {
    if (!sessionId) {
      toast.error("请先生成面试问题");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/save-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questions: questions.map((q, index) => ({
            category: q.category,
            content: q.content,
            order: index + 1,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("保存失败");
      }

      const data = await response.json();
      setQuestions(data.questions);
      toast.success("问题保存成功！");
    } catch {
      toast.error("保存问题失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  // 获取类别颜色
  const getCategoryColor = (category: string) => {
    switch (category) {
      case "行为面试":
        return "bg-blue-100 text-blue-800";
      case "技术面试":
        return "bg-green-100 text-green-800";
      case "项目追问":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">创建面试</h2>
        <p className="text-gray-500">配置岗位信息，生成个性化面试问题</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：配置面板 */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>岗位信息</CardTitle>
                <CardDescription>选择预设岗位或手动输入</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>预设岗位</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={selectedPreset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                  >
                    <option value="">选择预设岗位...</option>
                    {PRESET_CATEGORIES.map((cat) => (
                      <optgroup key={cat} label={cat}>
                        {PRESET_JOBS.filter((j) => j.category === cat).map(
                          (job) => (
                            <option key={job.title} value={job.title}>
                              {job.title}
                            </option>
                          )
                        )}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobTitle">岗位名称</Label>
                  <Input
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="输入岗位名称"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jobDescription">岗位描述 (JD)</Label>
                  <Textarea
                    id="jobDescription"
                    className="min-h-[100px]"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="输入岗位描述..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>选择简历</CardTitle>
                <CardDescription>选择一份已上传的简历（可选）</CardDescription>
              </CardHeader>
              <CardContent>
                <select
                  className="w-full p-2 border rounded-md"
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                >
                  <option value="">不使用简历</option>
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.name} -{" "}
                      {new Date(resume.createdAt).toLocaleString("zh-CN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </option>
                  ))}
                </select>
                {resumes.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    暂无简历，请先上传简历
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>面试模式</CardTitle>
                <CardDescription>选择面试方式进行练习</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInterviewMode("standard")}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      interviewMode === "standard"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">标准模式</div>
                    <div className="text-xs text-gray-500">
                      一问一答，逐题评估
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterviewMode("dialogue")}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      interviewMode === "dialogue"
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-sm font-medium mb-1">
                      AI 对话模式
                    </div>
                    <div className="text-xs text-gray-500">
                      AI 面试官多轮追问，深入探讨
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={loading || !jobTitle}
            >
              {loading ? "生成中..." : "生成面试问题"}
            </Button>
          </div>

          {/* 右侧：问题列表 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>面试问题</CardTitle>
                    <CardDescription>
                      {questions.length > 0
                        ? `共 ${questions.length} 道问题，可编辑内容和顺序`
                        : "生成后可编辑问题内容"}
                    </CardDescription>
                  </div>
                  {questions.length > 0 && (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleAddQuestion}>
                        添加问题
                      </Button>
                      <Button onClick={handleSave} disabled={saving}>
                        {saving ? "保存中..." : "保存修改"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {questions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-4">🎯</div>
                    <p>配置岗位信息后，点击「生成面试问题」开始</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="border rounded-lg p-4 bg-white"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-500">
                                #{index + 1}
                              </span>
                              <select
                                className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                                  question.category
                                )}`}
                                value={question.category}
                                onChange={(e) =>
                                  handleCategoryChange(
                                    question.id,
                                    e.target.value
                                  )
                                }
                              >
                                <option value="行为面试">行为面试</option>
                                <option value="技术面试">技术面试</option>
                                <option value="项目追问">项目追问</option>
                              </select>
                            </div>
                            <textarea
                              className="w-full p-2 border rounded-md min-h-[60px] text-sm"
                              value={question.content}
                              onChange={(e) =>
                                handleQuestionChange(
                                  question.id,
                                  e.target.value
                                )
                              }
                              placeholder="输入问题内容..."
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (index > 0) {
                                  const newQuestions = [...questions];
                                  [newQuestions[index - 1], newQuestions[index]] =
                                    [
                                      newQuestions[index],
                                      newQuestions[index - 1],
                                    ];
                                  setQuestions(newQuestions);
                                }
                              }}
                              disabled={index === 0}
                            >
                              ↑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (index < questions.length - 1) {
                                  const newQuestions = [...questions];
                                  [newQuestions[index], newQuestions[index + 1]] =
                                    [
                                      newQuestions[index + 1],
                                      newQuestions[index],
                                    ];
                                  setQuestions(newQuestions);
                                }
                              }}
                              disabled={index === questions.length - 1}
                            >
                              ↓
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() =>
                                handleDeleteQuestion(question.id)
                              }
                            >
                              ✕
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              {/* 开始面试按钮 */}
              {questions.length > 0 && sessionId && (
                <div className="px-6 pb-6">
                  <Link href={`/interview/${sessionId}`}>
                    <Button size="lg" className="w-full">
                      开始面试 ({questions.length} 道题)
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>
    </div>
  );
}
