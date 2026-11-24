//チェックリスト表示コンポーネント
// 現場での使いやすさを考えて、次の工夫を入れています。
//1. カテゴリ（Station / Prep Type）ごとにグループ化して表示する。
//2. 進捗カウンター（例：1 / 4 completed）をヘッダーに表示し、残タスクが一目でわかるようにする。
//3. チェックボックスと行全体を大きめのタップ領域にして、手が少し濡れていたり急いでいたりしても押しやすくする。
//4. priority === "high" の項目にはバッジをつけ、仕込みに時間がかかるものや優先度が高いものを際立たせる。

import React from "react";
import { ChecklistItem } from "../types/prep";

interface ChecklistSectionProps {
  items: ChecklistItem[];
  onToggleItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
}

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({
  items,
  onToggleItem,
  onDeleteItem,
}) => {
  const completedCount = items.filter((item) => item.is_completed).length;

  // カテゴリごとにアイテムをまとめる（出現順を維持）
  const groupedEntries = React.useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const item of items) {
      const cat = item.category || "General";
      const existing = map.get(cat) ?? [];
      existing.push(item);
      map.set(cat, existing);
    }
    return Array.from(map.entries());
  }, [items]);

  return (
    <section className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-stone-900">Prep Checklist</h2>
          <p className="text-xs text-stone-500">
            Tap items to mark as completed during prep
          </p>
        </div>
        <div className="text-right">
          <span className="inline-block rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
            {completedCount} / {items.length} done
          </span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center text-sm text-stone-400">
          No checklist items yet. Enter rough notes and click{" "}
          <span className="font-medium text-stone-600">Generate Checklist</span>.
        </div>
      ) : (
        <div className="space-y-6">
          {groupedEntries.map(([category, categoryItems]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 px-1">
                {category}
              </h3>

              <ul className="divide-y divide-stone-100 border border-stone-200/80 rounded-lg overflow-hidden">
                {categoryItems.map((item) => (
                  <li
                    key={item.id}
                    className={`flex items-start justify-between gap-3 p-3.5 transition-colors ${
                      item.is_completed ? "bg-stone-50/80" : "bg-white hover:bg-stone-50/50"
                    }`}
                  >
                    <label className="flex items-start gap-3 flex-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={item.is_completed}
                        onChange={() => onToggleItem(item.id)}
                        className="mt-1 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-800 cursor-pointer"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              item.is_completed
                                ? "line-through text-stone-400"
                                : "text-stone-900"
                            }`}
                          >
                            {item.task}
                          </span>

                          {item.quantity && (
                            <span className="inline-flex items-center rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700">
                              {item.quantity}
                            </span>
                          )}

                          {item.priority === "high" && !item.is_completed && (
                            <span className="inline-flex items-center rounded bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                              High priority
                            </span>
                          )}
                        </div>

                        {item.notes && (
                          <p
                            className={`mt-1 text-xs ${
                              item.is_completed ? "text-stone-400" : "text-stone-500"
                            }`}
                          >
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      aria-label={`Delete ${item.task}`}
                      className="text-xs text-stone-400 hover:text-rose-600 px-1.5 py-1 rounded cursor-pointer"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
