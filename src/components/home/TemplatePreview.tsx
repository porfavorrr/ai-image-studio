import Link from "next/link";
import { ArrowRight, Check, SplitSquareHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SmartImage } from "@/components/ui/SmartImage";
import { editMockResults, mockImages, templates } from "@/lib/mock-data";
import { formatUsageCount } from "@/lib/utils";

export function TemplatePreview() {
  const hotTemplates = templates.slice(0, 6);

  return (
    <section className="grid gap-6 pb-16 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="overflow-hidden p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Badge variant="purple">热门模板</Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-normal text-ink">汇报时能直接点开的模板库</h2>
          </div>
          <Link href="/templates">
            <Button variant="outline">
              查看全部
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {hotTemplates.map((template) => (
            <Link
              key={template.id}
              href={template.route}
              className="group overflow-hidden rounded-lg border border-line bg-slate-50 transition hover:-translate-y-1 hover:border-studio-200 hover:bg-white hover:shadow-card"
            >
              <SmartImage src={template.thumbnail} alt={template.name} className="h-36 w-full rounded-none border-0" />
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-ink">{template.name}</h3>
                  <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-line">
                    {template.category}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{template.description}</p>
                <p className="mt-3 text-xs font-medium text-studio-600">{formatUsageCount(template.usageCount)}</p>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
            <SplitSquareHorizontal className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-studio-600">生成效果</p>
            <h2 className="text-2xl font-bold tracking-normal text-ink">从原图到可用结果</h2>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-line bg-slate-100">
          <div className="grid grid-cols-2">
            <div className="relative">
              <SmartImage src={mockImages.original} alt="原图" className="h-72 w-full rounded-none border-0" />
              <span className="absolute left-3 top-3 rounded-full bg-white/88 px-3 py-1 text-xs font-semibold text-slate-700">
                Before
              </span>
            </div>
            <div className="relative border-l border-white">
              <SmartImage src={editMockResults[0].url} alt="效果图" className="h-72 w-full rounded-none border-0" />
              <span className="absolute left-3 top-3 rounded-full bg-studio-600 px-3 py-1 text-xs font-semibold text-white">
                After
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {["前端调用真实 API 路径", "后端 route handler 返回结构化任务结果", "结果可继续进入编辑工作流"].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <Check className="h-4 w-4 text-emerald-500" />
              {item}
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
