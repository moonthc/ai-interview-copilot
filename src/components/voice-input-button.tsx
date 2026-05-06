"use client";

import { useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { toast } from "sonner";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export function VoiceInputButton({
  onTranscript,
  disabled,
}: VoiceInputButtonProps) {
  const handleFinalResult = useCallback(
    (text: string) => {
      onTranscript(text);
    },
    [onTranscript]
  );

  const {
    isListening,
    interimTranscript,
    startListening,
    stopListening,
    isSupported,
    error,
  } = useSpeechRecognition(handleFinalResult);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={isListening ? "destructive" : "outline"}
        size="sm"
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        className={`gap-1.5 ${isListening ? "animate-pulse" : ""}`}
      >
        {isListening ? (
          <>
            <MicOff className="h-4 w-4" />
            停止录音
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            语音输入
          </>
        )}
      </Button>
      {isListening && interimTranscript && (
        <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px]">
          {interimTranscript}
        </span>
      )}
    </div>
  );
}
