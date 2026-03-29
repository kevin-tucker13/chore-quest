/**
 * useVoiceInput.ts — Web Speech API hook
 * ========================================
 * Uses the browser's built-in SpeechRecognition API (free, no API costs).
 * Works in Chrome and Safari on tablets.
 */

import { useState, useRef, useCallback } from "react";

interface UseVoiceInputOptions {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  language?: string;
}

interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  interimTranscript: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any;

function getSpeechRecognition(): AnySpeechRecognition | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useVoiceInput({
  onResult,
  onError,
  language = "en-GB",
}: UseVoiceInputOptions): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<AnySpeechRecognition>(null);

  const SpeechRecognitionAPI = getSpeechRecognition();
  const isSupported = !!SpeechRecognitionAPI;

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const startListening = useCallback(() => {
    const API = getSpeechRecognition();
    if (!API) {
      onError?.("Voice input is not supported in this browser.");
      return;
    }

    // Stop any existing session
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new API();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimTranscript("");
    };

    recognition.onresult = (event: { resultIndex: number; results: { isFinal: boolean; [0]: { transcript: string } }[] }) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);

      if (final) {
        const cleaned = final.trim();
        const capitalised = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
        onResult(capitalised);
        setInterimTranscript("");
      }
    };

    recognition.onerror = (event: { error: string }) => {
      setIsListening(false);
      setInterimTranscript("");
      if (event.error === "not-allowed") {
        onError?.("Microphone permission was denied. Please allow microphone access and try again.");
      } else if (event.error === "no-speech") {
        onError?.("No speech detected — try again!");
      } else {
        onError?.(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language, onResult, onError]);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    interimTranscript,
  };
}
