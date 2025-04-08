"use client";

import { useEffect } from 'react';
import 'regenerator-runtime/runtime';

// This component doesn't render anything
// It's just used to load the regenerator-runtime and handle speech recognition polyfills
const SpeechPolyfill: React.FC = () => {
  useEffect(() => {
    // Polyfill for browser compatibility
    if (!window.SpeechRecognition && window.webkitSpeechRecognition) {
      window.SpeechRecognition = window.webkitSpeechRecognition;
    }

    // Check if speech synthesis is supported
    if ('speechSynthesis' in window) {
      console.log('Speech synthesis supported');
    } else {
      console.warn('Speech synthesis not supported');
    }
  }, []);

  return null;
};

export default SpeechPolyfill; 