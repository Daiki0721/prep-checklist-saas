// 動作確認用のモックデータ(Test)
// AIのAPIをつなぐ前に、実際の画面で「どう見えるか」を確かめるためのサンプルデータ

import { PrepSheet } from "../types/prep";

//　サンプル(test)ノート
export const SAMPLE_RAW_NOTES = `dinner prep tonight duck breast x12 score skin & portion 180g, save trim for jus
veal stock reduce by half 4L, skim fat
prawns 2kg peel & devein
shallots dice 300g
check walk-in for leftover mirepoix before chopping more
label & date everything`;


//　仕込みシート・チェックリストのモックデータ(test)
export const MOCK_PREP_SHEET: PrepSheet = {
  id: "sheet-1",
  title: "Dinner Service Prep",
  raw_input: SAMPLE_RAW_NOTES,
  organized_notes:
    "Start veal stock reduction early and skim fat regularly. Check walk-in for existing mirepoix before prepping fresh vegetables. Label and date all containers.",
  items: [
    {
      id: "item-1",
      category: "Sauces & Stocks",
      task: "Reduce veal stock by half",
      quantity: "4 L",
      priority: "high",
      notes: "Skim fat regularly",
      is_completed: false,
      order: 1,
    },
    {
      id: "item-2",
      category: "Proteins",
      task: "Portion duck breasts and score skin",
      quantity: "12 x 180g",
      priority: "high",
      notes: "Keep trimmings for jus",
      is_completed: true,
      order: 2,
    },
    {
      id: "item-3",
      category: "Proteins",
      task: "Peel and devein prawns",
      quantity: "2 kg",
      priority: "normal",
      notes: "Hold on ice",
      is_completed: false,
      order: 3,
    },
    {
      id: "item-4",
      category: "Produce / Garde Manger",
      task: "Dice shallots",
      quantity: "300 g",
      priority: "normal",
      notes: "Check walk-in for mirepoix first",
      is_completed: false,
      order: 4,
    },
  ],
};