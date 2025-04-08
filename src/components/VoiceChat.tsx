"use client";

import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Message, ChatMessage as ChatMessageType } from '@/types/chat';
import ChatMessage from './ChatMessage';

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

// OpenAI's voice options
const openAIVoices: VoiceOption[] = [
  { id: 'alloy', name: 'Alloy', description: 'Versatile, balanced voice' },
  { id: 'echo', name: 'Echo', description: 'Warm, neutral voice' },
  { id: 'fable', name: 'Fable', description: 'Narrative, eloquent voice' },
  { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative voice' },
  { id: 'nova', name: 'Nova', description: 'Bright, friendly voice' },
  { id: 'shimmer', name: 'Shimmer', description: 'Clear, pleasant voice' },
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

const VoiceChat: React.FC = () => {
  // Update message state to include visibility flag
  const [messages, setMessages] = useState<VisibleMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('alloy');
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

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to submit message - the single point of sending messages to the API
  const submitMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    
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

      // Send messages to the API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.text();
      
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

      // Speak the response with realistic OpenAI voice
      speakWithOpenAI(data, assistantMessage.id);
    } catch (error) {
      console.error('Error sending message:', error);
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

  // Speak text using OpenAI's TTS API
  const speakWithOpenAI = async (text: string, messageId?: string) => {
    if (!text.trim() || !audioElement) return;
    
    // Stop any current speech
    if (isSpeaking && audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }
    
    setIsSpeaking(true);
    
    try {
      // Call our TTS API endpoint
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text,
          voice: selectedVoice,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // Get the audio blob
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Make the message visible before playing audio 
      if (messageId) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, isVisible: true } 
              : msg
          )
        );
      }
      
      // Play the audio
      audioElement.src = audioUrl;
      audioElement.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl); // Clean up
      };
      audioElement.onerror = () => {
        console.error('Audio playback error');
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl); // Clean up
        
        // In case of error, make sure the message is visible
        if (messageId) {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === messageId 
                ? { ...msg, isVisible: true } 
                : msg
            )
          );
        }
      };
      
      // Play the audio
      audioElement.play();
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
      
      // In case of error, make sure the message is visible
      if (messageId) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, isVisible: true } 
              : msg
          )
        );
      }
    }
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
    speakWithOpenAI("This is a test of my voice. How do I sound? I hope you enjoy chatting with me using this realistic voice.");
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Check if browser supports speech recognition
  if (!browserSupportsSpeechRecognition) {
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

  // Check if microphone is available
  if (!isMicrophoneAvailable) {
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
        <AppBar position="static" elevation={0} color="primary">
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
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="voice-select-label">AI Voice</InputLabel>
                <Select
                  labelId="voice-select-label"
                  value={selectedVoice}
                  label="AI Voice"
                  onChange={handleVoiceChange}
                >
                  {openAIVoices.map((voice) => (
                    <MenuItem key={voice.id} value={voice.id}>
                      {voice.name} - {voice.description}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
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
                <Typography variant="caption" color="text.secondary">
                  Note: Using OpenAI&apos;s realistic TTS voices
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
                        Speaking with {openAIVoices.find(v => v.id === selectedVoice)?.name} voice...
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
      </Box>
    </ThemeProvider>
  );
};

export default VoiceChat; 