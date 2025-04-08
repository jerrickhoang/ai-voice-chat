"use client";

import React, { useEffect } from 'react';

// Define proper types for the VITS module
interface VITSModule {
  voices: () => Promise<string[]>;
  stored: () => Promise<string[]>;
  predict: (params: { text: string; voiceId: VoiceId }) => Promise<Blob>;
  download: (voiceId: VoiceId, progressCallback: (progress: { loaded: number; total: number }) => void) => Promise<void>;
}

// Define the valid voice IDs
type VoiceId = string;

// Extend Window interface for TypeScript
interface ExtendedWindow extends Window {
  testVITS?: () => Promise<boolean>;
  testVITSSynthesis?: (text: string, voiceId?: VoiceId) => Promise<boolean>;
  testVITSDownload?: (voiceId: VoiceId) => Promise<boolean>;
}

// This component doesn't render anything visible
// It's solely for testing VITS in the browser console
const VITSTester: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Create a global test function for VITS in the browser console
    console.log('VITS Tester: Adding global test function. Use window.testVITS() in console to test VITS.');
    
    const win = window as unknown as ExtendedWindow;
    
    win.testVITS = async () => {
      console.log('VITS Tester: Starting VITS test...');
      
      try {
        console.log('VITS Tester: Importing VITS module');
        const vitsModule = await import('@diffusionstudio/vits-web') as unknown as VITSModule;
        
        console.log('VITS Tester: VITS module imported successfully');
        console.log('VITS Tester: Available methods:', Object.keys(vitsModule).join(', '));
        
        // Test voices method
        if (typeof vitsModule.voices === 'function') {
          try {
            console.log('VITS Tester: Getting available voices');
            const voices = await vitsModule.voices();
            console.log('VITS Tester: Available voices:', voices);
          } catch (voicesError) {
            console.error('VITS Tester: Error getting voices:', voicesError);
          }
        }
        
        // Test stored method
        if (typeof vitsModule.stored === 'function') {
          try {
            console.log('VITS Tester: Checking stored models');
            const stored = await vitsModule.stored();
            console.log('VITS Tester: Stored models:', stored);
          } catch (storedError) {
            console.error('VITS Tester: Error checking stored models:', storedError);
          }
        }
        
        // Add instructions for manual testing
        console.log('VITS Tester: Test completed. To test synthesis:');
        console.log('  1. await window.testVITSSynthesis("Hello world")');
        console.log('  2. await window.testVITSDownload("en_US-hfc_female-medium")');
        
        // Add synthesis test function
        win.testVITSSynthesis = async (text: string, voiceId?: VoiceId) => {
          try {
            console.log(`VITS Tester: Testing synthesis with text "${text}" and voice ${voiceId || 'default'}`);
            const result = await vitsModule.predict({ 
              text, 
              voiceId: voiceId || 'en_US-hfc_female-medium' 
            });
            console.log('VITS Tester: Synthesis result:', result);
            
            // Play the audio
            if (result instanceof Blob) {
              const audio = new Audio(URL.createObjectURL(result));
              console.log('VITS Tester: Playing synthesized audio');
              await audio.play();
              console.log('VITS Tester: Audio playback started');
              return true;
            } else {
              console.error('VITS Tester: Synthesis did not return a blob');
              return false;
            }
          } catch (synthError) {
            console.error('VITS Tester: Synthesis error:', synthError);
            return false;
          }
        };
        
        // Add download test function
        win.testVITSDownload = async (voiceId: VoiceId) => {
          try {
            console.log(`VITS Tester: Testing download for voice ${voiceId}`);
            await vitsModule.download(voiceId, (progress) => {
              const percentage = Math.round(progress.loaded * 100 / progress.total);
              console.log(`VITS Tester: Download progress: ${percentage}%`);
            });
            console.log('VITS Tester: Download completed');
            return true;
          } catch (downloadError) {
            console.error('VITS Tester: Download error:', downloadError);
            return false;
          }
        };
        
        return true;
      } catch (error) {
        console.error('VITS Tester: Error initializing VITS:', error);
        return false;
      }
    };
    
    // Clean up
    return () => {
      if (win.testVITS) win.testVITS = undefined;
      if (win.testVITSSynthesis) win.testVITSSynthesis = undefined;
      if (win.testVITSDownload) win.testVITSDownload = undefined;
    };
  }, []);

  // AUTO-INITIALIZATION: Second useEffect to automatically run the VITS initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Add a small delay to ensure the component is fully mounted
    const timeoutId = setTimeout(async () => {
      console.log('VITS Tester: Auto-initializing VITS...');
      
      const win = window as unknown as ExtendedWindow;
      
      // Only run if the function exists
      if (win.testVITS) {
        try {
          // First initialize VITS
          const initResult = await win.testVITS();
          console.log('VITS Tester: Auto-initialization result:', initResult);
          
          // If initialization was successful, run a silent synthesis to warm up the system
          if (initResult && win.testVITSSynthesis) {
            // Small delay to ensure everything is ready
            setTimeout(async () => {
              try {
                console.log('VITS Tester: Auto-running first synthesis for warm-up...');
                // Create a silent audio context to enable audio on first user interaction
                type AudioContextType = typeof AudioContext;
                const AudioCtx = (window.AudioContext || 
                  ((window as unknown as { webkitAudioContext?: AudioContextType }).webkitAudioContext)) as AudioContextType;
                const audioContext = new AudioCtx();
                await audioContext.resume();
                
                // Run the synthesis with a short text
                await win.testVITSSynthesis?.('Hello world');
                console.log('VITS Tester: Auto-synthesis completed');
                
                // Dispatch a custom event that the VITS system is ready
                window.dispatchEvent(new CustomEvent('vits-ready'));
              } catch (error) {
                console.error('VITS Tester: Error in auto-synthesis:', error);
              }
            }, 1000);
          }
        } catch (error) {
          console.error('VITS Tester: Error in auto-initialization:', error);
        }
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  // This component doesn't render anything visible
  return null;
};

export default VITSTester; 