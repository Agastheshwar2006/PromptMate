import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle, Volume2, RefreshCw } from 'lucide-react';
import { transcribeAudio } from '../api/promptmate';

export default function VoiceInput({ onTranscription, disabled = false }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  const monitorAudioLevel = (stream) => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(avg / 128, 1));
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (_e) {
      // Audio level monitoring failure is non-fatal
    }
  };

  const startRecording = async () => {
    setAudioError(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setAudioError('Audio recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      monitorAudioLevel(stream);

      // Prefer standard webm or wav
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const options = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        await handleAudioProcess(audioBlob);
      };

      recorder.start(1000);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied or failed:', err);
      setAudioError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone access denied. Please check browser permissions.'
          : 'Failed to access microphone. Please verify device settings.'
      );
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsRecording(false);
    setAudioLevel(0);
  };

  const handleAudioProcess = async (audioBlob) => {
    if (audioBlob.size < 500) {
      setAudioError('Recording was too short. Please try speaking again.');
      return;
    }

    setIsTranscribing(true);
    setAudioError(null);

    try {
      const data = await transcribeAudio(audioBlob);
      if (data && data.text && data.text.trim()) {
        if (onTranscription) {
          onTranscription(data.text.trim());
        }
      } else {
        setAudioError('Could not detect clear speech. Please try again.');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      // If server transcription fails (e.g. on static Vercel), fall back to SpeechRecognition API if available
      trySpeechRecognitionFallback();
    } finally {
      setIsTranscribing(false);
    }
  };

  const trySpeechRecognitionFallback = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setAudioError('Server transcription unavailable. Click microphone to use browser speech recognition.');
    } else {
      setAudioError('Audio transcription unavailable in this environment. Please type your prompt.');
    }
  };

  return (
    <div className="pm-voice-container">
      {audioError && (
        <div className="pm-voice-error">
          <AlertCircle size={14} />
          <span>{audioError}</span>
        </div>
      )}

      <div className="pm-voice-controls">
        {!isRecording && !isTranscribing && (
          <button
            type="button"
            className="pm-btn pm-btn-icon pm-mic-btn"
            onClick={startRecording}
            disabled={disabled}
            title="Record speech to transcribe"
          >
            <Mic size={16} />
          </button>
        )}

        {isRecording && (
          <div className="pm-recording-active-box">
            <div
              className="pm-recording-indicator"
              style={{
                transform: `scale(${1 + Math.min(audioLevel * 1.5, 1.2)})`,
              }}
            />
            <span className="pm-recording-timer">
              {Math.floor(recordingSeconds / 60)}:
              {String(recordingSeconds % 60).padStart(2, '0')}
            </span>
            <button
              type="button"
              className="pm-btn pm-btn-sm pm-stop-btn"
              onClick={stopRecording}
              title="Stop recording"
            >
              <Square size={14} />
              <span>Done</span>
            </button>
          </div>
        )}

        {isTranscribing && (
          <div className="pm-transcribing-pill">
            <Loader2 size={14} className="pm-spin" />
            <span>Transcribing audio...</span>
          </div>
        )}
      </div>
    </div>
  );
}
