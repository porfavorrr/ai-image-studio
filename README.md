# ai-image-studio

AI 图片助手是一个本地可运行、可部署的 AI 图片编辑网站 MVP，包含账户系统、图片生成、生成记录保存和用户中心。

## 技术栈

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Zustand
- 本地文件数据库，路径由 `DATABASE_URL` 控制
- httpOnly Cookie Session
- bcryptjs 密码哈希，安装不可用时保留本地兼容哈希兜底
- Codex 图片服务或 OpenAI Images API

## 第一次启动

```bash
npm install
cp .env.example .env.local
npm run db:generate
npm run db:push
npm run dev
```

访问：

```text
http://localhost:3000
```

## 环境变量

`.env.local` 推荐配置：

```bash
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

说明：

- `DATABASE_URL`：本地文件数据库路径。
- `AUTH_SECRET`：会话、验证码和重置 token 签名密钥，部署时必须换成随机长字符串。
- `AUTH_COOKIE_SECURE`：网站启用 HTTPS 后设为 `true`；直接用 HTTP 调试时保持 `false`。
- `IMAGE_API_MODE=real`：调用真实图片服务。
- `IMAGE_PROVIDER=codex`：使用本机 `server/codex_image_api.py`。
- `CODEX_IMAGE_API_BASE_URL`：Next.js 服务端访问 Codex 图片服务的地址。
- `OPENAI_API_KEY`：仅在 `IMAGE_PROVIDER=openai` 时需要。

## 账号能力

当前已实现：

- 注册、登录、退出登录、获取当前用户。
- 注册和登录使用本地算术验证码。
- 登录态使用 httpOnly Cookie 保存。
- 密码修改。
- 忘记密码的本地开发流程。
- 生成接口强制校验登录态。
- 用户只能查看自己的生成记录。

忘记密码说明：

- 当前不接邮箱服务。
- `/forgot-password` 会在本地开发页面展示重置链接。
- 文案会说明“当前为本地开发模式，重置链接已生成。后续接入邮件服务后将发送到用户邮箱。”
- 重置 token 只保存哈希，有效期 30 分钟，使用后失效。

## 启动 Codex 图片服务

在服务器或本机另开终端：

```bash
mkdir -p /data/codex_image_api_runs

HOST=127.0.0.1 \
PORT=8000 \
CODEX_IMAGE_API_WORKDIR=/data/codex_image_api_runs \
CODEX_TIMEOUT_SECONDS=1800 \
CODEX_IMAGE_API_KEEP_FAILED_JOBS=1 \
python3 server/codex_image_api.py
```

检查：

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:3000/api/images/debug
```

切换图片服务：

```bash
IMAGE_PROVIDER=codex
CODEX_IMAGE_API_BASE_URL=http://127.0.0.1:8000
```

或：

```bash
IMAGE_PROVIDER=openai
OPENAI_API_KEY=你的 OpenAI API Key
IMAGE_MODEL=gpt-image-1
```

## 使用流程

1. 打开网站。
2. 注册账号并完成算术验证码。
3. 登录。
4. 上传图片并生成。
5. 在 `/history` 查看和下载结果。
6. 在 `/account` 查看账户信息、生成统计和修改密码。

## 主要接口

认证：

```text
GET  /api/captcha
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
POST /api/auth/change-password
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

图片生成：

```text
POST /api/images/edit
POST /api/images/product
POST /api/images/poster
```

任务记录：

```text
GET /api/tasks
GET /api/tasks/[id]
```

## 生成结果保存

生成结果会保存到：

```text
public/generated/{userId}/{taskId}/result-1.png
```

本地数据库会记录任务状态、prompt、结果地址和失败原因。

## 构建

需要构建生产包时运行：

```bash
npm run build
npm run start
```

本轮开发未执行 `npm run build`。

## 外网访问

临时测试：

```bash
npm run dev -- -H 0.0.0.0 -p 3000
```

然后访问：

```text
http://服务器公网IP:3000
```

正式部署建议用 Nginx 只暴露 `80/443`，不要把 `8000` 端口暴露到公网。`8000` 只给 Next.js 服务端本机访问。

## 注意事项

- 不要提交 `.env.local`。
- 不要暴露 `AUTH_SECRET`、API Key 或内部 Codex 服务端口。
- `public/generated/` 是生成结果目录，按需备份。
- `server/codex_image_api.py` 建议只监听 `127.0.0.1`。
