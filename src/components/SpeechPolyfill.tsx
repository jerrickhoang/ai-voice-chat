"use client";

import { useEffect } from 'react';
import 'regenerator-runtime/runtime';

// This component doesn't render anything
// It's used to load the regenerator-runtime and handle speech recognition polyfills
const SpeechPolyfill: React.FC = () => {
  useEffect(() => {
    // Only run this code on the client side
    if (typeof window !== 'undefined') {
      // Polyfill for browser compatibility
      if (!window.SpeechRecognition && window.webkitSpeechRecognition) {
        window.SpeechRecognition = window.webkitSpeechRecognition;
      }

      // Check if speech synthesis is supported
      if ('speechSynthesis' in window) {
        console.log('Speech synthesis supported');

        // Initialize voices for the Web Speech API
        const initVoices = () => {
          // This call helps ensure voices are loaded
          window.speechSynthesis.getVoices();
        };

        // Some browsers need to wait for the voiceschanged event before voices are available
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = initVoices;
        }

        // Initialize immediately as well
        initVoices();
      } else {
        console.warn('Speech synthesis not supported');
      }
    }
  }, []);

  return null;
};

export default SpeechPolyfill; 