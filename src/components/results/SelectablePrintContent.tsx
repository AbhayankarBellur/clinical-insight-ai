import { useState, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Pencil, Check, X } from "lucide-react";

interface SelectablePrintContentProps {
  content: string;
  sectionKey: string;
  selectedItems: Record<string, Set<number>>;
  onSelectionChange: (sectionKey: string, index: number, checked: boolean) => void;
  editedItems?: Record<string, Record<number, string>>;
  onEditItem?: (sectionKey: string, index: number, value: string) => void;
  printMode: boolean;
}

/**
 * Parse multi-line content into clean individual items.
 * Only splits on numbered list items that appear at the START of a line
 * (preceded by nothing, newline, or whitespace only) to prevent false splits
 * on numbers embedded within sentence content (e.g. "V1 + R in V5/V6").
 */
function parseLines(content: string): { text: string; original: string }[] {
  // First split by actual newlines
  const rawLines = content.split("\n").filter((l) => l.trim().length > 0);
  const lines: { text: string; original: string }[] = [];

  for (const rawLine of rawLines) {
    const trimmed = rawLine.trim();

    // Only attempt secondary split if the line looks like concatenated numbered items:
    // must start with a digit+dot pattern AND contain another digit+dot pattern after at least 10 chars
    const looksLikeConcatenated = /^\d+\.\s+.{10,}\d+\.\s+/.test(trimmed);

    if (looksLikeConcatenated) {
      // Split only on boundaries that are clearly a new numbered list item:
      // a digit sequence + period + space that is preceded by end-of-sentence punctuation or sufficient content
      const parts = trimmed.split(/(?<=\S)\s+(?=\d+\.\s+[A-Z])/g).filter((s) => s.trim().length > 0);
      if (parts.length > 1) {
        for (const part of parts) {
          const clean = part.replace(/^\s*\d+[\.\)]\s*/, "").replace(/^\s*[-•]\s*/, "").replace(/\*\*/g, "").trim();
          if (clean.length > 0) {
            lines.push({ text: clean, original: part.trim() });
          }
        }
        continue;
      }
    }

    // Default: treat as single item, strip leading bullet/number
    const clean = trimmed
      .replace(/^\s*\d+[\.\)]\s*/, "")
      .replace(/^\s*[-•]\s*/, "")
      .replace(/\*\*/g, "")
      .trim();

    // Skip lines that are ONLY a bare number (artifact from over-split)
    if (/^\d+$/.test(clean)) continue;
    // Skip very short fragments that are clearly artifacts (1-2 chars)
    if (clean.length <= 2) continue;

    if (clean.length > 0) {
      lines.push({ text: clean, original: trimmed });
    }
  }

  return lines;
}

export function SelectablePrintContent({
  content,
  sectionKey,
  selectedItems,
  onSelectionChange,
  editedItems = {},
  onEditItem,
  printMode,
}: SelectablePrintContentProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<string>("");

  if (!content) return null;

  const lines = parseLines(content);
  const selected = selectedItems[sectionKey] || new Set<number>();
  const sectionEdits = editedItems[sectionKey] || {};

  const startEdit = (index: number, currentText: string) => {
    setEditingIndex(index);
    setEditDraft(sectionEdits[index] ?? currentText);
  };

  const commitEdit = (index: number) => {
    onEditItem?.(sectionKey, index, editDraft.trim());
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditDraft("");
  };

  if (printMode) {
    const selectedLines = lines.filter((_, i) => selected.has(i));
    if (selectedLines.length === 0)
      return <p className="text-muted-foreground italic text-sm">No items selected</p>;
    return (
      <div className="space-y-1">
        {selectedLines.map((line, i) => {
          const originalIndex = lines.indexOf(line);
          const displayText = sectionEdits[originalIndex] ?? line.text;
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-foreground text-sm leading-relaxed">{displayText}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {lines.map((line, index) => {
        const isChecked = selected.has(index);
        const isEditing = editingIndex === index;
        const displayText = sectionEdits[index] ?? line.text;

        return (
          <div
            key={index}
            className={cn(
              "flex items-start gap-2.5 p-2 rounded-lg transition-colors",
              isChecked ? "bg-primary/5 border border-primary/20" : "hover:bg-accent/30"
            )}
          >
            <Checkbox
              checked={isChecked}
              onCheckedChange={(checked) => onSelectionChange(sectionKey, index, !!checked)}
              className="mt-0.5 flex-shrink-0 cursor-pointer"
            />

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-start gap-1.5">
                  <textarea
                    className="flex-1 text-sm leading-relaxed bg-background border border-primary/40 rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-primary/60 text-foreground"
                    rows={Math.max(2, Math.ceil(editDraft.length / 60))}
                    value={editDraft}
                    autoFocus
                    onChange={(e) => setEditDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(index); }
                      if (e.key === "Escape") cancelEdit();
                    }}
                  />
                  <div className="flex flex-col gap-1 mt-0.5">
                    <button
                      onClick={() => commitEdit(index)}
                      className="p-1 rounded text-primary hover:bg-primary/10 transition-colors"
                      title="Save"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1 rounded text-muted-foreground hover:bg-accent/50 transition-colors"
                      title="Cancel"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-1.5 group/item">
                  <span
                    className={cn(
                      "text-sm leading-relaxed flex-1",
                      isChecked ? "text-foreground font-medium" : "text-muted-foreground"
                    )}
                  >
                    {displayText}
                    {isChecked && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold uppercase">
                        Doctor Approved
                      </span>
                    )}
                  </span>
                  {isChecked && onEditItem && (
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(index, displayText); }}
                      className="opacity-0 group-hover/item:opacity-100 p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex-shrink-0 mt-0.5"
                      title="Edit this item"
                    >
                      <Pencil size={11} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
