# ai-image-studio

一个可本地运行的 AI P 图网站 Demo，定位为“AI 图片助手”。用户可以上传图片、选择任务或输入自然语言，完成修图、换背景、去杂物、商品图生成、封面海报生成等演示流程。

当前版本为内部汇报和产品 Demo：接口已按真实服务方式保留，`src/app/api/images/*` 目前返回 mock 数据，未来可在 `src/lib/services/image-service.ts` 替换为真实图像生成模型调用。

## 技术栈

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- lucide-react
- Zustand
- Next.js Route Handlers mock API

## 功能列表

- 首页：Hero、上传入口、任务入口、热门模板、前后对比展示
- 修图工作台：原图预览、prompt 编辑、快捷工具、3 张候选结果、before/after、编辑历史
- 商品图工作室：商品上传、模板选择、参数配置、4 张商品图结果、编辑跳转
- 封面/海报生成器：用途选择、实时画布、文字样式设置、图层管理、候选版式
- 模板中心：分类筛选、模板卡片、按模板跳转到对应工作台
- API 能力说明页：能力卡片、调用流程、mock 请求示例
- Mock API：编辑、商品图、海报、模板列表、健康检查

## 本地启动

```bash
npm install
npm run dev
```

默认访问：

```text
http://localhost:3000
```

构建检查：

```bash
npm run lint
npm run build
```

## 目录结构

```text
src/
  app/
    page.tsx
    editor/page.tsx
    product/page.tsx
    poster/page.tsx
    templates/page.tsx
    api-platform/page.tsx
    api/
      health/route.ts
      templates/route.ts
      images/
        edit/route.ts
        product/route.ts
        poster/route.ts
  components/
    layout/
    ui/
    home/
    editor/
    product/
    poster/
    templates/
  lib/
    api-client.ts
    mock-data.ts
    studio-store.ts
    services/
  types/
public/
  mock/
```

## Mock API

### `POST /api/images/edit`

用于修图、换背景、去杂物、增强、改风格、扩图。

```json
{
  "imageUrl": "string",
  "prompt": "string",
  "tool": "background"
}
```

返回任务 id、3 张候选结果和一条历史记录。

### `POST /api/images/product`

用于生成商品图。

```json
{
  "imageUrl": "string",
  "template": "white-bg",
  "scene": "desk",
  "style": "premium",
  "sellingPoints": "轻盈质感",
  "ratio": "1:1"
}
```

返回任务 id 和 4 张商品图结果。

### `POST /api/images/poster`

用于生成封面/海报候选版式。

```json
{
  "title": "7 天练出自然英语口语",
  "subtitle": "每天 30 分钟 · 轻松开口说英语",
  "usage": "xiaohongshu",
  "style": "clean",
  "ratio": "3:4"
}
```

返回任务 id 和 6 个 mock 版式。

### `GET /api/templates`

返回模板库列表。

### `GET /api/health`

返回服务健康状态。

## 后续接入真实图像模型

当前 API 调用链路为：

```text
前端组件 -> src/lib/api-client.ts -> src/app/api/images/* -> src/lib/services/image-service.ts -> mock 数据
```

后续接入真实图像服务时，优先替换：

- `src/lib/services/image-service.ts`
- `src/lib/mock-data.ts` 中的结果图片来源
- 如需任务轮询，可新增 `src/app/api/images/tasks/[taskId]/route.ts`

前端页面和类型定义已经围绕任务 id、状态、结果数组、历史记录设计，适合平滑升级为真实异步生成流程。
