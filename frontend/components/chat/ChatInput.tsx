'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, ChefHat, ShoppingBag, Trash2, X, Check, AlertCircle } from 'lucide-react';
import { useProcessMessage, useLLMStatus } from '@/hooks/mutations/useLLMChat';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';
import { VoiceInputButton, VoiceRecordingIndicator } from './VoiceInputButton';

interface ChatInputProps {
  className?: string;
  onSuccess?: () => void;
}

interface ResponseBubble {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'recipe';
  action?: string;
  itemCount?: number;
  recipes?: Array<{ id: string | number; title: string }>;
}

const SUGGESTIONS = [
  { text: 'I bought milk and eggs', icon: ShoppingBag, color: 'primary' },
  { text: 'Used the chicken for dinner', icon: ChefHat, color: 'fresh' },
  { text: 'The lettuce went bad', icon: Trash2, color: 'accent' },
  { text: 'What can I make for dinner?', icon: ChefHat, color: 'secondary' },
];

export function ChatInput({ className, onSuccess }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [responses, setResponses] = useState<ResponseBubble[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentHouseholdId = useAuthStore((state) => state.currentHouseholdId);
  const { data: llmStatus } = useLLMStatus();
  const processMessage = useProcessMessage();

  const isAvailable = llmStatus?.available ?? false;

  // Show suggestions when focused and empty
  useEffect(() => {
    if (isFocused && message.length === 0) {
      const timer = setTimeout(() => setShowSuggestions(true), 200);
      return () => clearTimeout(timer);
    } else {
      setShowSuggestions(false);
    }
  }, [isFocused, message]);

  // Auto-remove responses after 5 seconds
  useEffect(() => {
    if (responses.length > 0) {
      const timer = setTimeout(() => {
        setResponses(prev => prev.slice(1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [responses]);

  const addResponse = useCallback((response: Omit<ResponseBubble, 'id'>) => {
    const id = Date.now().toString();
    setResponses(prev => [...prev, { ...response, id }]);
  }, []);

  const handleSubmit = useCallback(async (text?: string) => {
    const messageToSend = text || message.trim();
    if (!messageToSend || !currentHouseholdId) return;

    setMessage('');
    setShowSuggestions(false);

    try {
      const result = await processMessage.mutateAsync({
        message: messageToSend,
        householdId: currentHouseholdId,
        executeActions: true,
      });

      const intent = result.intent;
      const responseText = intent.response || 'Got it!';

      if (intent.action === 'unknown') {
        addResponse({
          message: responseText,
          type: 'info',
        });
      } else if (intent.action === 'recipe' && result.recipes) {
        // Handle recipe suggestions
        addResponse({
          message: responseText,
          type: 'recipe',
          action: 'recipe',
          recipes: result.recipes.slice(0, 3).map(r => ({ id: r.id, title: r.title })),
        });
      } else if (result.executed && result.result) {
        const { itemsProcessed, errors } = result.result;
        if (errors && errors.length > 0) {
          addResponse({
            message: responseText,
            type: 'error',
            action: intent.action,
            itemCount: itemsProcessed,
          });
        } else {
          addResponse({
            message: responseText,
            type: 'success',
            action: intent.action,
            itemCount: itemsProcessed,
          });
          onSuccess?.();
        }
      } else {
        addResponse({
          message: responseText,
          type: 'info',
          action: intent.action,
        });
      }
    } catch {
      addResponse({
        message: "Oops! I couldn't understand that. Try again?",
        type: 'error',
      });
    }
  }, [message, currentHouseholdId, processMessage, addResponse, onSuccess]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setMessage(suggestion);
    inputRef.current?.focus();
    // Auto-submit after a brief moment
    setTimeout(() => handleSubmit(suggestion), 100);
  }, [handleSubmit]);

  const dismissResponse = (id: string) => {
    setResponses(prev => prev.filter(r => r.id !== id));
  };

  // Voice input handlers
  const handleVoiceTranscript = useCallback((transcript: string) => {
    setInterimTranscript('');
    // Auto-submit the voice transcript
    handleSubmit(transcript);
  }, [handleSubmit]);

  const handleRecordingChange = useCallback((recording: boolean) => {
    setIsRecording(recording);
    if (!recording) {
      setInterimTranscript('');
    }
  }, []);

  const handleInterimTranscript = useCallback((transcript: string) => {
    setInterimTranscript(transcript);
  }, []);

  if (!isAvailable) {
    return null; // Don't show if LLM is not configured
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4',
        className
      )}
    >
      {/* Response Bubbles */}
      <div className="absolute bottom-full left-0 right-0 mb-3 flex flex-col gap-2 px-2">
        {responses.map((response, index) => (
          <div
            key={response.id}
            className={cn(
              'relative animate-slide-up rounded-2xl px-4 py-3 shadow-playful-lg backdrop-blur-sm',
              'border-2 transition-all duration-300',
              response.type === 'success' && 'bg-primary-50/95 border-primary-200 text-primary-800',
              response.type === 'error' && 'bg-danger-50/95 border-danger-200 text-danger-800',
              response.type === 'info' && 'bg-white/95 border-gray-200 text-gray-800',
              response.type === 'recipe' && 'bg-secondary-50/95 border-secondary-200 text-secondary-800',
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                response.type === 'success' && 'bg-primary-500 text-white',
                response.type === 'error' && 'bg-danger-500 text-white',
                response.type === 'info' && 'bg-gray-400 text-white',
                response.type === 'recipe' && 'bg-secondary-500 text-white',
              )}>
                {response.type === 'success' && <Check className="w-4 h-4" />}
                {response.type === 'error' && <AlertCircle className="w-4 h-4" />}
                {response.type === 'info' && <Sparkles className="w-4 h-4" />}
                {response.type === 'recipe' && <ChefHat className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-relaxed">{response.message}</p>
                {response.itemCount !== undefined && response.itemCount > 0 && (
                  <p className="text-xs mt-1 opacity-70">
                    {response.itemCount} item{response.itemCount !== 1 ? 's' : ''} {response.action === 'add' ? 'added' : response.action === 'consume' ? 'used' : 'updated'}
                  </p>
                )}
                {response.type === 'recipe' && response.recipes && response.recipes.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {response.recipes.map((recipe, i) => (
                      <div
                        key={recipe.id}
                        className="text-xs bg-white/50 rounded-lg px-2 py-1 font-medium"
                      >
                        {i + 1}. {recipe.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => dismissResponse(response.id)}
                className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors"
              >
                <X className="w-4 h-4 opacity-50" />
              </button>
            </div>
            {/* Little tail pointing down */}
            <div className={cn(
              'absolute -bottom-2 left-8 w-4 h-4 rotate-45',
              response.type === 'success' && 'bg-primary-50 border-r-2 border-b-2 border-primary-200',
              response.type === 'error' && 'bg-danger-50 border-r-2 border-b-2 border-danger-200',
              response.type === 'info' && 'bg-white border-r-2 border-b-2 border-gray-200',
              response.type === 'recipe' && 'bg-secondary-50 border-r-2 border-b-2 border-secondary-200',
            )} />
          </div>
        ))}
      </div>

      {/* Voice Recording Indicator */}
      {(isRecording || interimTranscript) && (
        <div className="absolute bottom-full left-0 right-0 mb-3 px-2">
          <VoiceRecordingIndicator
            isRecording={isRecording}
            transcript={interimTranscript}
          />
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && !isRecording && (
        <div className="absolute bottom-full left-0 right-0 mb-3 px-2">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border-2 border-primary-100 shadow-playful-lg p-3 animate-scale-in">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
              Try saying...
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SUGGESTIONS.map((suggestion, index) => {
                const Icon = suggestion.icon;
                return (
                  <button
                    key={suggestion.text}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className={cn(
                      'group flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all duration-200',
                      'hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]',
                      'animate-slide-up',
                      suggestion.color === 'primary' && 'bg-primary-50 hover:bg-primary-100 text-primary-700',
                      suggestion.color === 'fresh' && 'bg-fresh-50 hover:bg-fresh-100 text-fresh-700',
                      suggestion.color === 'accent' && 'bg-accent-50 hover:bg-accent-100 text-accent-700',
                      suggestion.color === 'secondary' && 'bg-secondary-50 hover:bg-secondary-100 text-secondary-700',
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0 group-hover:animate-wiggle" />
                    <span className="text-sm font-medium truncate">{suggestion.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Input Container */}
      <div
        className={cn(
          'relative flex items-center gap-2 p-2 rounded-full transition-all duration-300',
          'bg-white/90 backdrop-blur-md border-2 shadow-playful-lg',
          isFocused
            ? 'border-primary-400 shadow-glow-primary scale-[1.02]'
            : 'border-primary-200 hover:border-primary-300',
          processMessage.isPending && 'opacity-80',
        )}
      >
        {/* Decorative gradient ring when focused */}
        {isFocused && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-400 via-fresh-400 to-primary-400 opacity-20 blur-sm animate-pulse-soft" />
        )}

        {/* Microphone Button */}
        <VoiceInputButton
          onTranscript={handleVoiceTranscript}
          onRecordingChange={handleRecordingChange}
          onInterimTranscript={handleInterimTranscript}
          disabled={processMessage.isPending}
        />

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder="Tell me about your groceries..."
          disabled={processMessage.isPending}
          className={cn(
            'flex-1 bg-transparent border-none outline-none',
            'text-gray-800 placeholder-gray-400 font-medium',
            'text-base py-2 px-1',
          )}
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={!message.trim() || processMessage.isPending}
          className={cn(
            'relative flex-shrink-0 p-3 rounded-full transition-all duration-300',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            message.trim() && !processMessage.isPending
              ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-glow-primary hover:scale-110 active:scale-95'
              : 'bg-gray-100 text-gray-400',
          )}
        >
          {processMessage.isPending ? (
            <div className="w-5 h-5 relative">
              <div className="absolute inset-0 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin" />
            </div>
          ) : (
            <Send
              className={cn(
                'w-5 h-5 transition-transform duration-200',
                message.trim() && 'rotate-0',
                !message.trim() && '-rotate-45 opacity-50'
              )}
            />
          )}
        </button>
      </div>

      {/* Subtle hint text */}
      <p className={cn(
        'text-center text-xs text-gray-400 mt-2 transition-opacity duration-300',
        isFocused ? 'opacity-100' : 'opacity-0'
      )}>
        Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-mono">Enter</kbd> to send
      </p>
    </div>
  );
}

export default ChatInput;
