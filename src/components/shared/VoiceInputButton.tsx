import { Mic, MicOff, Square, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export function VoiceInputButton({ onTranscript, className }: VoiceInputButtonProps) {
  const { state, isSupported, start, stop, error } = useSpeechRecognition(onTranscript);

  if (!isSupported) return null;

  const isListening = state === "listening";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={isListening ? stop : start}
          className={cn(
            "h-8 w-8 rounded-lg transition-all shrink-0",
            isListening
              ? "bg-destructive/10 text-destructive hover:bg-destructive/20 animate-pulse"
              : "text-muted-foreground hover:text-primary hover:bg-primary/10",
            className
          )}
        >
          {state === "error" ? (
            <AlertCircle className="w-4 h-4" />
          ) : isListening ? (
            <Square className="w-3.5 h-3.5" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[200px]">
        {error ? (
          <p className="text-xs">{error}</p>
        ) : isListening ? (
          <p className="text-xs">Listening… Click to stop</p>
        ) : (
          <p className="text-xs">Dictate • Audio not stored</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
