// メモ入力フォームコンポーネント
//ユーザーが雑多なメモを貼り付けたり打ち込んだりして、「Generate Checklist」ボタンを押すエリア

import React from "react";

// InputフォームのPropsの型定義
// App.tsx からこのコンポーネントに渡す「引数（Props）のルール」
interface PrepInputFormProps {
  title: string;
  rawInput: string;
  isGenerating: boolean;
  onTitleChange: (value: string) => void;
  onRawInputChange: (value: string) => void;
  onGenerate: () => void;
  onLoadSample: () => void;
}

// メモ入力フォームコンポーネント
export const PrepInputForm: React.FC<PrepInputFormProps> = ({
  title,
  rawInput,
  isGenerating,
  onTitleChange,
  onRawInputChange,
  onGenerate,
  onLoadSample,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawInput.trim() || isGenerating) return;
    onGenerate();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4"
    >
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="prep-title"
          className="text-xs font-semibold uppercase tracking-wider text-stone-500"
        >
          Prep Sheet Title
        </label>
        <button
          type="button"
          onClick={onLoadSample}
          className="text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2 cursor-pointer"
        >
          Load sample notes
        </button>
      </div>

      <input
        id="prep-title"
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="e.g., Dinner Prep - Friday"
        className="w-full rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-800 focus:outline-none"
      />

      <div>
        <label
          htmlFor="raw-notes"
          className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5"
        >
          Rough Kitchen Notes
        </label>
        <textarea
          id="raw-notes"
          rows={8}
          value={rawInput}
          onChange={(e) => onRawInputChange(e.target.value)}
          placeholder="Paste messy notes, shorthand, quantities, or station reminders..."
          className="w-full rounded-lg border border-stone-300 bg-stone-50 p-3 text-sm leading-relaxed text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-800 focus:outline-none resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={!rawInput.trim() || isGenerating}
        className="w-full rounded-lg bg-stone-900 px-4 py-3 text-sm font-semibold text-white hover:bg-stone-800 disabled:bg-stone-300 disabled:text-stone-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
      >
        {isGenerating ? "Generating Prep List..." : "Generate Checklist"}
      </button>
    </form>
  );
};