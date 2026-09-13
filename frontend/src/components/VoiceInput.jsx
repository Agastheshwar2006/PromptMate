import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle, Volume2, RefreshCw, Check, X, Radio } from 'lucide-react';
import { transcribeAudio } from '../api/promptmate';

export default function VoiceInput({ onTranscription, onInterim, disabled = false }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [interimText, setInterimText] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const recognitionRef = useRef(null);
  const accumulatedSpeechRef = useRef('');
  const isStoppingRef = useRef(false);

  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);

  const cleanupResources = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (_e) {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

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
        setAudioLevel(Math.min(avg / 96, 1));
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (_e) {
      // Audio visualization failure is non-fatal
    }
  };

  const startRecording = async () => {
    setAudioError(null);
    setInterimText('');
    accumulatedSpeechRef.current = '';
    audioChunksRef.current = [];
    isStoppingRef.current = false;

    // Check mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setAudioError('Microphone input is not supported in this browser.');
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

      // Determine best audio container
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : MediaRecorder.isTypeSupported('audio/ogg')
        ? 'audio/ogg'
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
        // If stopped normally without speech recognition result, run AI transcription
        if (!isStoppingRef.current) return;

        const speechText = accumulatedSpeechRef.current.trim();
        if (speechText) {
          // Web speech already captured text successfully
          if (onTranscription) {
            onTranscription(speechText);
          }
          setIsTranscribing(false);
          setIsRecording(false);
          setInterimText('');
          return;
        }

        // Fall back to server-side Gemini audio transcription
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        await handleAudioProcess(audioBlob);
      };

      // Set up native Web Speech Recognition for live real-time dictation if available
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event) => {
            let interim = '';
            let final = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                final += transcript;
              } else {
                interim += transcript;
              }
            }

            if (final) {
              accumulatedSpeechRef.current = accumulatedSpeechRef.current
                ? `${accumulatedSpeechRef.current} ${final.trim()}`
                : final.trim();
            }

            const currentLive = `${accumulatedSpeechRef.current} ${interim}`.trim();
            setInterimText(currentLive);
            if (onInterim) {
              onInterim(currentLive);
            }
          };

          recognition.onerror = (event) => {
            console.warn('SpeechRecognition notice:', event.error);
            // Non-fatal: if speech recognition fails (e.g. network), MediaRecorder still captures audio for Gemini
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch (_speechErr) {
          console.warn('Web Speech API initialization deferred to MediaRecorder');
        }
      }

      recorder.start(500);
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
      console.error('Microphone access denied or error:', err);
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      setAudioError(
        isDenied
          ? 'Microphone blocked. Please grant microphone permission in your browser address bar.'
          : 'Could not connect to microphone. Please check your audio device settings.'
      );
    }
  };

  const stopRecording = () => {
    isStoppingRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_e) {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setIsTranscribing(true);
      mediaRecorderRef.current.stop();
    } else {
      const speechText = accumulatedSpeechRef.current.trim();
      if (speechText && onTranscription) {
        onTranscription(speechText);
      }
      setIsRecording(false);
      setInterimText('');
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setAudioLevel(0);
  };

  const cancelRecording = () => {
    isStoppingRef.current = false;
    cleanupResources();
    setIsRecording(false);
    setIsTranscribing(false);
    setInterimText('');
    setAudioLevel(0);
    setAudioError(null);
  };

  const handleAudioProcess = async (audioBlob) => {
    // If Web Speech already produced text, do not wait for server
    const speechText = accumulatedSpeechRef.current.trim();
    if (speechText) {
      if (onTranscription) {
        onTranscription(speechText);
      }
      setIsTranscribing(false);
      setIsRecording(false);
      setInterimText('');
      return;
    }

    if (!audioBlob || audioBlob.size < 100) {
      setAudioError('No voice detected. Please speak closer to the microphone and try again.');
      setIsTranscribing(false);
      setIsRecording(false);
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
        setAudioError('Could not detect clear speech. Please try speaking again.');
      }
    } catch (err) {
      console.error('Audio transcription error:', err);
      const msg =
        err.response?.data?.detail ||
        err.message ||
        'Transcription service temporary issue. Please type your prompt.';
      setAudioError(typeof msg === 'string' ? msg : 'Transcription failed. Please try again.');
    } finally {
      setIsTranscribing(false);
      setIsRecording(false);
      setInterimText('');
    }
  };

  return (
    <div className="pm-voice-container">
      {audioError && (
        <div className="pm-voice-error-banner">
          <AlertCircle size={14} className="pm-voice-error-icon" />
          <span className="pm-voice-error-text">{audioError}</span>
          <button
            type="button"
            className="pm-voice-error-dismiss"
            onClick={() => setAudioError(null)}
            title="Dismiss error"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="pm-voice-controls">
        {!isRecording && !isTranscribing && (
          <button
            type="button"
            className="pm-btn pm-btn-icon pm-mic-btn"
            onClick={startRecording}
            disabled={disabled}
            title="Speak prompt with speech-to-text"
          >
            <Mic size={16} />
          </button>
        )}

        {isRecording && (
          <div className="pm-recording-active-box">
            <div className="pm-voice-wave-bars">
              <span
                className="pm-wave-bar"
                style={{ height: `${Math.max(6, audioLevel * 20)}px` }}
              />
              <span
                className="pm-wave-bar"
                style={{ height: `${Math.max(8, audioLevel * 26)}px` }}
              />
              <span
                className="pm-wave-bar"
                style={{ height: `${Math.max(6, audioLevel * 18)}px` }}
              />
            </div>

            <span className="pm-recording-timer">
              {Math.floor(recordingSeconds / 60)}:
              {String(recordingSeconds % 60).padStart(2, '0')}
            </span>

            {interimText && (
              <span className="pm-voice-live-text" title={interimText}>
                &ldquo;{interimText.slice(-35)}&rdquo;
              </span>
            )}

            <div className="pm-voice-recording-actions">
              <button
                type="button"
                className="pm-btn pm-btn-sm pm-voice-done-btn"
                onClick={stopRecording}
                title="Done speaking (Insert text)"
              >
                <Check size={14} />
                <span>Done</span>
              </button>
              <button
                type="button"
                className="pm-btn pm-btn-sm pm-voice-cancel-btn"
                onClick={cancelRecording}
                title="Cancel recording"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {isTranscribing && (
          <div className="pm-transcribing-pill">
            <Loader2 size={14} className="pm-spin" />
            <span>Transcribing speech...</span>
          </div>
        )}
      </div>
    </div>
  );
}
