'use client';

import { useState, useCallback, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, Loader2 } from 'lucide-react';
import { useVoiceInput, isSpeechRecognitionSupported, VoiceInputError } from '@/hooks/useVoiceInput';
import { cn } from '@/lib/utils';

interface VoiceInputButtonProps {
  /** Callback when transcript is ready */
  onTranscript: (transcript: string) => void;
  /** Callback when recording state changes */
  onRecordingChange?: (isRecording: boolean) => void;
  /** Current interim transcript for display */
  onInterimTranscript?: (transcript: string) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const ERROR_MESSAGES: Record<VoiceInputError, string> = {
  'not-supported': 'Voice input not supported in this browser',
  'permission-denied': 'Microphone access denied. Please allow microphone access.',
  'no-speech': 'No speech detected. Please try again.',
  'audio-capture': 'Microphone not available. Check your device.',
  'network': 'Network error. Please check your connection.',
  'aborted': 'Voice input cancelled.',
  'unknown': 'Something went wrong. Please try again.',
};

export function VoiceInputButton({
  onTranscript,
  onRecordingChange,
  onInterimTranscript,
  disabled = false,
  className,
}: VoiceInputButtonProps) {
  const [showError, setShowError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  // Check support on mount
  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  const handleResult = useCallback(
    (result: { transcript: string; isFinal: boolean }) => {
      if (result.isFinal && result.transcript.trim()) {
        onTranscript(result.transcript.trim());
      }
    },
    [onTranscript]
  );

  const handleInterimResult = useCallback(
    (result: { transcript: string }) => {
      onInterimTranscript?.(result.transcript);
    },
    [onInterimTranscript]
  );

  const handleError = useCallback((error: VoiceInputError) => {
    setShowError(ERROR_MESSAGES[error]);
    // Auto-hide error after 3 seconds
    setTimeout(() => setShowError(null), 3000);
  }, []);

  const handleStart = useCallback(() => {
    onRecordingChange?.(true);
    setShowError(null);
  }, [onRecordingChange]);

  const handleEnd = useCallback(() => {
    onRecordingChange?.(false);
    onInterimTranscript?.('');
  }, [onRecordingChange, onInterimTranscript]);

  const {
    isListening,
    error,
    startListening,
    stopListening,
    abortListening,
  } = useVoiceInput({
    language: 'en-US',
    continuous: false,
    interimResults: true,
    onResult: handleResult,
    onInterimResult: handleInterimResult,
    onError: handleError,
    onStart: handleStart,
    onEnd: handleEnd,
  });

  const handleClick = useCallback(() => {
    if (!isSupported) {
      handleError('not-supported');
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      const started = startListening();
      if (!started && !error) {
        handleError('unknown');
      }
    }
  }, [isSupported, isListening, stopListening, startListening, error, handleError]);

  const handleCancel = useCallback(() => {
    abortListening();
  }, [abortListening]);

  // Keyboard shortcut: Escape to cancel
  useEffect(() => {
    if (!isListening) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, handleCancel]);

  if (!isSupported) {
    return (
      <button
        type="button"
        data-testid="voice-input-button"
        disabled
        className={cn(
          'relative flex-shrink-0 p-3 rounded-full',
          'bg-gray-100 text-gray-300 cursor-not-allowed',
          className
        )}
        title="Voice input not supported in this browser"
      >
        <MicOff className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Error tooltip */}
      {showError && (
        <div
          data-testid="voice-error-tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 animate-fade-in"
        >
          <div className="bg-danger-500 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{showError}</span>
            </div>
            {/* Arrow */}
            <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-danger-500 rotate-45" />
          </div>
        </div>
      )}

      {/* Main button */}
      <button
        type="button"
        data-testid="voice-input-button"
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'relative flex-shrink-0 p-3 rounded-full transition-all duration-200',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          isListening
            ? 'bg-danger-500 text-white shadow-glow-danger animate-pulse'
            : 'bg-gray-100 text-gray-400 hover:bg-primary-100 hover:text-primary-600',
          'hover:scale-110 active:scale-95',
          className
        )}
        title={isListening ? 'Stop recording (or press Escape)' : 'Start voice input'}
        aria-label={isListening ? 'Stop recording' : 'Start voice input'}
      >
        {/* Recording indicator ring */}
        {isListening && (
          <>
            <span className="absolute inset-0 rounded-full bg-danger-400 animate-ping opacity-50" />
            <span className="absolute inset-0 rounded-full border-2 border-danger-300 animate-pulse" />
          </>
        )}

        <Mic
          className={cn(
            'w-5 h-5 relative z-10 transition-transform',
            isListening && 'animate-bounce-subtle'
          )}
        />
      </button>

      {/* Cancel hint when listening */}
      {isListening && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap">
          <span className="text-xs text-gray-400">
            Press <kbd className="px-1 py-0.5 bg-gray-100 rounded text-gray-500 font-mono text-xs">Esc</kbd> to cancel
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Voice recording status indicator with waveform animation
 */
export function VoiceRecordingIndicator({
  isRecording,
  transcript,
  className,
}: {
  isRecording: boolean;
  transcript?: string;
  className?: string;
}) {
  if (!isRecording && !transcript) return null;

  return (
    <div
      data-testid="voice-recording-indicator"
      className={cn(
        'flex items-center gap-3 px-4 py-2 rounded-xl',
        'bg-danger-50 border-2 border-danger-200',
        'animate-fade-in',
        className
      )}
    >
      {/* Waveform animation */}
      {isRecording && (
        <div className="flex items-center gap-0.5 h-5">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className="w-1 bg-danger-500 rounded-full animate-waveform"
              style={{
                animationDelay: `${i * 0.1}s`,
                height: '100%',
              }}
            />
          ))}
        </div>
      )}

      {/* Transcript or listening indicator */}
      <div className="flex-1 min-w-0">
        {transcript ? (
          <p className="text-sm text-gray-700 truncate">{transcript}</p>
        ) : isRecording ? (
          <p className="text-sm text-danger-600 animate-pulse">Listening...</p>
        ) : null}
      </div>

      {/* Processing indicator */}
      {!isRecording && transcript && (
        <Loader2 className="w-4 h-4 text-danger-500 animate-spin" />
      )}
    </div>
  );
}

export default VoiceInputButton;
