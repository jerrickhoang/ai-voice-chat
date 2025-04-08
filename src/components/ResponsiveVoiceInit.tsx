"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// This version doesn't try to load ResponsiveVoice at all
// since we're using VITS and Web Speech API instead
const ResponsiveVoiceInit = () => {
  const [isMounted, setIsMounted] = useState(false);
  
  // Log a message when mounted
  useEffect(() => {
    setIsMounted(true);
    
    if (typeof window !== 'undefined') {
      console.log('ResponsiveVoice: Not loading - using VITS and Web Speech API instead');
    }
  }, []);

  // This component doesn't render anything visible
  if (!isMounted) return null;
  
  return null;
};

// Export with dynamic import to ensure client-side only rendering
export default dynamic(() => Promise.resolve(ResponsiveVoiceInit), { ssr: false }); 