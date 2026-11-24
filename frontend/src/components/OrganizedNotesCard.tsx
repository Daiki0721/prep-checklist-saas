// 整理済みメモ表示カード
// AIが抽出した「全体メモ・申し送り（organized_notes）」を表示するカード

import React from "react";

interface OrganizedNotesCardProps {
  notes: string;
  onChangeNotes: (value: string) => void;
}

export const OrganizedNotesCard: React.FC<OrganizedNotesCardProps> = ({
  notes,
  onChangeNotes,
}) => {
  return (
    <section className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-900">
          Organized Notes & Handover
        </h2>
        <span className="text-[11px] text-amber-800/70">Editable</span>
      </div>

      <textarea
        rows={3}
        value={notes}
        onChange={(e) => onChangeNotes(e.target.value)}
        placeholder="Key reminders, station notes, or storage instructions will appear here..."
        className="w-full rounded-lg border border-amber-200 bg-white/90 p-3 text-sm leading-relaxed text-stone-800 placeholder:text-stone-400 focus:bg-white focus:border-amber-600 focus:outline-none resize-y"
      />
    </section>
  );
};