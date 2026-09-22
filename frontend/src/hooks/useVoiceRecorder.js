import { useCallback, useEffect, useRef, useState } from 'react';

/** Records microphone audio with MediaRecorder and returns the clip as a File. */
const useVoiceRecorder = () => {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current);
    recorderRef.current?.stream?.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    setRecording(false);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Recording is not supported here');

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (event) => event.data.size && chunksRef.current.push(event.data);
    recorder.start();

    recorderRef.current = recorder;
    setRecording(true);
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((value) => value + 1), 1000);
  }, []);

  /** Resolves with the recorded File, or null when the take was discarded. */
  const stop = useCallback(
    (discard = false) =>
      new Promise((resolve) => {
        const recorder = recorderRef.current;
        if (!recorder) return resolve(null);

        recorder.onstop = () => {
          const duration = seconds;
          cleanup();
          if (discard || !chunksRef.current.length) return resolve(null);
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
          return resolve({ file, duration });
        };
        return recorder.stop();
      }),
    [cleanup, seconds]
  );

  return { recording, seconds, start, stop };
};

export default useVoiceRecorder;
