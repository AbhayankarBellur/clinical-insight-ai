import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Activity, FlaskConical, Pill, ClipboardList, FileText } from "lucide-react";

interface ResultCardProps {
  title: string;
  content: string;
  variant: "diagnosis" | "tests" | "medication" | "procedures" | "raw";
}

const variantConfig = {
  diagnosis: {
    icon: Activity,
    emptyText: "Primary diagnosis not provided by AI",
  },
  tests: {
    icon: FlaskConical,
    emptyText: "Investigative tests not provided by AI",
  },
  medication: {
    icon: Pill,
    emptyText: "Medication plan not provided by AI",
  },
  procedures: {
    icon: ClipboardList,
    emptyText: "Further procedures not provided by AI",
  },
  raw: {
    icon: FileText,
    emptyText: "No response received",
  },
};

export function ResultCard({ title, content, variant }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleCopy = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatContent = (text: string) => {
    if (!text) return null;

    // Split by numbered items or bullet points
    const lines = text.split(/\n/).filter(Boolean);
    
    return lines.map((line, index) => (
      <p key={index} className="mb-2 last:mb-0">
        {line}
      </p>
    ));
  };

  return (
    <div className="result-card">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          disabled={!content}
          className="text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>

      <div className="text-foreground leading-relaxed">
        {content ? (
          <div className="prose prose-sm max-w-none">
            {formatContent(content)}
          </div>
        ) : (
          <p className="text-muted-foreground italic">{config.emptyText}</p>
        )}
      </div>
    </div>
  );
}
