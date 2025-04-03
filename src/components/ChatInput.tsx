"use client";

import React, { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col w-full mt-auto border-t dark:border-gray-800 p-4 bg-background">
      <div className="relative flex items-center">
        <textarea
          className="w-full p-3 pr-16 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
          placeholder="Type your message..."
          rows={1}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          style={{ minHeight: '50px', maxHeight: '150px' }}
        />
        <button
          className="absolute right-3 p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? (
            <div className="h-5 w-5 border-t-2 border-r-2 border-white rounded-full animate-spin" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          )}
        </button>
      </div>
      <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
        Press Enter to send, Shift+Enter for a new line
      </p>
    </div>
  );
};

export default ChatInput; 