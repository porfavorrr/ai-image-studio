"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { mockImages } from "@/lib/mock-data";
import { useStudioStore } from "@/lib/studio-store";

export function HeroSection() {
  const router = useRouter();
  const setUploadedImage = useStudioStore((state) => state.setUploadedImage);

  return (
    <section className="relative overflow-hidden rounded-lg border border-white/70 bg-slate-950 px-5 py-14 shadow-soft lg:px-12 lg:py-20">
      <div className="absolute inset-0 opacity-80">
        <img src={mockImages.poster6} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(8,13,34,0.92)_0%,rgba(20,33,80,0.74)_44%,rgba(255,255,255,0.12)_100%)]" />
      <div className="absolute inset-x-8 bottom-8 hidden h-28 rounded-lg bg-white/10 blur-3xl lg:block" />

      <div className="relative z-10 mx-auto max-w-5xl text-center text-white">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-sm font-medium backdrop-blur">
          <WandSparkles className="h-4 w-4 text-cyan-200" />
          AI 图片助手 Demo
        </div>
        <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold leading-tight tracking-normal md:text-6xl">
          一句话完成修图、换背景、做商品图与封面海报
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-200">
          上传图片或输入需求，AI 智能理解，一键生成高质量图片
        </p>

        <div className="mx-auto mt-10 max-w-3xl rounded-lg border border-white/18 bg-white/14 p-3 shadow-2xl backdrop-blur-xl">
          <UploadDropzone
            compact
            title="把图片拖到这里，立即开始修图"
            subtitle="当前 Demo 会保留上传预览，并进入完整编辑工作台"
            className="min-h-[260px] border-white/25 bg-white/90 text-ink"
            onImageSelected={(imageUrl) => {
              setUploadedImage(imageUrl);
              router.push("/editor");
            }}
          />
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/editor">
            <Button size="lg">
              进入修图工作台
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/templates">
            <Button size="lg" variant="secondary" className="bg-white/92">
              浏览热门模板
            </Button>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-200">
          {["换背景", "智能去物", "商品图生成", "封面海报", "可替换真实模型"].map((item) => (
            <span key={item} className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-cyan-200" />
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="pointer-events-none relative z-10 mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3">
        {[mockImages.edit1, mockImages.product2, mockImages.poster1].map((image, index) => (
          <div
            key={image}
            className="overflow-hidden rounded-lg border border-white/14 bg-white/10 p-2 shadow-2xl backdrop-blur"
          >
            <img
              src={image}
              alt={`生成效果 ${index + 1}`}
              className="h-44 w-full rounded-lg object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
