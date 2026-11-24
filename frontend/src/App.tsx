//画面全体を src/App.tsx に組み立てる
//入力フォーム・整理済みメモ・チェックリストを1画面
//画面幅が広いPC/タブレットでは「左：メモ入力、右：整理済みメモ＋チェックリスト」の2カラムになり、
//スマホや狭い画面では縦に並ぶレスポンシブレイアウト

import { useState } from "react";
import type { ChecklistItem } from "./types/prep";
import { MOCK_PREP_SHEET, SAMPLE_RAW_NOTES } from "./data/mockPrepSheet";
import { PrepInputForm } from "./components/PrepInputForm";
import { OrganizedNotesCard } from "./components/OrganizedNotesCard";
import { ChecklistSection } from "./components/ChecklistSection";

export function App() {
  const [title, setTitle] = useState<string>(MOCK_PREP_SHEET.title);
  const [rawInput, setRawInput] = useState<string>(MOCK_PREP_SHEET.raw_input);
  const [organizedNotes, setOrganizedNotes] = useState<string>(
    MOCK_PREP_SHEET.organized_notes
  );
  const [items, setItems] = useState<ChecklistItem[]>(MOCK_PREP_SHEET.items);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // モックの生成処理（後ほどDjangoのPOST /api/prep-sheets/generate/ に置き換え）
  const handleGenerate = () => {
    setIsGenerating(true);
    // 500ms後にモックの整理済みメモとチェックリストを生成する
    setTimeout(() => {
      // 入力されたメモを行ごとに分割し、空行を除外して整理する
      const lines = rawInput
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      // 各行をチェックリスト項目に変換する
      const generatedItems: ChecklistItem[] = lines.map((line, index) => ({
        id: `gen-${Date.now()}-${index}`,
        category: "Mise en Place",
        task: line,
        quantity: "",
        priority: index === 0 ? "high" : "normal",
        notes: "",
        is_completed: false,
        order: index + 1,
      }));
      // 整理済みメモとチェックリストを更新する
      setOrganizedNotes(
        "Review station priorities before service and confirm par levels with the team."
      );
      setItems(generatedItems);
      setIsGenerating(false);
    }, 500);
  };
  // サンプルノートをロードする処理
  const handleLoadSample = () => {
    setTitle("Dinner Service Prep");
    setRawInput(SAMPLE_RAW_NOTES);
  };
  // チェックリスト項目の完了状態を切り替える処理
  const handleToggleItem = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, is_completed: !item.is_completed } : item
      )
    );
  };
  // チェックリスト項目を削除する処理
  const handleDeleteItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      {/* ヘッダー */}
      <header className="bg-white border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900">
              Mise & Prep
            </h1>
            <p className="text-xs text-stone-500">
              AI Kitchen Notes & Mise en Place Checklist
            </p>
          </div>
          <span className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
            MVP Preview
          </span>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 左カラム：メモ入力（5/12） */}
          <div className="lg:col-span-5">
            <PrepInputForm
              title={title}
              rawInput={rawInput}
              isGenerating={isGenerating}
              onTitleChange={setTitle}
              onRawInputChange={setRawInput}
              onGenerate={handleGenerate}
              onLoadSample={handleLoadSample}
            />
          </div>

          {/* 右カラム：整理済みメモ＋チェックリスト（7/12） */}
          <div className="lg:col-span-7 space-y-6">
            <OrganizedNotesCard
              notes={organizedNotes}
              onChangeNotes={setOrganizedNotes}
            />
            <ChecklistSection
              items={items}
              onToggleItem={handleToggleItem}
              onDeleteItem={handleDeleteItem}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
