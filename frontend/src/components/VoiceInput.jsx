import { useState, useRef } from 'react';
import { Mic, MicOff, Upload } from 'lucide-react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { transcribeAudio } from '../api/promptmate';

export default function VoiceInput({ onTranscript }) {
  const {
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    isSupported,
  } = useSpeechRecognition();

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleToggle = () => {
    if (isListening) {
      stopListening();
      if (transcript.trim()) {
        onTranscript(transcript.trim());
      }
    } else {
      startListening();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await transcribeAudio(file);
      onTranscript(result.text);
    } catch (err) {
      console.error('Transcription failed:', err);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="voice-input">
      <button
        className={`voice-input__mic-btn ${isListening ? 'voice-input__mic-btn--active' : ''}`}
        onClick={handleToggle}
        title={
          !isSupported
            ? 'Speech recognition not supported in this browser'
            : isListening
            ? 'Stop recording'
            : 'Start voice input'
        }
        disabled={!isSupported && !isListening}
        type="button"
      >
        {isListening ? <MicOff size={20} /> : <Mic size={20} />}
      </button>

      {isListening && (
        <div className="voice-input__status">
          <span className="voice-input__pulse" />
          <span className="voice-input__label">Listening...</span>
        </div>
      )}

      {interimTranscript && (
        <div className="voice-input__interim">{interimTranscript}</div>
      )}

      {error && <div className="voice-input__error">Error: {error}</div>}

      <input
        ref={fileInputRef}
        type="file"
        accept=".webm,.mp3,.wav,.m4a,.ogg,.flac"
        className="voice-input__file-input"
        onChange={handleFileUpload}
      />
      <button
        className="voice-input__upload-btn"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        type="button"
      >
        <Upload size={14} />
        {isUploading ? 'Transcribing...' : 'Upload Audio'}
      </button>
    </div>
  );
}
