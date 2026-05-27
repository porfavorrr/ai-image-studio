# AI Image Studio

AI Image Studio 是一个面向用户的在线 AI 图片编辑与生成网站，支持智能修图、商品图生成、封面海报生成、用户登录、生成记录和额度管理等核心能力。

## 项目简介

AI Image Studio 是一个 AI P 图网站 MVP。用户可以上传图片，通过自然语言描述完成图片修改，例如换背景、画面增强、商品图生成和封面海报生成。

项目采用 Next.js 构建前端页面和业务 API，图片生成能力通过服务端接口转发到独立的 Python Codex 图片服务。浏览器不会直接访问图片生成服务，也不会接触敏感密钥。

当前项目支持通过 Codex 图片服务完成真实图片生成，同时保留开发环境下的本地调试模式，方便在没有完整图片服务时进行页面和流程验证。

## 核心功能

### 用户系统

- 用户注册、登录和退出登录
- httpOnly Cookie 登录态保持
- 用户中心
- 修改密码
- 本地算术验证码
- 本地开发模式下的忘记密码流程
- 用户生成历史记录

### 图片生成能力

- 智能修图
- 换背景
- 去杂物与局部修改能力预留
- 商品图生成
- 封面海报生成
- 生成结果展示与下载

### 任务与记录

- 图片生成任务记录
- 当前用户历史记录
- 生成中、成功、失败等状态展示
- 图片服务异常、超时、积分不足等错误提示

### 额度与付费基础

- 新用户注册赠送 1 次免费生成额度
- 每次图片生成消耗 1 个积分
- 积分余额展示
- 积分包与订单基础能力
- 手动支付确认流程
- 管理员确认订单并为用户增加积分

### 服务端能力

- Next.js API Routes 承载业务接口
- Python Codex 图片服务承载实际出图任务
- 服务端调用图片生成接口
- 环境变量集中配置
- 敏感密钥只在服务端读取，不暴露到前端

## 技术栈

- Next.js 14 App Router
- React 18
- TypeScript
- Tailwind CSS
- Zustand
- Node.js
- Node `crypto.scrypt` 密码哈希
- httpOnly Cookie Session
- 本地文件数据库，路径由 `DATABASE_URL` 控制
- Python 3
- Codex CLI / Codex 图片服务
- OpenAI SDK，可选用于 OpenAI Images API 模式

## 项目结构

```text
ai-image-studio/
├── docs/                         # 部署和运维相关文档
├── public/                       # 静态资源与生成图片目录
├── scripts/                      # 本地数据库初始化脚本
├── server/
│   ├── codex_image_api.py        # Python Codex 图片服务
│   └── check_codex_image_api.sh  # 图片服务检查脚本
├── src/
│   ├── app/                      # Next.js 页面与 API Routes
│   │   ├── api/                  # 登录、任务、订单、图片生成等接口
│   │   ├── editor/               # 智能修图工作台
│   │   ├── product/              # 商品图生成
│   │   ├── poster/               # 封面海报生成
│   │   ├── account/              # 用户中心
│   │   ├── history/              # 生成历史记录
│   │   ├── pricing/              # 积分包页面
│   │   └── page.tsx              # 首页
│   ├── components/               # 页面组件与通用 UI
│   ├── lib/                      # 认证、数据库、图片服务、业务工具
│   └── types/                    # TypeScript 类型定义
├── .env.example                  # 环境变量示例
├── next.config.mjs               # Next.js 配置
├── package.json                  # 项目脚本与依赖
└── README.md
```

## 本地运行

### 1. 克隆项目

```bash
git clone https://github.com/porfavorrr/ai-image-studio.git
cd ai-image-studio
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env.local
```

`.env.local` 推荐配置：

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="please-change-this-secret"
AUTH_COOKIE_SECURE=false

IMAGE_API_MODE=real
IMAGE_PROVIDER=codex
CODEX_IMAGE_API_BASE_URL=http://127.0.0.1:8000
CODEX_IMAGE_API_TIMEOUT_SECONDS=900

OPENAI_API_KEY=
IMAGE_MODEL=gpt-image-1
```

使用 Codex 图片服务时，`OPENAI_API_KEY` 可以不填。部署时请务必把 `AUTH_SECRET` 改成足够长的随机字符串。

### 4. 初始化本地数据库

当前项目使用内置本地文件数据库，不依赖外部数据库服务。

```bash
npm run db:generate
npm run db:push
```

默认会根据 `DATABASE_URL` 创建 `dev.db` 文件。

### 5. 启动 Codex 图片服务

另开一个终端运行：

```bash
mkdir -p /data/codex_image_api_runs

HOST=127.0.0.1 \
PORT=8000 \
CODEX_IMAGE_API_WORKDIR=/data/codex_image_api_runs \
python3 server/codex_image_api.py
```

检查服务是否启动：

```bash
curl http://127.0.0.1:8000/health
```

该服务建议只监听 `127.0.0.1`，不要直接暴露到公网。Next.js 网站会通过 `CODEX_IMAGE_API_BASE_URL` 在服务端调用它。

### 6. 启动 Next.js 网站

```bash
npm run dev
```

访问：

```text
http://localhost:3000
```

## 服务器部署

以下流程适合 Linux 服务器的基础部署。

### 1. 拉取项目并安装依赖

```bash
cd /opt
git clone https://github.com/porfavorrr/ai-image-studio.git
cd ai-image-studio
npm install
cp .env.example .env.local
nano .env.local
```

### 2. 初始化数据库

```bash
npm run db:generate
npm run db:push
```

### 3. 启动图片服务

```bash
mkdir -p /data/codex_image_api_runs

HOST=127.0.0.1 \
PORT=8000 \
CODEX_IMAGE_API_WORKDIR=/data/codex_image_api_runs \
python3 server/codex_image_api.py
```

### 4. 开发方式外网访问

```bash
npm run dev -- -H 0.0.0.0
```

访问：

```text
http://服务器IP:3000
```

服务器安全组或防火墙需要开放 `3000` 端口。不要开放 Python 图片服务的 `8000` 端口。

### 5. 生产构建与启动

```bash
npm run build
npm run start -- -H 0.0.0.0
```

生产环境建议使用 Nginx 反向代理到 Next.js 服务，并配置 HTTPS。

### 6. 使用 PM2 守护进程

安装 PM2：

```bash
npm install -g pm2
```

启动 Next.js 网站：

```bash
pm2 start npm --name ai-image-studio -- run start -- -H 0.0.0.0
```

启动 Codex 图片服务：

```bash
pm2 start bash --name codex-image-api -- -c "HOST=127.0.0.1 PORT=8000 CODEX_IMAGE_API_WORKDIR=/data/codex_image_api_runs python3 server/codex_image_api.py"
```

保存进程列表：

```bash
pm2 save
```

## 环境变量说明

| 变量名 | 说明 | 示例 |
| --- | --- | --- |
| `DATABASE_URL` | 本地文件数据库路径 | `file:./dev.db` |
| `AUTH_SECRET` | 登录会话、验证码和重置密码 token 的签名密钥 | `please-change-this-secret` |
| `AUTH_COOKIE_SECURE` | Cookie 是否只允许 HTTPS 发送 | `false` |
| `IMAGE_API_MODE` | 图片生成模式 | `real` / `mock` |
| `IMAGE_PROVIDER` | 图片生成服务提供方 | `codex` |
| `CODEX_IMAGE_API_BASE_URL` | Codex 图片服务地址 | `http://127.0.0.1:8000` |
| `CODEX_IMAGE_API_TIMEOUT_SECONDS` | 图片生成请求超时时间 | `900` |
| `OPENAI_API_KEY` | OpenAI API Key，可选 | `sk-xxx` |
| `IMAGE_MODEL` | OpenAI 图片模型名称，可选 | `gpt-image-1` |

## 图片生成服务说明

AI Image Studio 由两层服务组成：

```text
浏览器
  ↓
Next.js 网站 / API
  ↓
Codex 图片服务 127.0.0.1:8000
  ↓
生成图片并返回结果
```

Next.js 网站负责前端页面、用户系统、积分订单、任务记录和业务 API。Python Codex 图片服务负责调用本机 Codex CLI 完成实际出图。

前端只调用 Next.js API，不直接访问 Python 图片服务。这样可以避免把内部服务地址、密钥或执行环境暴露给浏览器。

## 使用流程

1. 注册账号。
2. 登录网站。
3. 进入智能修图、商品图生成或封面海报生成页面。
4. 上传图片或填写生成内容。
5. 输入图片处理需求。
6. 点击生成图片。
7. 下载生成结果。
8. 在历史记录中查看之前的生成内容。

## 额度与订单流程

当前项目内置积分额度体系：

- 新用户注册后获得 1 个免费积分。
- 每次图片生成消耗 1 个积分。
- 生成失败不会扣除积分。
- 积分不足时，系统会引导用户进入 `/pricing` 购买积分。

内置积分包：

| 套餐 | 价格 | 积分 | 折算单价 | 说明 |
| --- | ---: | ---: | ---: | --- |
| 体验包 | ¥6.9 | 10 次 | ¥0.69/次 | 适合轻量体验 |
| 标准包 | ¥19.9 | 40 次 | ¥0.50/次 | 适合日常修图 |
| 高级包 | ¥49.9 | 120 次 | ¥0.42/次 | 适合内容创作者 |
| 专业包 | ¥99 | 300 次 | ¥0.33/次 | 适合高频使用 |

当前支付流程为人工确认模式：

1. 用户在 `/pricing` 选择积分包。
2. 系统创建待确认订单，并跳转到 `/checkout/[orderId]`。
3. 用户按照页面说明完成转账并填写备注。
4. 管理员进入 `/admin/orders` 确认订单。
5. 订单确认后，积分自动增加到账户并写入积分流水。

设置管理员：

- 当前项目没有写死管理员账号。
- 在本地数据库文件中找到目标用户，将该用户的 `role` 从 `"user"` 改为 `"admin"`。
- 重启服务后，该用户即可访问 `/admin/orders`。

## 开发状态

当前项目处于 MVP 阶段，已完成基础用户流程、图片生成链路、任务记录、额度系统和主要页面。它已经具备继续迭代为正式 AI 图片工具产品的基础结构。

部分能力仍适合在正式上线前继续增强，例如正式支付、对象存储、后台管理、局部涂抹编辑和更完整的生成质量控制。

## 后续规划

- 接入正式支付能力，例如微信支付、支付宝或 Stripe
- 完善积分包和订单自动确认流程
- 增加局部涂抹编辑能力
- 增加批量商品图生成
- 接入对象存储，替代本地生成文件目录
- 增加完整后台管理系统
- 增强图片生成质量控制和失败重试机制
- 增加团队空间或商家工作台

## 注意事项

- 不要提交 `.env.local`。
- 不要把 `AUTH_SECRET`、API Key 或其他敏感信息上传到 GitHub。
- `server/codex_image_api.py` 建议只监听 `127.0.0.1`。
- 部署到公网时，只需要开放 Next.js 网站端口或 Nginx 的 `80/443` 端口。
- 不要把 `8000` 端口直接暴露到公网。
- `public/generated/` 用于保存生成结果，生产环境建议定期备份或迁移到对象存储。
- 生产环境建议使用 Nginx、HTTPS 和 PM2 等进程管理工具。

## License

This project is for internal research and product prototyping. License information can be added later.
