"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { BeforeAfter } from "@/components/editor/BeforeAfter";
import { HistoryTimeline } from "@/components/editor/HistoryTimeline";
import { PromptPanel } from "@/components/editor/PromptPanel";
import { ResultGallery } from "@/components/editor/ResultGallery";
import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { UploadDropzone } from "@/components/ui/UploadDropzone";
import { apiClient } from "@/lib/api-client";
import { editMockResults, mockImages, toolPrompts } from "@/lib/mock-data";
import { sleep } from "@/lib/utils";
import { useStudioStore } from "@/lib/studio-store";
import type { EditTool } from "@/types/image";

const steps = ["上传图片", "描述需求", "生成结果", "继续修改"];

export function EditorWorkspace() {
  const [loading, setLoading] = useState(false);
  const {
    uploadedImage,
    currentImage,
    prompt,
    selectedTool,
    editResults,
    selectedResult,
    history,
    setUploadedImage,
    setPrompt,
    setSelectedTool,
    setEditResults,
    setSelectedResult,
    addHistoryItem
  } = useStudioStore();

  const originalImage = uploadedImage ?? mockImages.original;
  const visibleResults = editResults.length > 0 ? editResults : editMockResults;
  const currentVersion = currentImage ?? selectedResult?.url ?? visibleResults[0]?.url ?? mockImages.edit1;

  const activeStep = useMemo(() => {
    if (editResults.length > 0) return 3;
    if (prompt) return 2;
    if (uploadedImage) return 1;
    return 0;
  }, [editResults.length, prompt, uploadedImage]);

  const handleGenerate = async () => {
    const finalPrompt = prompt.trim() || toolPrompts[selectedTool] || "提升图片整体质感，画面更干净自然";
    const finalTool: EditTool = selectedTool || "custom";

    setLoading(true);
    try {
      const [response] = await Promise.all([
        apiClient.editImage({
          imageUrl: currentImage ?? originalImage,
          prompt: finalPrompt,
          tool: finalTool
        }),
        sleep(1000)
      ]);

      setEditResults(response.results);
      setSelectedResult(response.results[0]);
      addHistoryItem({
        ...response.historyItem,
        thumbnail: response.results[0].url
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold text-studio-600">AI 修图工作台</p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal text-ink">上传图片，描述需求，拿到可继续修改的结果</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${
                index <= activeStep ? "bg-studio-100 text-studio-700" : "bg-white text-slate-500 ring-1 ring-line"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_340px]">
        <Card className="p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-studio-600">原图</p>
            <h2 className="mt-1 text-xl font-bold text-ink">输入素材</h2>
          </div>
          <UploadDropzone
            value={originalImage}
            compact
            title="上传原图"
            subtitle="拖拽或点击替换当前图片"
            className="min-h-[360px]"
            onImageSelected={(imageUrl) => setUploadedImage(imageUrl)}
          />
        </Card>

        <div className="grid gap-6">
          <ResultGallery
            results={visibleResults}
            selectedId={selectedResult?.id}
            loading={loading}
            placeholder={editResults.length === 0}
            onSelect={(result) => setSelectedResult(result)}
          />
          <BeforeAfter before={originalImage} after={currentVersion} />
        </div>

        <PromptPanel
          prompt={prompt}
          selectedTool={selectedTool}
          loading={loading}
          onPromptChange={setPrompt}
          onToolChange={setSelectedTool}
          onGenerate={handleGenerate}
        />
      </div>

      <div className="mt-6">
        <HistoryTimeline items={history} />
      </div>
    </PageShell>
  );
}
