import { ArrowRight, Braces, Cloud, Database, Image, Layers, Route, ServerCog, Sparkles } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { apiCapabilities } from "@/lib/mock-data";

const flow = [
  { label: "业务系统", icon: Route },
  { label: "API Gateway", icon: ServerCog },
  { label: "任务编排", icon: Layers },
  { label: "图像模型", icon: Sparkles },
  { label: "对象存储", icon: Cloud },
  { label: "返回结果", icon: Database }
];

export default function ApiPlatformPage() {
  return (
    <PageShell>
      <section className="overflow-hidden rounded-lg border border-white/80 bg-slate-950 p-8 text-white shadow-soft lg:p-12">
        <Badge className="bg-white/12 text-cyan-100 ring-white/15">API 能力说明</Badge>
        <h1 className="mt-5 text-4xl font-bold tracking-normal lg:text-5xl">图像能力 API 平台</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
          将图片生成、图片编辑、局部编辑、模板生成等能力封装为统一服务，供业务系统按任务方式调用。
          当前 Demo 已保留 route handler、service 层与结构化响应，后续可直接替换真实图像服务。
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {apiCapabilities.map((capability) => (
          <Card key={capability} className="p-5 hover:-translate-y-1 hover:border-studio-200 hover:shadow-soft">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-button-gradient text-white">
              <Image className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-ink">{capability}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              统一鉴权、任务 id、状态查询、结果数组与错误处理，便于接入不同业务页面。
            </p>
          </Card>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <div className="mb-6">
            <p className="text-sm font-semibold text-studio-600">调用流程</p>
            <h2 className="mt-1 text-2xl font-bold text-ink">从业务请求到图片结果</h2>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
            {flow.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-center gap-3 lg:flex-1">
                  <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-line bg-slate-50 p-4 lg:min-h-[150px] lg:flex-col lg:items-start lg:justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white text-studio-600 shadow-sm ring-1 ring-line">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-ink">{item.label}</p>
                  </div>
                  {index < flow.length - 1 ? (
                    <ArrowRight className="hidden h-5 w-5 shrink-0 text-slate-300 lg:block" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-line bg-slate-50 px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Braces className="h-4 w-4 text-studio-600" />
              Mock 调用示例
            </div>
          </div>
          <pre className="overflow-x-auto bg-slate-950 p-6 text-sm leading-7 text-slate-100">
            <code>{`POST /api/images/edit
Content-Type: application/json

{
  "imageUrl": "/mock/original.svg",
  "prompt": "把背景换成干净的白色摄影棚，主体保持不变",
  "tool": "background"
}

Response
{
  "taskId": "mock-task-id",
  "status": "succeeded",
  "results": [
    {
      "id": "result-1",
      "url": "/mock/edit-1.svg",
      "type": "edited",
      "label": "效果图 1"
    }
  ]
}`}</code>
          </pre>
        </Card>
      </section>
    </PageShell>
  );
}
