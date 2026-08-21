'use client';

import React, { useState } from 'react';
import { ChatMessage } from './types';

interface AiCoachPanelProps {
  userName?: string;
  onAskQuestion?: (question: string) => Promise<string> | string;
}

export function AiCoachPanel({ userName = 'Methika', onAskQuestion }: AiCoachPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const quickPrompts = [
    'What should I complete today?',
    'Explain Data Structures to me',
    'How do I maintain my 12-day streak?',
  ];

  const handlePromptClick = async (prompt: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);

    try {
      let replyText = '';
      if (onAskQuestion) {
        replyText = await onAskQuestion(prompt);
      } else {
        // Deterministic intelligent coach responses
        if (prompt.includes('complete today')) {
          replyText =
            "Today's high-priority item is the 'Data Structures Assignment' (+150 XP) due at 11:59 PM. Completing it will push you to Level 6!";
        } else if (prompt.includes('Data Structures')) {
          replyText =
            'Data structures are specialized formats for organizing and storing data. For your assignment, focus on Arrays, Linked Lists, and Tree traversals.';
        } else {
          replyText =
            'Great question! Check in daily and complete at least one lesson each day to protect your 12-day streak and earn bonus XP.';
        }
      }

      setTimeout(() => {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setIsThinking(false);
      }, 500);
    } catch {
      setIsThinking(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim()) return;
    const q = inputQuestion.trim();
    setInputQuestion('');
    handlePromptClick(q);
  };

  return (
    <div className="fixed bottom-24 md:bottom-8 right-4 md:right-8 z-50 group">
      {/* Floating Action Button */}
      <button
        type="button"
        aria-label="Toggle AI Coach"
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-secondary rounded-full shadow-lg flex items-center justify-center hover:bg-secondary-container hover:shadow-xl hover:scale-105 active:scale-95 transition-all border-2 border-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 focus:ring-offset-background cursor-pointer"
      >
        <span className="material-symbols-outlined text-xp-gold text-3xl group-hover:animate-pulse">
          smart_toy
        </span>
      </button>

      {/* Popover Chat Panel */}
      {isOpen && (
        <div
          className="absolute bottom-16 right-0 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xl p-4 flex flex-col gap-3 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-200"
          style={{ maxHeight: '480px' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-outline-variant/50 pb-2">
            <span className="material-symbols-outlined text-secondary">smart_toy</span>
            <span className="text-sm font-bold text-on-background">AI Coach</span>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setIsOpen(false)}
              className="ml-auto text-on-surface-variant hover:text-on-background focus:outline-none rounded-full p-1 hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          {/* Intro Message */}
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Hi {userName}! You&apos;re 1 task away from your goal today.
          </p>

          {/* Conversation History */}
          {messages.length > 0 && (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-2 rounded-lg ${
                    m.sender === 'user'
                      ? 'bg-secondary/10 text-on-background self-end text-right border border-secondary/20 max-w-[85%]'
                      : 'bg-surface-container-low text-on-background self-start text-left border border-outline-variant/30 max-w-[85%]'
                  }`}
                >
                  <p className="leading-snug">{m.text}</p>
                  <span className="text-[9px] text-on-surface-variant/70 mt-1 block">
                    {m.timestamp}
                  </span>
                </div>
              ))}

              {isThinking && (
                <div className="bg-surface-container-low p-2 rounded-lg text-on-surface-variant text-left self-start text-xs flex items-center gap-1">
                  <span className="animate-pulse">AI Coach is thinking...</span>
                </div>
              )}
            </div>
          )}

          {/* Suggested Quick Prompts */}
          <div className="flex flex-col gap-2 mt-1">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handlePromptClick(prompt)}
                className="text-left text-xs bg-surface-container-low border border-outline-variant/50 px-3 py-2 rounded-lg hover:bg-surface-container hover:border-secondary/50 focus:outline-none focus:ring-2 focus:ring-secondary/50 text-secondary transition-all active:scale-[0.98] font-medium"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Custom Question Input */}
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-1.5 mt-1 pt-2 border-t border-outline-variant/30">
            <input
              type="text"
              placeholder="Ask coach anything..."
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              className="flex-1 bg-surface-container-low text-xs text-on-background px-2.5 py-1.5 rounded-lg border border-outline-variant/50 outline-none focus:ring-1 focus:ring-secondary"
            />
            <button
              type="submit"
              disabled={!inputQuestion.trim()}
              className="bg-secondary text-white rounded-lg p-1.5 disabled:opacity-40 hover:bg-secondary-container transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
