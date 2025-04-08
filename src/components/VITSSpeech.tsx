"use client";

import React, { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { CircularProgress, Typography, Box, Alert } from '@mui/material';
import dynamic from 'next/dynamic';

// Define a more flexible interface for voice data to accommodate the actual structure
interface VoiceData {
  id?: string;
  name?: string;
  lang?: string;
  [key: string]: unknown;
}

// Define our public methods interface
export interface VITSSpeechMethods {
  synthesize: (text: string, voiceId?: string) => Promise<Blob | null>;
  getVoices: () => VoiceData[];
}

interface VITSSpeechProps {
  onReady: (isReady: boolean) => void;
  onStatusChange: (status: string) => void;
}

// Configure VITS to use our proxy API
// Using unknown type as we don't need to precisely define the full library interface 
const configureVITSProxy = (module: unknown) => {
  if (!module || typeof module !== 'object') return module;

  // Cast to an object with fetch method
  const moduleObj = module as { 
    fetch?: (url: string, options?: RequestInit) => Promise<Response>;
    [key: string]: unknown;
  };
  
  // Store the original fetch method
  const originalFetch = moduleObj.fetch;
  
  // Replace it with our proxy-based fetch
  if (typeof originalFetch === 'function') {
    moduleObj.fetch = async (url: string, options?: RequestInit) => {
      try {
        console.log(`VITS TTS: Intercepting fetch request to: ${url}`);
        
        // Only proxy requests to Hugging Face or other external domains
        if (url.includes('huggingface.co') || url.includes('cdn.jsdelivr.net')) {
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
          console.log(`VITS TTS: Using proxy for: ${url}`);
          
          // Make the request through our proxy
          return await fetch(proxyUrl, options);
        } else {
          // For other URLs, use the original fetch
          return await originalFetch(url, options);
        }
      } catch (error) {
        console.error('VITS TTS: Error in proxied fetch:', error);
        throw error;
      }
    };
  }
  
  return moduleObj;
};

// The actual component implementation - only loaded client-side
const VITSSpeechComponent = forwardRef<VITSSpeechMethods, VITSSpeechProps>(({ onReady, onStatusChange }, ref) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [voices, setVoices] = useState<VoiceData[]>([]);
  const [initializationAttempts, setInitializationAttempts] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  
  // Reference to the VITS library - use unknown type
  const vitsLib = React.useRef<unknown>(null);
  
  // Default voice ID
  const defaultVoiceId = 'en_US-hfc_female-medium';

  // Load the library only on client side
  useEffect(() => {
    let isMounted = true;
    
    // Prevent multiple initialization attempts
    // Increase max attempts to 5 to try harder
    if (isInitializing || isInitialized || error || initializationAttempts >= 5) {
      return;
    }
    
    // Mark as initializing
    setIsInitializing(true);
    
    const loadVitsLibrary = async () => {
      try {
        console.log(`VITS TTS: Loading library (attempt ${initializationAttempts + 1}/5)...`);
        onStatusChange('Loading speech engine...');
        
        // Dynamically import the library
        console.log('VITS TTS: Attempting to import @diffusionstudio/vits-web');
        const vitsModule = await import('@diffusionstudio/vits-web');
        if (!isMounted) return;
        
        console.log('VITS TTS: Library imported successfully, module:', Object.keys(vitsModule).join(', '));
        
        // Configure the module to use our proxy
        const proxiedModule = configureVITSProxy(vitsModule);
        
        // Store the module reference
        vitsLib.current = proxiedModule;
        console.log('VITS TTS: Library configured with proxy successfully');
        
        // Get available voices - cast the module for type safety
        try {
          console.log('VITS TTS: Attempting to get available voices');
          const lib = vitsLib.current as { voices: () => Promise<unknown[]> };
          const voiceList = await lib.voices();
          if (!isMounted) return;
          
          console.log('VITS TTS: Available voices:', voiceList ? 
            (Array.isArray(voiceList) ? `${voiceList.length} voices` : typeof voiceList) : 'null');
          
          // Cast voices to our interface
          setVoices(voiceList as unknown as VoiceData[]);
          
          // Force a simplified default voice list if we had trouble getting voices
          if (!voiceList || !Array.isArray(voiceList) || voiceList.length === 0) {
            console.log('VITS TTS: Using default voice list');
            setVoices([{ id: defaultVoiceId, name: 'English Female', lang: 'en-US' }]);
          }
        } catch (voiceError) {
          console.error('VITS TTS: Error fetching voices:', voiceError);
          // Continue with default voice only
          setVoices([{ id: defaultVoiceId, name: 'English Female', lang: 'en-US' }]);
        }
        
        try {
          // Check if we have already downloaded the model
          console.log('VITS TTS: Checking for stored models');
          const lib2 = vitsLib.current as { stored: () => Promise<string[]> };
          const storedModels = await lib2.stored();
          if (!isMounted) return;
          
          console.log('VITS TTS: Stored models:', storedModels);
          
          if (storedModels && Array.isArray(storedModels) && storedModels.includes(defaultVoiceId)) {
            console.log(`VITS TTS: Model ${defaultVoiceId} already downloaded`);
            setIsInitialized(true);
            setIsInitializing(false);
            onReady(true);
            onStatusChange('Ready to speak');
            return;
          }
          
          // Download the model
          console.log(`VITS TTS: Downloading model ${defaultVoiceId}...`);
          onStatusChange('Downloading voice model...');
          
          // Cast for download method
          const lib3 = vitsLib.current as { 
            download: (voiceId: string, callback?: (progress: { loaded: number, total: number, url: string }) => void) => Promise<void>
          };
          
          console.log('VITS TTS: Starting model download');
          await lib3.download(defaultVoiceId, (progress) => {
            if (!isMounted) return;
            const percentage = Math.round(progress.loaded * 100 / progress.total);
            console.log(`VITS TTS: Download progress: ${percentage}%`);
            setProgress(percentage);
            onStatusChange(`Downloading voice model: ${percentage}%`);
          });
          
          if (!isMounted) return;
          console.log('VITS TTS: Model downloaded successfully');
          setIsInitialized(true);
          setIsInitializing(false);
          onReady(true);
          onStatusChange('Ready to speak');
        } catch (modelError) {
          if (!isMounted) return;
          console.error('VITS TTS: Error with model management:', modelError);
          
          // On any error after 3 attempts, allow limited functionality
          if (initializationAttempts >= 3) {
            console.log('VITS TTS: Maximum attempts reached, allowing partial initialization');
            setError(null); // Clear previous errors
            setIsInitialized(true);
            onReady(true);
            onStatusChange('Ready with limited capability');
          } else {
            const errorMsg = modelError instanceof Error ? modelError.message : 'Unknown error';
            setError(`Model error: ${errorMsg}`);
            onStatusChange('Voice model preparation failed');
          }
          setIsInitializing(false);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('VITS TTS: Error initializing:', err instanceof Error ? err.message : err);
        
        // Even on error, increment the attempt counter
        setInitializationAttempts(prev => prev + 1);
        
        // After 3 attempts, be more permissive about initialization
        if (initializationAttempts >= 3) {
          console.log('VITS TTS: Maximum attempts reached, allowing limited functionality');
          setError(null); // Clear previous errors
          setIsInitialized(true);
          onReady(true);
          onStatusChange('Ready with limited capability');
        } else {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          setError(`Initialization error: ${errorMsg}`);
          onStatusChange('Speech engine initialization failed');
        }
        setIsInitializing(false);
      }
    };
    
    // Set a timeout to prevent immediately reloading after errors
    const timeoutId = setTimeout(() => {
      loadVitsLibrary();
      // Increment initialization attempts
      setInitializationAttempts(prev => prev + 1);
    }, 1000);
    
    return () => {
      clearTimeout(timeoutId);
      isMounted = false;
    };
  }, [onReady, onStatusChange, isInitialized, isInitializing, error, initializationAttempts]);
  
  // Create the synthesize function
  const synthesize = useCallback(async (text: string, voiceId: string = defaultVoiceId): Promise<Blob | null> => {
    if (!vitsLib.current || !isInitialized) {
      console.error('VITS TTS: Library not initialized');
      return null;
    }
    
    try {
      console.log(`VITS TTS: Synthesizing text with voice ${voiceId}`);
      onStatusChange('Generating speech...');
      
      // Cast for predict method
      const lib = vitsLib.current as { 
        predict: (options: {text: string, voiceId: string}) => Promise<Blob> 
      };
      
      const wav = await lib.predict({
        text,
        voiceId,
      });
      
      console.log('VITS TTS: Speech synthesis completed');
      onStatusChange('Speech generated');
      return wav;
    } catch (err) {
      console.error('VITS TTS: Error synthesizing speech', err);
      onStatusChange('Speech generation failed');
      return null;
    }
  }, [isInitialized, onStatusChange]);
  
  // Expose the public methods
  useImperativeHandle(ref, () => ({
    synthesize,
    getVoices: () => voices
  }), [synthesize, voices]);
  
  // Render loading or error state
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }
  
  if (!isInitialized) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
        <CircularProgress value={progress} variant={progress > 0 ? 'determinate' : 'indeterminate'} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {progress > 0 ? `Loading voice model: ${progress}%` : 'Initializing speech engine...'}
        </Typography>
      </Box>
    );
  }
  
  // When initialized and no errors, render nothing
  return null;
});

VITSSpeechComponent.displayName = 'VITSSpeech';

// Only load this component on the client side
export default dynamic(() => Promise.resolve(VITSSpeechComponent), { ssr: false }); 