"use client";

import React from 'react';
import { Message } from '@/types/chat';
import { 
  Box, 
  Paper, 
  Typography, 
  Avatar, 
  Zoom,
  useTheme
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const theme = useTheme();

  return (
    <Zoom in={true} style={{ transitionDelay: '100ms' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          mb: 2,
          px: 1,
        }}
      >
        {!isUser && (
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
        )}

        <Box sx={{ maxWidth: '70%' }}>
          <Paper
            elevation={1}
            sx={{
              p: 2,
              borderRadius: 2,
              ...(isUser 
                ? { 
                    bgcolor: theme.palette.primary.main, 
                    color: 'white',
                    borderBottomRightRadius: 0
                  } 
                : { 
                    bgcolor: theme.palette.mode === 'dark' 
                      ? 'grey.800' 
                      : 'grey.100',
                    borderBottomLeftRadius: 0
                  }
              )
            }}
          >
            <Typography 
              variant="body1" 
              sx={{ 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                ...(isUser 
                  ? { color: 'white' } 
                  : { color: 'text.primary' }
                )
              }}
            >
              {message.content}
            </Typography>
          </Paper>

          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              mt: 0.5, 
              ml: isUser ? 'auto' : 1,
              mr: isUser ? 1 : 'auto',
              color: isUser 
                ? theme.palette.primary.light
                : 'text.secondary'
            }}
          >
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>
        </Box>

        {isUser && (
          <Avatar 
            sx={{ 
              bgcolor: theme.palette.primary.light, 
              ml: 1,
              width: 38,
              height: 38
            }}
          >
            <PersonIcon fontSize="small" />
          </Avatar>
        )}
      </Box>
    </Zoom>
  );
};

export default ChatMessage; 