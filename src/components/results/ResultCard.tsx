import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Activity, FlaskConical, Pill, ClipboardList, FileText, Brain, ImageIcon } from "lucide-react";
import { SectionState } from "@/types/medical";
import { FormattedContent } from "./FormattedContent";
import { cn } from "@/lib/utils";

interface ResultCardProps {
  title: string;
  content: string;
  variant: "diagnosis" | "tests" | "medication" | "procedures" | "imaging" | "raw";
  sectionState?: SectionState;
}

const variantConfig = {
  diagnosis: {
    icon: Activity,
    emptyText: "Primary diagnosis not provided by AI",
    accentClass: "border-l-primary",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  tests: {
    icon: FlaskConical,
    emptyText: "Investigative tests not provided by AI",
    accentClass: "border-l-warning",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
  },
  medication: {
    icon: Pill,
    emptyText: "Medication plan not provided by AI",
    accentClass: "border-l-success",
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
  procedures: {
    icon: ClipboardList,
    emptyText: "Further procedures not provided by AI",
    accentClass: "border-l-primary",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  imaging: {
    icon: ImageIcon,
    emptyText: "Image analysis not provided by AI",
    accentClass: "border-l-accent-foreground/60",
    iconBg: "bg-accent",
    iconColor: "text-accent-foreground",
  },
  raw: {
    icon: FileText,
    emptyText: "No response received",
    accentClass: "border-l-muted-foreground",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
  },
};

export function ResultCard({ 
  title, 
  content, 
  variant, 
  sectionState,
}: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("output");
  
  const config = variantConfig[variant];
  const Icon = config.icon;
  const hasInteractiveFeatures = variant !== "raw" && sectionState;

  const handleCopy = async () => {
    const textToCopy = activeTab === "reasoning" && sectionState?.reasoning 
      ? sectionState.reasoning 
      : content;
    if (!textToCopy) return;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple card for raw variant
  if (!hasInteractiveFeatures) {
    return (
      <div className={cn("result-card border-l-4", config.accentClass)}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", config.iconBg)}>
              <Icon className={cn("w-5 h-5", config.iconColor)} />
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
            {copied ? <><Check className="w-4 h-4 mr-1" />Copied</> : <><Copy className="w-4 h-4 mr-1" />Copy</>}
          </Button>
        </div>
        <div className="text-foreground leading-relaxed">
          {content ? (
            <FormattedContent content={content} variant={variant} />
          ) : (
            <p className="text-muted-foreground italic">{config.emptyText}</p>
          )}
        </div>
      </div>
    );
  }

  // Interactive card with Output and Reasoning tabs
  return (
    <div className={cn("result-card border-l-4", config.accentClass)}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", config.iconBg)}>
            <Icon className={cn("w-5 h-5", config.iconColor)} />
          </div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          disabled={!content && !sectionState?.reasoning}
          className="text-muted-foreground hover:text-foreground no-print"
        >
          {copied ? <><Check className="w-4 h-4 mr-1" />Copied</> : <><Copy className="w-4 h-4 mr-1" />Copy</>}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4 no-print bg-muted/50">
          <TabsTrigger value="output" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <FileText className="w-3 h-3 mr-1" />
            Output
          </TabsTrigger>
          <TabsTrigger value="reasoning" className="text-xs data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Brain className="w-3 h-3 mr-1" />
            Reasoning
          </TabsTrigger>
        </TabsList>

        <TabsContent value="output" className="mt-0">
          <div className="text-foreground leading-relaxed">
            {content ? (
              <FormattedContent content={content} variant={variant} />
            ) : (
              <p className="text-muted-foreground italic">{config.emptyText}</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reasoning" className="mt-0">
          <div className="text-foreground leading-relaxed">
            {sectionState?.reasoning ? (
              <FormattedContent content={sectionState.reasoning} variant="raw" />
            ) : (
              <p className="text-muted-foreground italic">
                No reasoning provided for this section.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}