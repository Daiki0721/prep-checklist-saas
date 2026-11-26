//コンポーネント（App.tsx やボタン）の中に fetch("[http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/)...") 
// を直接書き散らすと、URL変更やエラー処理の修正が大変。
// 通信処理を src/api/prepApi.ts に集約

import type { ChecklistItem, PrepSheet } from "../types/prep";

// 環境変数 VITE_API_BASE_URL があればそれを使い、なければローカルのDjangoサーバーを使う
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  // 204 No Content（DELETE成功時など）はボディが空なので null 相当で返す
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Django DRF が返す {"detail": "..."} やバリデーションエラーを分かりやすく取り出す
    const message =
      (data && typeof data === "object" && "detail" in data && String(data.detail)) ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export const prepApi = {
  /** 仕込みシート一覧を取得 */
  listSheets(): Promise<PrepSheet[]> {
    return request<PrepSheet[]>("/prep-sheets/");
  },

  /** 雑多なメモからAIで仕込みシート＋チェックリストを生成してDB保存 */
  generateSheet(payload: { title?: string; raw_input: string }): Promise<PrepSheet> {
    return request<PrepSheet>("/prep-sheets/generate/", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /** 仕込みシート本体（organized_notes や title など）を部分更新 */
  updateSheet(
    sheetId: number,
    payload: Partial<Pick<PrepSheet, "title" | "raw_input" | "organized_notes">>
  ): Promise<PrepSheet> {
    return request<PrepSheet>(`/prep-sheets/${sheetId}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  /** チェックリスト項目（is_completed や task など）を部分更新 */
  updateChecklistItem(
    itemId: number,
    payload: Partial<ChecklistItem>
  ): Promise<ChecklistItem> {
    return request<ChecklistItem>(`/checklist-items/${itemId}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  /** チェックリスト項目を削除 */
  deleteChecklistItem(itemId: number): Promise<void> {
    return request<void>(`/checklist-items/${itemId}/`, {
      method: "DELETE",
    });
  },
};
