import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ProbabilityItem {
  condition: string;
  percentage: number;
}

interface FormattedContentProps {
  content: string;
  variant: "diagnosis" | "tests" | "medication" | "procedures" | "raw";
}

const variantColors = {
  diagnosis: {
    bars: [
      "bg-primary",
      "bg-accent-foreground",
      "bg-muted-foreground",
      "bg-muted-foreground/70",
      "bg-muted-foreground/50",
    ],
    tagBg: [
      "bg-primary/10 text-primary border-primary/20",
      "bg-accent text-accent-foreground border-accent-foreground/20",
      "bg-muted text-muted-foreground border-border",
      "bg-muted text-muted-foreground border-border",
      "bg-muted text-muted-foreground border-border",
    ],
  },
  tests: {
    highlight: "border-l-warning",
    tagBg: "bg-warning/10 text-warning border-warning/20",
  },
  medication: {
    highlight: "border-l-success",
    tagBg: "bg-success/10 text-success border-success/20",
  },
  procedures: {
    highlight: "border-l-primary",
    tagBg: "bg-primary/10 text-primary border-primary/20",
  },
};

function parseProbabilities(text: string): ProbabilityItem[] {
  const items: ProbabilityItem[] = [];
  const lines = text.split("\n").filter(Boolean);
  
  for (const line of lines) {
    // Match patterns like "Condition (60%)" or "Condition - 60%" or "1. Condition (60%)"
    const match = line.match(/(?:\d+\.\s*)?(.+?)[\s]*[\(\-–]\s*(\d+(?:\.\d+)?)\s*%\s*\)?/);
    if (match) {
      items.push({
        condition: match[1].replace(/\*\*/g, "").trim(),
        percentage: parseFloat(match[2]),
      });
    }
  }
  
  // Sort by percentage descending
  return items.sort((a, b) => b.percentage - a.percentage);
}

function renderMarkdown(text: string) {
  // Process bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function DiagnosisContent({ content }: { content: string }) {
  const probabilities = parseProbabilities(content);
  
  if (probabilities.length > 0) {
    return (
      <div className="space-y-3">
        {probabilities.map((item, index) => (
          <div
            key={index}
            className={cn(
              "rounded-lg border p-4 transition-all",
              index === 0
                ? "bg-primary/5 border-primary/20"
                : index === 1
                ? "bg-accent border-accent-foreground/10"
                : "bg-muted/50 border-border"
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                    index === 0
                      ? "bg-primary text-primary-foreground"
                      : index === 1
                      ? "bg-accent-foreground/80 text-card"
                      : "bg-muted-foreground/60 text-card"
                  )}
                >
                  {index + 1}
                </span>
                <span className={cn(
                  "font-medium",
                  index === 0 ? "text-foreground" : "text-foreground/80"
                )}>
                  {item.condition}
                </span>
              </div>
              <span
                className={cn(
                  "text-sm font-bold tabular-nums",
                  index === 0 ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.percentage}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  index === 0
                    ? "bg-primary"
                    : index === 1
                    ? "bg-accent-foreground/60"
                    : "bg-muted-foreground/40"
                )}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Fallback to standard rendering
  return <StandardContent content={content} variant="diagnosis" />;
}

function StandardContent({ content, variant }: { content: string; variant: string }) {
  const lines = content.split("\n").filter(Boolean);
  
  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        
        // Numbered list items
        const numberedMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
        if (numberedMatch) {
          const num = parseInt(numberedMatch[1]);
          return (
            <div
              key={index}
              className={cn(
                "flex gap-3 p-3 rounded-lg border transition-all",
                num <= 2
                  ? "bg-card border-border shadow-sm"
                  : "bg-muted/30 border-transparent"
              )}
            >
              <span
                className={cn(
                  "flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold",
                  num <= 2
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {num}
              </span>
              <span className="text-foreground leading-relaxed flex-1">
                {renderMarkdown(numberedMatch[2])}
              </span>
            </div>
          );
        }
        
        // Bullet points
        if (trimmed.startsWith("-") || trimmed.startsWith("•")) {
          return (
            <div key={index} className="flex gap-3 pl-2">
              <span className="text-primary mt-1.5">•</span>
              <span className="text-foreground leading-relaxed">
                {renderMarkdown(trimmed.replace(/^[-•]\s*/, ""))}
              </span>
            </div>
          );
        }
        
        // Regular paragraph
        return (
          <p key={index} className="text-foreground leading-relaxed">
            {renderMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export function FormattedContent({ content, variant }: FormattedContentProps) {
  if (!content) return null;
  
  if (variant === "diagnosis") {
    return <DiagnosisContent content={content} />;
  }
  
  return <StandardContent content={content} variant={variant} />;
}