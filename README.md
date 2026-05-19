# ai-image-studio

一个可本地运行并可部署到服务器的 AI 图片编辑 Demo，包含修图工作台、商品图工作室、封面/海报生成器和模板中心。当前版本保留 mock 展示，同时支持两种真实图片后端：OpenAI Images API 和服务器本机 `codex_image_api.py`。

## 技术栈

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- lucide-react
- Zustand
- OpenAI Images API 或 Codex 图片 API

## 本地启动

```bash
npm install
npm run dev
```

默认访问：

```text
http://localhost:3000
```

## 真实图像 API 配置

复制 `.env.example` 为 `.env.local`，并按需填写：

```bash
OPENAI_API_KEY=
IMAGE_MODEL=gpt-image-1
IMAGE_API_MODE=mock
IMAGE_PROVIDER=codex
CODEX_IMAGE_API_BASE_URL=http://127.0.0.1:8000
CODEX_IMAGE_API_TIMEOUT_SECONDS=900
```

- `IMAGE_API_MODE=mock`：使用内置 mock 图片结果，不调用真实服务。
- `IMAGE_API_MODE=real`：服务端调用真实图片后端。
- `IMAGE_PROVIDER=codex`：调用服务器本机的 `codex_image_api.py`。
- `IMAGE_PROVIDER=openai`：调用 OpenAI Images API。
- `CODEX_IMAGE_API_BASE_URL`：Next.js 服务端访问 Codex 图片 API 的地址，推荐只用内网或本机地址。
- `CODEX_IMAGE_API_TIMEOUT_SECONDS`：等待 Codex 图片 API 返回的最长时间。
- `OPENAI_API_KEY`：只在 OpenAI provider 下需要，只在服务端读取，不会暴露到前端。
- `IMAGE_MODEL`：OpenAI provider 的模型名，默认 `gpt-image-1`。

如果 `IMAGE_API_MODE=real`、`IMAGE_PROVIDER=openai` 但没有配置 `OPENAI_API_KEY`，接口会自动回退到 mock 结果，页面不会崩溃。使用 `IMAGE_PROVIDER=codex` 时不需要 OpenAI Key。

服务器部署请看：

```text
docs/deploy-codex-server.md
```

## 当前已实现能力

- `/api/images/edit`：接收 `multipart/form-data`，支持上传图片、prompt、工具类型、尺寸、质量和输出格式。
- `/api/images/product`：接收 `multipart/form-data`，基于商品图生成商业商品图；真实模式默认生成 1 张，mock 模式保留 4 张候选。
- `/api/images/poster`：接收 JSON，生成适合前端文字层叠加的海报背景图；真实模式默认生成 1 张，mock 模式保留候选版式。
- 服务端 prompt 模板：换背景、去杂物、增强清晰度、改风格、扩图、商品图、海报背景。
- Codex provider：编辑/商品图转发到 `/v1/images/reference`，海报背景转发到 `/v1/images/text`。
- 上传校验：支持 JPEG、PNG、WebP，单图最大 10MB。
- 前端状态：loading、success、error 展示，结果图支持下载和继续编辑。
- mock/real 响应结构尽量一致，便于后续替换为异步任务或对象存储。

## API 响应

成功响应示例：

```json
{
  "taskId": "image-task-xxx",
  "status": "succeeded",
  "mode": "real",
  "results": [
    {
      "id": "result-1",
      "url": "data:image/png;base64,...",
      "type": "edited",
      "label": "效果图 1"
    }
  ],
  "historyItem": {
    "id": "history-xxx",
    "title": "换背景",
    "createdAt": "2026-05-18T00:00:00.000Z",
    "thumbnail": "data:image/png;base64,..."
  }
}
```

失败响应示例：

```json
{
  "status": "failed",
  "error": {
    "code": "IMAGE_TOO_LARGE",
    "message": "图片大小不能超过 10MB"
  }
}
```

## 目录结构

```text
src/
  app/
    api/images/edit/route.ts
    api/images/product/route.ts
    api/images/poster/route.ts
  components/
    editor/
    product/
    poster/
    ui/
  lib/
    api-client.ts
    mock-data.ts
    mock-images.ts
    server/
      image-prompt-builder.ts
      image-route-utils.ts
      image-storage.ts
      image-validation.ts
      codex-image-api-service.ts
      openai-image-service.ts
  types/
    image.ts
server/
  codex_image_api.py
docs/
  deploy-codex-server.md
```

## 后续扩展位置

- mask 局部编辑：在 `/api/images/edit` 增加 `mask` 字段，并在前端补涂抹层。
- 对象存储：替换 `src/lib/server/image-storage.ts` 的 `saveBase64Image`，将结果保存到 `public/generated`、S3 或 OSS。
- 用户系统：在 API Route 中接入 session，给历史记录绑定用户。
- 积分系统：在真实模式调用前扣减额度，失败时回滚。
- 异步任务：新增任务表和 `/api/images/tasks/[taskId]`，支持轮询与排队。
