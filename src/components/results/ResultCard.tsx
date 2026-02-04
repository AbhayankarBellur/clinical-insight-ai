import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, Activity, FlaskConical, Pill, ClipboardList, FileText, Brain, Edit3, Loader2, Send } from "lucide-react";
import { SectionKey, SectionState } from "@/types/medical";

interface ResultCardProps {
  title: string;
  content: string;
  variant: "diagnosis" | "tests" | "medication" | "procedures" | "raw";
  sectionKey?: SectionKey;
  sectionState?: SectionState;
  onRequestReasoning?: () => void;
  onSubmitEdit?: (instruction: string) => void;
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

export function ResultCard({ 
  title, 
  content, 
  variant, 
  sectionKey,
  sectionState,
  onRequestReasoning,
  onSubmitEdit,
}: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("output");
  const [editInstruction, setEditInstruction] = useState("");
  
  const config = variantConfig[variant];
  const Icon = config.icon;
  const hasInteractiveFeatures = variant !== "raw" && sectionKey && sectionState;

  const handleCopy = async () => {
    const textToCopy = activeTab === "reasoning" && sectionState?.reasoning 
      ? sectionState.reasoning 
      : content;
    if (!textToCopy) return;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReasoningClick = () => {
    if (!sectionState?.reasoning && onRequestReasoning) {
      onRequestReasoning();
    }
  };

  const handleEditSubmit = () => {
    if (editInstruction.trim() && onSubmitEdit) {
      onSubmitEdit(editInstruction.trim());
      setEditInstruction("");
      setActiveTab("output");
    }
  };

  const formatContent = (text: string) => {
    if (!text) return null;
    const lines = text.split(/\n/).filter(Boolean);
    return lines.map((line, index) => (
      <p key={index} className="mb-2 last:mb-0">
        {line}
      </p>
    ));
  };

  // Simple card for raw variant
  if (!hasInteractiveFeatures) {
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
            {copied ? <><Check className="w-4 h-4 mr-1" />Copied</> : <><Copy className="w-4 h-4 mr-1" />Copy</>}
          </Button>
        </div>
        <div className="text-foreground leading-relaxed">
          {content ? (
            <div className="prose prose-sm max-w-none">{formatContent(content)}</div>
          ) : (
            <p className="text-muted-foreground italic">{config.emptyText}</p>
          )}
        </div>
      </div>
    );
  }

  // Interactive card with tabs
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
          disabled={!content && !sectionState?.reasoning}
          className="text-muted-foreground hover:text-foreground no-print"
        >
          {copied ? <><Check className="w-4 h-4 mr-1" />Copied</> : <><Copy className="w-4 h-4 mr-1" />Copy</>}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 no-print">
          <TabsTrigger value="output" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />
            Output
          </TabsTrigger>
          <TabsTrigger 
            value="reasoning" 
            className="text-xs"
            onClick={handleReasoningClick}
          >
            {sectionState?.isLoadingReasoning ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Brain className="w-3 h-3 mr-1" />
            )}
            Reasoning
          </TabsTrigger>
          <TabsTrigger value="edit" className="text-xs">
            {sectionState?.isLoadingEdit ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Edit3 className="w-3 h-3 mr-1" />
            )}
            Edit
          </TabsTrigger>
        </TabsList>

        <TabsContent value="output" className="mt-0">
          <div className="text-foreground leading-relaxed">
            {content ? (
              <div className="prose prose-sm max-w-none">{formatContent(content)}</div>
            ) : (
              <p className="text-muted-foreground italic">{config.emptyText}</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="reasoning" className="mt-0">
          <div className="text-foreground leading-relaxed">
            {sectionState?.isLoadingReasoning ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating reasoning...</span>
              </div>
            ) : sectionState?.reasoning ? (
              <div className="prose prose-sm max-w-none">{formatContent(sectionState.reasoning)}</div>
            ) : (
              <p className="text-muted-foreground italic">
                Click to generate clinical reasoning for this section.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="edit" className="mt-0">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Provide instructions to refine this section. The AI will regenerate only this section based on your guidance.
            </p>
            <Textarea
              value={editInstruction}
              onChange={(e) => setEditInstruction(e.target.value)}
              placeholder="e.g., 'Add more specific dosages', 'Consider alternative medications for elderly patients', 'Include less invasive test options first'..."
              className="clinical-input min-h-[100px]"
              disabled={sectionState?.isLoadingEdit}
            />
            <div className="flex justify-end">
              <Button 
                onClick={handleEditSubmit}
                disabled={!editInstruction.trim() || sectionState?.isLoadingEdit}
                size="sm"
              >
                {sectionState?.isLoadingEdit ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Regenerate Section
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
