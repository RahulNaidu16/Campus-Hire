import { useEffect, useRef, useState } from "react";

/**
 * Wraps the browser's built-in SpeechSynthesis API so the AI can "ask" the
 * question out loud. No server call, no API key - it's the browser's own
 * voice engine (Chrome/Edge/Safari all support this reasonably well).
 */
export function useSpeechSynthesis() {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const speak = (text) => {
    if (!supported || !text) return;
    window.speechSynthesis.cancel();
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.rate = 0.98;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  };

  const stop = () => {
    if (supported) window.speechSynthesis.cancel();
  };

  return { supported, speak, stop };
}

/**
 * Wraps the browser's built-in SpeechRecognition API so the candidate can
 * answer out loud instead of typing. This is the Web Speech API built into
 * Chrome/Edge - it is NOT a call to our backend or any third-party AI
 * service we control; the browser vendor handles the audio-to-text itself,
 * and only the resulting text ever reaches this app. Not supported in
 * Firefox/Safari, so callers should always offer typing as a fallback.
 */
export function useSpeechRecognition({ onTranscriptChange } = {}) {
  const RecognitionCtor =
    typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supported = !!RecognitionCtor;

  const recognitionRef = useRef(null);
  const baseTextRef = useRef("");
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");

  const start = (existingText = "") => {
    if (!supported) return;
    setError("");
    baseTextRef.current = existingText ? existingText.trim() + " " : "";

    const recognition = new RecognitionCtor();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript + " ";
        else interimText += transcript;
      }
      if (finalText) baseTextRef.current += finalText;
      onTranscriptChange && onTranscriptChange(baseTextRef.current + interimText);
    };

    recognition.onerror = (event) => {
      setError(
        event.error === "not-allowed"
          ? "Microphone access was denied. Please allow microphone access and try again."
          : "Speech recognition had an error - you can keep typing instead."
      );
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };

  const stop = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setListening(false);
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  return { supported, listening, error, start, stop };
}
