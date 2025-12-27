'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Voice input states
 */
export type VoiceInputState = 'idle' | 'listening' | 'processing' | 'error';

/**
 * Voice input error types
 */
export type VoiceInputError =
  | 'not-supported'
  | 'permission-denied'
  | 'no-speech'
  | 'audio-capture'
  | 'network'
  | 'aborted'
  | 'unknown';

/**
 * Voice input result
 */
export interface VoiceInputResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

/**
 * Voice input hook options
 */
export interface UseVoiceInputOptions {
  /** Language for speech recognition (default: 'en-US') */
  language?: string;
  /** Enable continuous listening mode */
  continuous?: boolean;
  /** Enable interim results */
  interimResults?: boolean;
  /** Callback when final result is ready */
  onResult?: (result: VoiceInputResult) => void;
  /** Callback when interim result is available */
  onInterimResult?: (result: VoiceInputResult) => void;
  /** Callback when an error occurs */
  onError?: (error: VoiceInputError) => void;
  /** Callback when listening starts */
  onStart?: () => void;
  /** Callback when listening ends */
  onEnd?: () => void;
}

/**
 * Check if the Web Speech API is supported
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(
    window.SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
  );
}

/**
 * Get the SpeechRecognition constructor
 */
function getSpeechRecognition(): typeof SpeechRecognition | null {
  if (typeof window === 'undefined') return null;
  return (
    window.SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition ||
    null
  );
}

/**
 * Hook for voice input using the Web Speech API
 */
export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const {
    language = 'en-US',
    continuous = false,
    interimResults = true,
    onResult,
    onInterimResult,
    onError,
    onStart,
    onEnd,
  } = options;

  const [state, setState] = useState<VoiceInputState>('idle');
  const [error, setError] = useState<VoiceInputError | null>(null);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);

  // Check for browser support
  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) {
      setError('not-supported');
      return null;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setState('listening');
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      onStart?.();
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        const confidence = result[0].confidence;

        if (result.isFinal) {
          finalTranscript += text;
          setTranscript(prev => prev + text);
          onResult?.({
            transcript: text,
            confidence,
            isFinal: true,
          });
        } else {
          interimText += text;
          onInterimResult?.({
            transcript: text,
            confidence,
            isFinal: false,
          });
        }
      }

      setInterimTranscript(interimText);
    };

    recognition.onerror = (event) => {
      let errorType: VoiceInputError = 'unknown';
      switch (event.error) {
        case 'not-allowed':
          errorType = 'permission-denied';
          break;
        case 'no-speech':
          errorType = 'no-speech';
          break;
        case 'audio-capture':
          errorType = 'audio-capture';
          break;
        case 'network':
          errorType = 'network';
          break;
        case 'aborted':
          errorType = 'aborted';
          break;
        default:
          errorType = 'unknown';
      }
      setError(errorType);
      setState('error');
      onError?.(errorType);
    };

    recognition.onend = () => {
      isListeningRef.current = false;
      if (state !== 'error') {
        setState('idle');
      }
      setInterimTranscript('');
      onEnd?.();
    };

    return recognition;
  }, [language, continuous, interimResults, onResult, onInterimResult, onError, onStart, onEnd, state]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('not-supported');
      onError?.('not-supported');
      return false;
    }

    if (isListeningRef.current) {
      return true; // Already listening
    }

    try {
      // Clean up any existing recognition
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = initRecognition();
      if (!recognition) {
        return false;
      }

      recognitionRef.current = recognition;
      recognition.start();
      return true;
    } catch (err) {
      console.error('Failed to start voice recognition:', err);
      setError('unknown');
      setState('error');
      onError?.('unknown');
      return false;
    }
  }, [isSupported, initRecognition, onError]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore errors when stopping
      }
    }
    isListeningRef.current = false;
    setInterimTranscript('');
  }, []);

  // Abort listening (cancel without processing)
  const abortListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore errors when aborting
      }
    }
    isListeningRef.current = false;
    setState('idle');
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Reset state
  const reset = useCallback(() => {
    abortListening();
    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setState('idle');
  }, [abortListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore errors during cleanup
        }
      }
    };
  }, []);

  return {
    // State
    state,
    isListening: state === 'listening',
    isSupported,
    error,
    transcript,
    interimTranscript,
    // The full text (final + interim)
    fullTranscript: transcript + (interimTranscript ? ` ${interimTranscript}` : ''),

    // Actions
    startListening,
    stopListening,
    abortListening,
    reset,
  };
}

export default useVoiceInput;
