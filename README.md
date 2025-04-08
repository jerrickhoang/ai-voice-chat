# AI Voice Chat Application

A modern voice chat application with AI capabilities using Next.js, Material UI, and OpenAI's text-to-speech API.

## Features

- Voice recognition for hands-free chat
- AI responses powered by OpenAI
- Realistic text-to-speech using OpenAI's TTS API
- Material Design UI with dark/light mode
- Chat bubble interface
- Multiple voice options

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the root directory
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```
4. Start the development server
   ```bash
   npm run dev
   ```

## Deploying to Vercel

This project can be easily deployed to Vercel:

1. Push your code to a GitHub repository
2. Visit [vercel.com](https://vercel.com) and sign up/login
3. Click "New Project" and import your GitHub repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ai-chat-app (if your project is in a subfolder)
5. Add the environment variable:
   - Add `OPENAI_API_KEY` with your OpenAI API key
6. Click "Deploy"

After deployment, Vercel will provide you with a URL to access your application.

## Environment Variables

| Variable | Description |
|----------|-------------|
| OPENAI_API_KEY | Your OpenAI API key |

## Technology Stack

- [Next.js](https://nextjs.org/) - React framework
- [Material UI](https://mui.com/) - UI components
- [OpenAI API](https://platform.openai.com/) - For chat and TTS
- [React Speech Recognition](https://www.npmjs.com/package/react-speech-recognition) - For voice input

## Project Structure

- `src/app/` - Next.js app router files
  - `page.tsx` - Main application page
  - `layout.tsx` - Root layout with metadata
  - `api/chat/route.ts` - API endpoint for chat functionality
- `src/components/` - React components
  - `VoiceChat.tsx` - Main voice chat component
  - `ChatMessage.tsx` - Individual message component
  - `ChatInput.tsx` - Message input component (used in text mode)
  - `Chat.tsx` - Text chat component (alternative to voice)
- `src/types/` - TypeScript type definitions

## License

MIT
