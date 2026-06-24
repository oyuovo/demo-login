# Community Gate — 社区资源访问控制台

一个带有 LLM 注册名审核和角色授权控制的 Web 应用 Demo。

## 1. 实现方式与时间规划

采用 **AI coding 辅助的模块化单体开发**：先产出完整设计文档，再由 AI 按模块依次实现。人工负责设计决策、代码审查和调优验证，AI 负责模板化代码生成。

| 阶段 | 时间 | 内容 |
|------|------|------|
| 设计 | 6月22日晚 | 完成设计文档、仓库初始化、技术选型 |
| Day 1 | 6月23日 | 工作区搭建、后端四模块（Auth/Moderation/Authorization/Resources）、LLM 审核评测、前端页面、测试 |
| Day 2 | 6月24日 | 腾讯云部署（CloudBase Run + TDSQL-C）、网络配置调试、文档整理、交付 |

## 2. 整体架构

```
浏览器 (React SPA)
    │
    ├── /api/auth/*     认证（注册、登录、登出）
    ├── /api/resources/* 资源（A: 社区公开资料库, B: 社区内部运营数据）
    └── /health/*        健康检查
    │
    ▼
Fastify HTTP 服务
    ├── Auth 模块        注册/登录/登出/会话管理
    ├── Moderation 模块  LLM 注册名审核（DeepSeek / Qwen）
    ├── Authorization    集中式权限矩阵
    └── Resources 模块   Mock 数据服务
    │
    ├── MySQL (Drizzle ORM)
    └── LLM Provider

部署：Docker + CloudBase Run（上海），单容器无状态，MySQL 独立托管
```

### 技术栈

| 层 | 选型 | 理由 |
|----|------|------|
| 运行时 | Node.js 22 + TypeScript | 全栈统一，类型安全 |
| 前端 | React 18 + Vite + React Router | 轻量 SPA |
| 后端 | Fastify 5 | 高性能，插件体系成熟 |
| 数据校验 | Zod | 前后端共享 schema |
| ORM | Drizzle ORM + mysql2 | 类型安全，迁移轻量 |
| 密码 | Argon2id | 推荐的内存硬哈希算法 |
| 测试 | Vitest + Playwright | 单元/集成测试 + 浏览器 E2E |
| LLM | DeepSeek + Qwen 备用 | 兼容 OpenAI 协议，中文理解好 |

### 设计出发点

1. **安全优先**：权限在服务端集中判断，前端 UI 隐藏不构成安全边界。Cookie HttpOnly/Secure/SameSite，会话令牌只存哈希。
2. **LLM 不可靠性处理**：审核失败返回 503（系统故障），审核拒绝返回 422（违规），严格区分。审核不可用不阻止已注册用户登录。
3. **提示词注入防御**：候选名作为 JSON 数据字段传递，不拼接到系统提示词。

### 数据模型

```
users:      id | username | normalized_username | password_hash | role (MEMBER/PRIVILEGED)
sessions:   id | token_hash | user_id (FK) | expires_at
moderation_attempts: id | candidate_hash | provider | model | prompt_version | decision (ALLOW/BLOCK/ERROR) | category | reason | latency_ms
```

### 权限矩阵

| 角色 | 资源 A（公开资料） | 资源 B（运营数据） |
|------|:---:|:---:|
| MEMBER（默认） | ✅ | ❌ |
| PRIVILEGED | ✅ | ✅ |

## 3. AI Coding 工具使用情况

- **工具**：Claude Code（基于 DeepSeek-V4 模型）用于全部代码生成、测试编写与调试修复；Codex 用于设计文档协作编写
- **Token 总计**：约 30,000,000 tokens

| 部分 | 说明 |
|------|------|
| 后端模块实现 | Auth、Moderation、Authorization、Resources 四个模块，含多次迭代修复 |
| 设计文档与 README | 设计文档 + 完整 README（含 LLM 评测过程） |
| 前端实现 | React 组件、路由、状态管理、CSS 样式 |
| 测试代码 | 单元测试（22 用例）+ 集成测试 + E2E |
| 调试与修复 | dotenv 路径、LLM 超时、cookie 清除、npm workspace 兼容等跨层问题 |
| 配置与 Docker | monorepo 配置、Dockerfile、docker-compose、TS config |

Token 消耗最多的是**后端模块实现与调试修复**，涉及多个独立模块的业务逻辑和跨层问题排查。

## 4. 人工用时最多的地方

在总计约 15 小时的人工投入中，以下环节占比最高：

1. **测试验证与缺陷修复**（约 4h）—— 排查 Cookie 清除、LLM API 超时、dotenv 路径解析、npm workspace 兼容等跨层问题，这类问题定位链路长、涉及模块多
2. **线上部署与网络配置**（约 4h）—— CloudBase Run 个人版的 VPC 限制、安全组端口转发规则、TDSQL-C 公网连通性调试均需逐项排查
3. **需求分析与架构设计**（约 2h）—— 确定模块边界、数据模型、API 路由及安全策略，是后续所有开发工作的基础

AI 承担了模板化代码产出，人工主要投入在架构决策、跨层缺陷定位及线上环境调试上。

## 5. 优先级分析

### 该场景下优先级最高的部分

1. **服务端授权**（最高）：资源 B 的安全完全依赖后端权限校验。前端隐藏按钮不等于安全——curl 直接调用 API 必须返回 403。
2. **LLM 审核的失败隔离**：LLM 不可用时返回 503（系统故障），违规返回 422（审核拒绝），两者严格区分。
3. **公网可访问性**：CloudBase Run 默认 HTTPS 域名，Day 1 就部署健康检查取得公网 URL，避免最后一天发现网络问题。
4. **评测驱动的 Prompt 调优**：用固定评测集跑数据，对照误杀/漏放改提示词，有数据才有说服力。

### 已完备

- ✅ 服务端权限矩阵，每个资源 API 独立校验
- ✅ 审核失败（503）与审核拒绝（422）严格区分
- ✅ Cookie HttpOnly + Secure + SameSite=Lax，密码 Argon2id 哈希
- ✅ 会话令牌只存储哈希，注册/登录按 IP 和用户名限流
- ✅ 提示词注入防御（候选名 JSON 数据传递）
- ✅ 评测集 45 样例，v2 Prompt 准确率 100%（模型：Qwen qwen-turbo，平均延迟 478ms）
- ✅ 单元测试 22 用例、集成测试、E2E 测试
- ✅ Docker 多阶段构建，CloudBase Run 部署可公网访问

### 已知局限

**安全**：Unicode 同形字符攻击（Cyrillic 'а' 伪装 Latin 'a'）可能绕过 LLM 审核；LLM 模型漂移使同一提示词不同时间输出可能不同；限流为内存模式，多实例需 Redis。

**运维**：CloudBase Run 个人版不支持 VPC 内网互联，数据库走公网连接；Docker Hub 需配置镜像加速器；TDSQL-C MySQL 与 Drizzle `defaultNow()` 存在兼容性问题。
