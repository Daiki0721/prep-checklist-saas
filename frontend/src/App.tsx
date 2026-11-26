import { useEffect, useRef, useState } from "react";
import { prepApi } from "./api/prepApi";
import { ChecklistSection } from "./components/ChecklistSection";
import { OrganizedNotesCard } from "./components/OrganizedNotesCard";
import { PrepInputForm } from "./components/PrepInputForm";
import { SAMPLE_RAW_NOTES } from "./data/mockPrepSheet";
import type { ChecklistItem, PrepSheet } from "./types/prep";

export function App() {
  const [currentSheetId, setCurrentSheetId] = useState<number | null>(null);
  const [title, setTitle] = useState<string>("Dinner Service Prep");
  const [rawInput, setRawInput] = useState<string>(SAMPLE_RAW_NOTES);
  const [organizedNotes, setOrganizedNotes] = useState<string>("");
  const [items, setItems] = useState<ChecklistItem[]>([]);

  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 直前にDBへ保存した organized_notes を記録し、変更がないときの無駄なPATCHを防ぐ
  const lastSavedNotesRef = useRef<string>("");

  const applySheetToState = (sheet: PrepSheet) => {
    setCurrentSheetId(sheet.id);
    setTitle(sheet.title);
    setRawInput(sheet.raw_input);
    setOrganizedNotes(sheet.organized_notes);
    lastSavedNotesRef.current = sheet.organized_notes;
    setItems(sheet.items);
  };

  // 初回表示時にDBから最新の仕込みシートを取得
  useEffect(() => {
    let active = true;

    const fetchInitialSheet = async () => {
      try {
        setErrorMessage(null);
        const sheets = await prepApi.listSheets();
        if (!active) return;

        if (sheets.length > 0) {
          applySheetToState(sheets[0]);
        }
      } catch (err) {
        if (!active) return;
        setErrorMessage(
          err instanceof Error ? err.message : "Failed to load prep sheets."
        );
      } finally {
        if (active) {
          setIsLoadingInitial(false);
        }
      }
    };

    fetchInitialSheet();

    return () => {
      active = false;
    };
  }, []);

  // メモ入力 → AI生成 → DB保存
  const handleGenerate = async () => {
    if (!rawInput.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const createdSheet = await prepApi.generateSheet({
        title: title.trim() || undefined,
        raw_input: rawInput,
      });
      applySheetToState(createdSheet);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to generate prep checklist."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // 整理済みメモの編集をDB保存（onBlur で呼ばれる）
  const handleSaveOrganizedNotes = async () => {
    if (!currentSheetId) return;
    if (organizedNotes === lastSavedNotesRef.current) return;

    setIsSavingNotes(true);
    setErrorMessage(null);

    try {
      const updated = await prepApi.updateSheet(currentSheetId, {
        organized_notes: organizedNotes,
      });
      setOrganizedNotes(updated.organized_notes);
      lastSavedNotesRef.current = updated.organized_notes;
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save organized notes."
      );
    } finally {
      setIsSavingNotes(false);
    }
  };

  // チェック状態の切り替え（楽観的UI更新 + DB永続化）
  const handleToggleItem = async (itemId: number) => {
    const target = items.find((item) => item.id === itemId);
    if (!target) return;

    const nextCompleted = !target.is_completed;
    setErrorMessage(null);

    // 先に画面を更新
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, is_completed: nextCompleted } : item
      )
    );

    try {
      const updatedItem = await prepApi.updateChecklistItem(itemId, {
        is_completed: nextCompleted,
      });
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? updatedItem : item))
      );
    } catch (err) {
      // 失敗したら元の状態に戻す
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, is_completed: target.is_completed } : item
        )
      );
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to update checklist item."
      );
    }
  };

  // チェックリスト項目の削除（DB削除 + 画面反映）
  const handleDeleteItem = async (itemId: number) => {
    setErrorMessage(null);
    try {
      await prepApi.deleteChecklistItem(itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to delete checklist item."
      );
    }
  };

  const handleLoadSample = () => {
    setTitle("Dinner Service Prep");
    setRawInput(SAMPLE_RAW_NOTES);
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
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
            {currentSheetId ? `Sheet #${currentSheetId}` : "Draft"}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex items-center justify-between gap-4"
          >
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs font-semibold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {isLoadingInitial ? (
          <div className="rounded-xl bg-white border border-stone-200 p-8 text-center text-sm text-stone-500">
            Loading prep sheet...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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

            <div className="lg:col-span-7 space-y-6">
              <OrganizedNotesCard
                notes={organizedNotes}
                isSaving={isSavingNotes}
                onChangeNotes={setOrganizedNotes}
                onSaveNotes={handleSaveOrganizedNotes}
              />
              <ChecklistSection
                items={items}
                onToggleItem={handleToggleItem}
                onDeleteItem={handleDeleteItem}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
