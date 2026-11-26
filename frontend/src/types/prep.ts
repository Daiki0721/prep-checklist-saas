// 仕込みシート・チェックリスト項目の型定義

export type PriorityLevel = "high" | "normal";


export interface ChecklistItem {
  id: number;
  prep_sheet: number;
  category: string;
  task: string;
  quantity: string;
  priority: PriorityLevel;
  notes: string;
  is_completed: boolean;
  order: number;
}


export interface PrepSheet {
  id: number;
  title: string;
  raw_input: string;
  organized_notes: string;
  items: ChecklistItem[];
  created_at: string;
  updated_at: string;
}