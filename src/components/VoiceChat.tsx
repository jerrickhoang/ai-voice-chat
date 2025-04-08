"use client";

import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Message, ChatMessage as ChatMessageType } from '@/types/chat';
import ChatMessage from './ChatMessage';
import VITSSpeech, { VITSSpeechMethods } from './VITSSpeech';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import VITSTester from './VITSTester';

// Material UI components
import { 
  Box, 
  Typography, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Paper,
  IconButton,
  Divider,
  Fade,
  SelectChangeEvent,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Avatar,
  useMediaQuery,
  AppBar,
  Toolbar,
} from '@mui/material';

// Material UI Icons
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import SettingsIcon from '@mui/icons-material/Settings';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

// Voice settings
type VoiceOption = {
  id: string;
  name: string;
  description: string;
};

// Web Speech API voice options as fallback
const webSpeechVoices: VoiceOption[] = [
  { id: 'en-GB', name: 'British Voice', description: 'UK English' },
  { id: 'en-US', name: 'American Voice', description: 'US English' },
  { id: 'fr-FR', name: 'French Voice', description: 'French' },
  { id: 'de-DE', name: 'German Voice', description: 'German' },
  { id: 'it-IT', name: 'Italian Voice', description: 'Italian' },
  { id: 'ja-JP', name: 'Japanese Voice', description: 'Japanese' },
  { id: 'es-ES', name: 'Spanish Voice', description: 'Spanish' },
  { id: 'ko-KR', name: 'Korean Voice', description: 'Korean' },
  { id: 'zh-CN', name: 'Chinese Voice', description: 'Chinese' },
  { id: 'hi-IN', name: 'Hindi Voice', description: 'Hindi' },
];

// Create a Material UI theme function to support dark mode
const createAppTheme = (darkMode: boolean) => createTheme({
  palette: {
    mode: darkMode ? 'dark' : 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: darkMode ? '#121212' : '#f5f5f5',
      paper: darkMode ? '#1e1e1e' : '#ffffff',
    },
  },
});

// Add a new type for message with visibility status
type VisibleMessage = Message & {
  isVisible: boolean;
};

// Add a type for window with VITS testing functions
interface WindowWithVITSTest {
  testVITS: () => Promise<boolean>;
  testVITSSynthesis: (text: string, voiceId?: string) => Promise<boolean>;
  testVITSDownload: (voiceId: string) => Promise<boolean>;
}

const VoiceChat: React.FC = () => {
  // Add state to track client-side mounting
  const [isMounted, setIsMounted] = useState(false);
  
  // Update message state to include visibility flag
  const [messages, setMessages] = useState<VisibleMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('en-US');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  // Add a reference to the latest assistant message
  const latestAssistantMessageRef = useRef<string | null>(null);
  
  // Add dark mode state
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);
  const theme = React.useMemo(() => createAppTheme(darkMode), [darkMode]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Speech recognition setup
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  // Add these states in the VoiceChat component near other state variables
  const [useVITS, setUseVITS] = useState(false);
  const [vitsStatus, setVITSStatus] = useState('Not initialized');
  const [isVITSReady, setIsVITSReady] = useState(false);
  const vitsSpeechRef = useRef<VITSSpeechMethods>(null);

  // Add a state to track if VITS is fully functional
  const [isVITSFullyFunctional, setIsVITSFullyFunctional] = useState(false);

  // Add a state to track if we've forced VITS to be enabled
  const [hasAttemptedVITSForce, setHasAttemptedVITSForce] = useState(false);

  // Set mounted state on client-side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Enable VITS automatically when it becomes ready, even if not fully functional
  useEffect(() => {
    if (isVITSReady) {
      console.log(`VoiceChat: VITS is ready with status: "${vitsStatus}", enabling automatically`);
      setUseVITS(true);
    }
  }, [isVITSReady, vitsStatus]);

  // Initialize audio element only on client side
  useEffect(() => {
    if (typeof window !== 'undefined' && isMounted) {
      const audio = new Audio();
      audio.onended = () => setIsSpeaking(false);
      setAudioElement(audio);
    }
    
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [isMounted]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (isMounted) {
      scrollToBottom();
    }
  }, [messages, isMounted]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Add a useEffect with a timeout to check VITS status 2 seconds after mount
  useEffect(() => {
    if (isMounted && !hasAttemptedVITSForce) {
      const timeoutId = setTimeout(() => {
        console.log("VoiceChat: Timeout check for VITS status");
        if (!useVITS && vitsSpeechRef.current) {
          console.log("VoiceChat: VITS reference exists but not enabled, forcing...");
          forceEnableVITS();
          setHasAttemptedVITSForce(true);
        }
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isMounted, useVITS, hasAttemptedVITSForce]);

  // Function to submit message - the single point of sending messages to the API
  const submitMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    
    console.log(`VoiceChat: Submitting message: "${content.substring(0, 50)}..."`);
    
    // Add user message to the chat (always visible)
    const userMessage: VisibleMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      createdAt: new Date(),
      isVisible: true, // User messages are always visible immediately
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Format messages for the API
      const apiMessages: ChatMessageType[] = messages
        .concat(userMessage)
        .map(({ role, content }) => ({
          role,
          content,
        }));

      console.log(`VoiceChat: Sending ${apiMessages.length} messages to API`);
      
      // Send messages to the API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        console.error(`VoiceChat: API error with status ${response.status}`);
        throw new Error(`Error: ${response.status}`);
      }

      console.log('VoiceChat: Response received, extracting text');
      const data = await response.text();
      console.log(`VoiceChat: Received response: "${data.substring(0, 50)}..."`);
      
      // Store the latest assistant message for reference
      latestAssistantMessageRef.current = data;

      // Add AI response to the chat but make it invisible initially
      const assistantMessage: VisibleMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: data,
        createdAt: new Date(),
        isVisible: false, // Initially not visible
      };

      setMessages((prev) => [...prev, assistantMessage]);
      console.log('VoiceChat: Added assistant message to chat, starting TTS');

      // Speak the response with responsive voice
      speakWithOpenAI(data, assistantMessage.id);
    } catch (error) {
      console.error('VoiceChat: Error sending message:', error);
      // Add error message to chat (visible because it's an error)
      const errorMessage: VisibleMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        createdAt: new Date(),
        isVisible: true, // Error messages should be visible immediately
      };
      setMessages((prev) => [...prev, errorMessage]);
      
      // Speak the error message
      speakWithOpenAI(errorMessage.content, errorMessage.id);
    } finally {
      setIsLoading(false);
    }
  };

  // Speak text using VITS for best quality with Web Speech API fallback
  const speakWithOpenAI = async (text: string, messageId?: string) => {
    console.log(`VoiceChat TTS: Starting speech synthesis with text: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
    
    // Safety checks
    if (!isMounted) {
      console.error("VoiceChat TTS: Component not mounted, can't speak");
      return;
    }
    
    if (!text || text.trim() === '') {
      console.error("VoiceChat TTS: Empty text provided, can't speak");
      return;
    }
    
    // Make message visible if messageId is provided
    if (messageId) {
      console.log('VoiceChat TTS: Making message visible');
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isVisible: true } 
            : msg
        )
      );
    }
    
    // Cancel any ongoing speech first
    try {
      if (typeof window !== 'undefined') {
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
          console.log("VoiceChat TTS: Cancelling previous Web Speech API speech");
          window.speechSynthesis.cancel();
        }
        
        // Signal to stop any existing audio
        if (audioElement) {
          console.log("VoiceChat TTS: Stopping any existing audio playback");
          audioElement.pause();
          audioElement.src = '';
        }
      }
    } catch (error) {
      console.error("VoiceChat TTS: Error cancelling previous speech", error);
    }
    
    setIsSpeaking(true);
   
    // Print TTS system status for debugging
    console.log(`VoiceChat TTS: Status - VITS enabled: ${useVITS}, VITS ready: ${isVITSReady}, VITS fully functional: ${isVITSFullyFunctional}, VITS ref exists: ${!!vitsSpeechRef.current}`);

    // APPROACH 1: Try to use direct VITS from VITSTester if available
    if (useVITS && typeof window !== 'undefined') {
      // Use a safer typecasting approach
      const win = window as unknown as WindowWithVITSTest;
      
      if (win.testVITSSynthesis) {
        console.log("VoiceChat TTS: Attempting to use VITS via testVITSSynthesis");
        try {
          const result = await win.testVITSSynthesis(text);
          if (result) {
            console.log("VoiceChat TTS: Successfully used VITS via testVITSSynthesis");
            // The speech will be handled by testVITSSynthesis, so we just need to reset speaking state
            setTimeout(() => setIsSpeaking(false), 1000); // Give it a second to start speaking
            return;
          }
        } catch (error) {
          console.error("VoiceChat TTS: Error using testVITSSynthesis:", error);
          // Continue to next approach
        }
      }
    }

    // APPROACH 2: Try to use VITS through vitsSpeechRef
    if (useVITS && vitsSpeechRef.current) {
      console.log("VoiceChat TTS: Attempting to use VITS speech via ref");
      try {
        // First synthesize the audio
        const audioBlob = await vitsSpeechRef.current.synthesize(text);
        
        if (audioBlob) {
          console.log("VoiceChat TTS: VITS synthesis successful, creating audio element");
          // Create an audio element to play the synthesized speech
          const audio = new Audio(URL.createObjectURL(audioBlob));
          
          audio.onplay = () => {
            console.log("VoiceChat TTS: VITS speech started");
            setIsSpeaking(true);
          };
          
          audio.onended = () => {
            console.log("VoiceChat TTS: VITS speech completed");
            setIsSpeaking(false);
          };
          
          audio.onerror = () => {
            console.error("VoiceChat TTS: VITS speech playback error");
            setIsSpeaking(false);
            
            // Fallback to Web Speech API
            console.log("VoiceChat TTS: Falling back to Web Speech API after VITS failure");
            speakWithWebSpeech(text);
          };
          
          // Play the audio
          console.log("VoiceChat TTS: Attempting to play VITS audio");
          audio.play().catch((error: Error) => {
            console.error("VoiceChat TTS: Error playing VITS audio", error);
            setIsSpeaking(false);
            
            // Try fallback
            speakWithWebSpeech(text);
          });
          
          return; // Exit early if VITS is used successfully
        } else {
          console.error("VoiceChat TTS: VITS synthesis returned null blob");
          // Continue to fallbacks
        }
      } catch (error) {
        console.error("VoiceChat TTS: Error initiating VITS speech:", error);
        // Continue to fallbacks
      }
    }

    // Function to use Web Speech API as fallback
    const speakWithWebSpeech = (speechText: string) => {
      console.log("VoiceChat TTS: Using Web Speech API");
      
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        console.error("VoiceChat TTS: Web Speech API not available");
        setIsSpeaking(false);
        return;
      }
      
      try {
        const utterance = new SpeechSynthesisUtterance(speechText);
        
        // Use the selected language
        const availableVoices = window.speechSynthesis.getVoices();
        console.log(`VoiceChat TTS: Found ${availableVoices.length} Web Speech API voices`);
        
        const matchingVoice = availableVoices.find(voice => 
          voice.lang === selectedVoice && voice.localService
        ) || availableVoices.find(voice => 
          voice.lang === selectedVoice
        ) || availableVoices.find(voice => 
          voice.lang.startsWith(selectedVoice.split('-')[0])
        );
        
        if (matchingVoice) {
          console.log(`VoiceChat TTS: Using Web Speech API voice: ${matchingVoice.name}`);
          utterance.voice = matchingVoice;
        } else {
          console.warn(`VoiceChat TTS: No matching voice found for ${selectedVoice}`);
        }
        
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
        utterance.volume = 1.0;
        
        utterance.onstart = () => {
          console.log("VoiceChat TTS: Web Speech API speech started");
          setIsSpeaking(true);
        };
        
        utterance.onend = () => {
          console.log("VoiceChat TTS: Web Speech API speech completed");
          setIsSpeaking(false);
        };
        
        utterance.onerror = (event) => {
          console.error("VoiceChat TTS: Web Speech API error", event);
          setIsSpeaking(false);
        };
        
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("VoiceChat TTS: Error using Web Speech API", error);
        setIsSpeaking(false);
      }
    };
    
    speakWithWebSpeech(text);
  };

  // Handle microphone button click
  const handleMicrophoneClick = () => {
    if (listening) {
      // User is stopping the microphone
      SpeechRecognition.stopListening();
      
      // If there's a transcript, submit it
      if (transcript.trim()) {
        const currentTranscript = transcript;
        resetTranscript();
        submitMessage(currentTranscript);
      }
    } else {
      // Starting listening - just reset and start
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true });
    }
  };

  // Handle voice selection change
  const handleVoiceChange = (e: SelectChangeEvent) => {
    setSelectedVoice(e.target.value);
  };

  // Handle manual submit with current transcript
  const handleManualSubmit = () => {
    if (transcript.trim()) {
      const currentTranscript = transcript;
      resetTranscript();
      submitMessage(currentTranscript);
    }
  };

  // Function for demo/welcome button
  const handleStartConversation = () => {
    submitMessage("Hello, I want to practice speaking English. Can you pretend to be an English teacher and help me practice speaking English? Limit your response to be at most 2 sentences");
  };

  // Toggle voice settings panel
  const toggleVoiceSettings = () => {
    setShowVoiceSettings(!showVoiceSettings);
  };

  // Test the selected voice
  const testVoice = () => {
    const testText = "This is a test of my voice. How do I sound? I hope you enjoy chatting with me using this realistic voice.";
    console.log(`VoiceChat: Testing voice with VITS ${useVITS ? 'enabled' : 'disabled'}`);
    speakWithOpenAI(testText);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Add this function to directly test VITS synthesis without going through the full speech pipeline
  const testVITSDirectly = async () => {
    console.log("VoiceChat: Testing VITS directly, ref exists:", !!vitsSpeechRef.current, "isVITSReady:", isVITSReady);
    
    if (!vitsSpeechRef.current) {
      console.error("VoiceChat: Cannot test VITS - missing reference");
      return;
    }
    
    if (!isVITSReady) {
      console.error("VoiceChat: Cannot test VITS - not ready");
      return;
    }
    
    try {
      console.log("VoiceChat: Testing VITS synthesis directly");
      const testText = "This is a direct test of the VITS neural voice system.";
      
      // Try to synthesize using VITS
      const blob = await vitsSpeechRef.current.synthesize(testText);
      
      if (blob) {
        console.log("VoiceChat: VITS synthesis successful, blob size:", blob.size);
        
        // Create and play audio
        const audio = new Audio(URL.createObjectURL(blob));
        audio.onplay = () => console.log("VoiceChat: VITS test audio playing");
        audio.onended = () => console.log("VoiceChat: VITS test audio completed");
        audio.onerror = (e) => console.error("VoiceChat: VITS test audio error", e);
        
        await audio.play();
        console.log("VoiceChat: VITS test successful");
      } else {
        console.error("VoiceChat: VITS synthesis returned null blob in direct test");
      }
    } catch (error) {
      console.error("VoiceChat: Error testing VITS directly:", error);
    }
  };

  // Add a new useEffect to force enable VITS when vitsSpeechRef becomes available
  // This will ensure VITS gets used regardless of other status flags
  useEffect(() => {
    if (isMounted && vitsSpeechRef.current) {
      console.log("VoiceChat: VITS reference is available, enabling VITS");
      setIsVITSReady(true);
      setUseVITS(true);
    }
  }, [isMounted, vitsSpeechRef.current]);

  // Improve the VITS component rendering to ensure it's always there
  const renderVITSSpeech = () => {
    console.log("VoiceChat: Rendering VITS component, isMounted:", isMounted);
    
    // Force VITS ready if we already have a reference to it
    // This ensures we'll use VITS even if the status callbacks didn't fire properly
    if (vitsSpeechRef.current && !isVITSReady) {
      console.log("VoiceChat: VITS ref exists but not marked ready, fixing...");
      setIsVITSReady(true);
    }
    
    return (
      <Box sx={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
        <VITSSpeech
          ref={vitsSpeechRef}
          onReady={(ready) => {
            console.log("VoiceChat: VITS reported ready state:", ready);
            setIsVITSReady(ready);
          }}
          onStatusChange={(status) => {
            console.log("VoiceChat: VITS status change:", status);
            setVITSStatus(status);
            // Check if VITS is fully functional based on status message
            setIsVITSFullyFunctional(status === 'Ready to speak');
            
            // If we see certain status messages, log additional info for debugging
            if (status.includes('failed') || status.includes('error')) {
              console.error("VoiceChat: VITS encountered an error:", status);
            }
          }}
        />
      </Box>
    );
  };

  // Helper function to force enable VITS
  const forceEnableVITS = () => {
    console.log("VoiceChat: Forcing VITS to be enabled");
    setIsVITSReady(true);
    setUseVITS(true);
    setVITSStatus("Ready (forced)");
  };

  // Add the forceVITSInitialization function
  const forceVITSInitialization = () => {
    console.log("VoiceChat: Manually forcing VITS initialization");
    
    // Try to directly use the VITSTester
    if (typeof window !== 'undefined') {
      const win = window as unknown as WindowWithVITSTest;
      
      if (win.testVITS) {
        console.log("VoiceChat: Using VITSTester to initialize VITS");
        win.testVITS().then((result: boolean) => {
          console.log("VoiceChat: VITSTester initialization result:", result);
          
          if (result) {
            // Force flags regardless of other status
            setIsVITSReady(true);
            setUseVITS(true);
            setVITSStatus("Ready (manually initialized)");
            setHasAttemptedVITSForce(true);
          }
        });
      } else {
        console.log("VoiceChat: VITSTester not available, forcing flags directly");
        forceEnableVITS();
      }
    } else {
      forceEnableVITS();
    }
  };

  // Check if browser supports speech recognition - only on client side
  if (isMounted && !browserSupportsSpeechRecognition) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', p: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">Browser Not Supported</Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Your browser does not support speech recognition.
            Please try a different browser like Chrome.
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  // Check if microphone is available - only on client side
  if (isMounted && !isMicrophoneAvailable) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', p: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">Microphone Access Required</Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Please allow microphone access to use voice chat features.
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        {/* Header AppBar */}
        <AppBar position="static" color="primary">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              AI Voice Assistant
            </Typography>
            <IconButton 
              color="inherit" 
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Main content */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, maxWidth: '900px', mx: 'auto', width: '100%', p: { xs: 1, sm: 2 } }}>
          {/* Voice settings panel */}
          <Fade in={showVoiceSettings}>
            <Paper 
              elevation={1} 
              sx={{ 
                display: showVoiceSettings ? 'block' : 'none',
                p: 3, 
                mb: 2,
                borderRadius: '8px' 
              }}
            >
              <Typography variant="h6" gutterBottom>Voice Settings</Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', mb: 2 }}>
                <FormControlLabel 
                  control={
                    <Switch
                      checked={useVITS}
                      onChange={(e) => setUseVITS(e.target.checked)}
                      color="primary"
                      disabled={!isVITSReady}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body2">Use VITS Neural Voice (Highest Quality)</Typography>
                      <Typography 
                        variant="caption" 
                        color={isVITSReady && isVITSFullyFunctional ? "success.main" : "text.secondary"}
                      >
                        {isVITSReady && isVITSFullyFunctional 
                          ? '✓ Ultra-realistic voice with natural intonation (runs locally)' 
                          : isVITSReady && !isVITSFullyFunctional
                            ? '⚠️ Limited functionality - may have issues but usable'
                            : `Status: ${vitsStatus}`}
                      </Typography>
                    </Box>
                  }
                />
              </Box>
              
              {!useVITS && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="voice-select-label">Browser Voice</InputLabel>
                  <Select
                    labelId="voice-select-label"
                    value={selectedVoice}
                    label="Browser Voice"
                    onChange={handleVoiceChange}
                  >
                    {webSpeechVoices.map((voice) => (
                      <MenuItem key={voice.id} value={voice.id}>
                        {voice.name} - {voice.description}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              
              {useVITS && isVITSFullyFunctional && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Using VITS neural voice technology for highest quality speech synthesis. 
                  This runs entirely on your device for privacy and low latency.
                </Alert>
              )}
              
              {isVITSReady && !isVITSFullyFunctional && useVITS && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  VITS is running with limited functionality. Some features may not work correctly.
                  If you experience issues, switch to Web Speech API instead.
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={testVoice}
                  disabled={isSpeaking}
                  sx={{ mb: 1 }}
                  size="small"
                >
                  Test Voice
                </Button>
                
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  onClick={forceVITSInitialization}
                  disabled={isSpeaking}
                  size="small"
                >
                  Force VITS Initialization
                </Button>
                
                {isVITSReady && (
                  <Button 
                    variant="outlined" 
                    color="info" 
                    onClick={testVITSDirectly}
                    disabled={isSpeaking}
                    size="small"
                  >
                    Test VITS Directly
                  </Button>
                )}
                
                <Typography variant="caption" color="text.secondary">
                  {useVITS && isVITSFullyFunctional
                    ? "Note: Using neural TTS for ultra-realistic voice" 
                    : "Note: Using browser's built-in voice synthesis"}
                </Typography>
              </Box>
            </Paper>
          </Fade>

          {/* Chat Messages Area */}
          <Paper 
            elevation={2} 
            sx={{ 
              flexGrow: 1, 
              overflow: 'auto', 
              p: 2,
              mb: 2,
              borderRadius: '8px'
            }}
          >
            {messages.length === 0 ? (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  height: '100%',
                  textAlign: 'center' 
                }}
              >
                <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                  Welcome to Voice Chat
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  Start a conversation by pressing the microphone button and speaking
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleStartConversation}
                  disabled={isLoading || isSpeaking}
                  sx={{ mb: 2 }}
                >
                  Start Conversation
                </Button>
              </Box>
            ) : (
              <Box>
                {/* Only render messages that are visible */}
                {messages.filter(message => message.isVisible).map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                
                {/* Loading indicator */}
                {isLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2, px: 1 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: theme.palette.primary.main, 
                        mr: 1,
                        width: 38,
                        height: 38
                      }}
                    >
                      <SmartToyIcon fontSize="small" />
                    </Avatar>
                    <Paper sx={{ 
                      maxWidth: '70%', 
                      p: 2, 
                      borderRadius: '16px', 
                      borderBottomLeftRadius: 0,
                      bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                    }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          bgcolor: 'grey.400', 
                          borderRadius: '50%', 
                          animation: 'bounce 1s infinite' 
                        }} />
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          bgcolor: 'grey.400', 
                          borderRadius: '50%', 
                          animation: 'bounce 1s infinite',
                          animationDelay: '0.2s' 
                        }} />
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          bgcolor: 'grey.400', 
                          borderRadius: '50%', 
                          animation: 'bounce 1s infinite',
                          animationDelay: '0.4s' 
                        }} />
                      </Box>
                    </Paper>
                  </Box>
                )}
                
                {/* Speaking indicator with current AI message text */}
                {isSpeaking && latestAssistantMessageRef.current && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2, px: 1 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: theme.palette.success.main, 
                        mr: 1,
                        width: 38,
                        height: 38
                      }}
                    >
                      <SmartToyIcon fontSize="small" />
                    </Avatar>
                    <Paper sx={{ 
                      maxWidth: '70%', 
                      p: 2, 
                      borderRadius: '16px', 
                      borderBottomLeftRadius: 0,
                      bgcolor: theme.palette.success.light 
                    }}>
                      <Typography variant="body2" color="success.contrastText">
                        {useVITS 
                          ? "Speaking with Neural TTS voice..." 
                          : "Speaking with browser voice..."}
                      </Typography>
                    </Paper>
                  </Box>
                )}
                
                <div ref={messagesEndRef} />
              </Box>
            )}
          </Paper>
          
          {/* Voice control panel */}
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              mb: 2,
              borderRadius: '8px'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Button
                startIcon={<SettingsIcon />}
                onClick={toggleVoiceSettings}
                size="small"
                color="primary"
              >
                {showVoiceSettings ? 'Hide Voice Settings' : 'Voice Settings'}
              </Button>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ flexGrow: 1, mr: 2 }}>
                {listening && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography 
                      variant="body2" 
                      color="text.primary" 
                      sx={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        flexGrow: 1 
                      }}
                    >
                      {transcript || "Listening... Speak now."}
                    </Typography>
                    
                    {transcript?.trim() && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        endIcon={<SendIcon />}
                        onClick={handleManualSubmit}
                        disabled={isLoading || isSpeaking}
                        sx={{ ml: 1 }}
                      >
                        Send
                      </Button>
                    )}
                  </Box>
                )}
                
                {!listening && !isLoading && !isSpeaking && (
                  <Typography variant="body2" color="text.secondary">
                    Press the microphone button to speak
                  </Typography>
                )}
                
                {isLoading && (
                  <Typography variant="body2" color="text.secondary">
                    Processing your message...
                  </Typography>
                )}
              </Box>
              
              <IconButton
                color={listening ? "secondary" : "primary"}
                onClick={handleMicrophoneClick}
                disabled={isLoading || isSpeaking}
                aria-label={listening ? "Stop listening" : "Start listening"}
                size="large"
                sx={{ 
                  p: 2,
                  boxShadow: 3,
                  bgcolor: listening ? 'secondary.main' : 'primary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: listening ? 'secondary.dark' : 'primary.dark',
                  },
                  '&.Mui-disabled': {
                    bgcolor: 'action.disabledBackground',
                    color: 'action.disabled'
                  }
                }}
              >
                {listening ? <StopIcon /> : <MicIcon />}
              </IconButton>
            </Box>
          </Paper>

          {/* Footer */}
          <Box sx={{ mt: 'auto', textAlign: 'center', py: 1 }}>
            <Typography variant="caption" color="text.secondary">
              © 2025 AI Voice Chat - Powered by Next.js and OpenAI
            </Typography>
          </Box>
        </Box>

        {/* VITS component - ensuring it's always rendered */}
        {isMounted && renderVITSSpeech()}
        
        {/* Add VITSTester for debugging */}
        {isMounted && <VITSTester />}
      </Box>
    </ThemeProvider>
  );
};

export default VoiceChat; 