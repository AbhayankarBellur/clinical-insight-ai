import { useState, useRef, useCallback } from "react";

type SpeechState = "idle" | "requesting_permission" | "listening" | "error";

interface UseSpeechRecognitionReturn {
  state: SpeechState;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  error: string | null;
}

export function useSpeechRecognition(
  onTranscript: (text: string) => void
): UseSpeechRecognitionReturn {
  const [state, setState] = useState<SpeechState>("idle");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const SpeechRecognitionAPI =
    typeof window !== "undefined"
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognitionAPI;

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setState("idle");
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setError("Speech recognition not supported in this browser. Use Chrome or Edge.");
      setState("error");
      return;
    }

    setState("requesting_permission");
    setError(null);

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;

    const resetSilenceTimer = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        stop();
      }, 8000); // Auto-stop after 8s silence
    };

    recognition.onstart = () => {
      setState("listening");
      resetSilenceTimer();
    };

    recognition.onresult = (event: any) => {
      resetSilenceTimer();
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
          onTranscript(finalTranscript.trim());
        } else {
          interim += transcript;
        }
      }
      // Show interim results too
      if (interim) {
        onTranscript((finalTranscript + interim).trim());
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone permissions.");
      } else if (event.error === "no-speech") {
        // Auto-stop on no speech
        stop();
        return;
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setState("error");
    };

    recognition.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      setState("idle");
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [SpeechRecognitionAPI, onTranscript, stop]);

  return { state, isSupported, start, stop, error };
}
