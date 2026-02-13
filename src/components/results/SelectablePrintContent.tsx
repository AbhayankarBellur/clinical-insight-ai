import { useState, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface SelectablePrintContentProps {
  content: string;
  sectionKey: string;
  selectedItems: Record<string, Set<number>>;
  onSelectionChange: (sectionKey: string, index: number, checked: boolean) => void;
  printMode: boolean;
}

function parseLines(content: string): { text: string; original: string }[] {
  const rawLines = content.split("\n").filter((l) => l.trim().length > 0);
  const lines: { text: string; original: string }[] = [];
  
  for (const rawLine of rawLines) {
    // Split if multiple numbered items are concatenated on one line
    const splitByNumbers = rawLine.split(/(?=\d+\.\s+)/g).filter(s => s.trim());
    const parts = splitByNumbers.length > 1 ? splitByNumbers : [rawLine];
    
    for (const part of parts) {
      lines.push({
        text: part.replace(/^\s*\d+[\.\)]\s*/, "").replace(/^\s*[-•]\s*/, "").replace(/\*\*/g, "").trim(),
        original: part.trim(),
      });
    }
  }
  
  return lines;
}

export function SelectablePrintContent({
  content,
  sectionKey,
  selectedItems,
  onSelectionChange,
  printMode,
}: SelectablePrintContentProps) {
  if (!content) return null;

  const lines = parseLines(content);
  const selected = selectedItems[sectionKey] || new Set<number>();

  if (printMode) {
    // In print mode, only show selected items
    const selectedLines = lines.filter((_, i) => selected.has(i));
    if (selectedLines.length === 0) return <p className="text-muted-foreground italic text-sm">No items selected</p>;
    return (
      <div className="space-y-1">
        {selectedLines.map((line, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="text-foreground text-sm leading-relaxed">{line.original}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {lines.map((line, index) => {
        const isChecked = selected.has(index);
        return (
          <label
            key={index}
            className={cn(
              "flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors",
              isChecked ? "bg-primary/5 border border-primary/20" : "hover:bg-accent/30"
            )}
          >
            <Checkbox
              checked={isChecked}
              onCheckedChange={(checked) => onSelectionChange(sectionKey, index, !!checked)}
              className="mt-0.5 flex-shrink-0"
            />
            <span className={cn("text-sm leading-relaxed", isChecked ? "text-foreground font-medium" : "text-muted-foreground")}>
              {line.text}
              {isChecked && (
                <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold uppercase">
                  Doctor Approved
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}
