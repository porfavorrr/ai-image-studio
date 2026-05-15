"use client";

import { create } from "zustand";
import type { EditImageResult, EditTool, HistoryItem } from "@/types/image";
import { mockImages } from "@/lib/mock-data";

interface StudioState {
  uploadedImage: string | null;
  currentImage: string | null;
  prompt: string;
  selectedTool: EditTool;
  editResults: EditImageResult[];
  selectedResult: EditImageResult | null;
  history: HistoryItem[];
  setUploadedImage: (imageUrl: string) => void;
  setCurrentImage: (imageUrl: string) => void;
  setPrompt: (prompt: string) => void;
  setSelectedTool: (tool: EditTool) => void;
  setEditResults: (results: EditImageResult[]) => void;
  setSelectedResult: (result: EditImageResult) => void;
  addHistoryItem: (item: HistoryItem) => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  uploadedImage: null,
  currentImage: null,
  prompt: "",
  selectedTool: "custom",
  editResults: [],
  selectedResult: null,
  history: [
    {
      id: "history-initial",
      title: "示例原图",
      createdAt: new Date().toISOString(),
      thumbnail: mockImages.original
    }
  ],
  setUploadedImage: (imageUrl) =>
    set(() => ({
      uploadedImage: imageUrl,
      currentImage: imageUrl,
      selectedResult: null,
      editResults: [],
      history: [
        {
          id: `history-upload-${Date.now()}`,
          title: "上传原图",
          createdAt: new Date().toISOString(),
          thumbnail: imageUrl
        }
      ]
    })),
  setCurrentImage: (imageUrl) => set({ currentImage: imageUrl }),
  setPrompt: (prompt) => set({ prompt }),
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setEditResults: (results) => set({ editResults: results }),
  setSelectedResult: (result) => set({ selectedResult: result, currentImage: result.url }),
  addHistoryItem: (item) => set((state) => ({ history: [...state.history, item] }))
}));
