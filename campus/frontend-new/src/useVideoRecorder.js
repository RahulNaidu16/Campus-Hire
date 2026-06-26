import { useEffect, useRef, useState } from "react";

const CANDIDATE_MIME_TYPES = ["video/webm;codecs=vp9,opus", "video/webm", "video/mp4"];

function pickSupportedMimeType() {
  if (typeof window === "undefined" || !("MediaRecorder" in window)) return "";
  return CANDIDATE_MIME_TYPES.find((t) => window.MediaRecorder.isTypeSupported?.(t)) || "";
}

/**
 * Records the candidate's webcam (video + mic) entirely in the browser using
 * getUserMedia + MediaRecorder. Nothing is uploaded to our backend or any
 * third party - the recording only ever exists as an in-memory blob in the
 * candidate's own browser, for self-review or local download. Not supported
 * in every browser (notably some older Safari versions), so callers should
 * treat this as a nice-to-have, not a requirement.
 */
export function useVideoRecorder() {
  const supported =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window !== "undefined" &&
    "MediaRecorder" in window;

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [cameraOn, setCameraOn] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const [recordedUrl, setRecordedUrl] = useState(null);

  const enableCamera = async () => {
    if (!supported) return;
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOn(true);
    } catch {
      setError("Camera/microphone access was denied or unavailable.");
      setCameraOn(false);
    }
  };

  const disableCamera = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setRecording(false);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setRecordedUrl(null);

    try {
      const mimeType = pickSupportedMimeType();
      const recorder = mimeType
        ? new window.MediaRecorder(streamRef.current, { mimeType })
        : new window.MediaRecorder(streamRef.current);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
        setRecordedUrl(URL.createObjectURL(blob));
      };

      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch {
      setError("Could not start video recording.");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setRecording(false);
  };

  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    supported, videoRef, cameraOn, recording, error, recordedUrl,
    enableCamera, disableCamera, startRecording, stopRecording,
  };
}
