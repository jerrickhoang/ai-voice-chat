# AI Voice Chat Application

A voice-enabled chat application built with Next.js that allows users to interact with an AI assistant through both voice and text. The application supports voice input via the browser's Speech Recognition API and provides voice output through multiple text-to-speech options.

## Features

- Speech-to-text conversion using the Web Speech API
- Text-to-speech output with multiple voice options
- Conversation memory that maintains context
- Responsive UI that works on mobile and desktop
- Dark mode support
- Multiple voice options including:
  - ResponsiveVoice for consistent cross-browser experience
  - VITS (Variational Inference with adversarial learning for end-to-end Text-to-Speech) for ultra-realistic on-device TTS
  - Web Speech API as a fallback option

## Text-to-Speech Options

This application provides three TTS options to balance quality, performance, and reliability:

1. **VITS TTS (On-Device)**: Ultra-realistic speech synthesis that runs directly in the browser for the highest quality voice output. The model is downloaded once and stored in the browser, allowing future TTS operations to run locally without internet connectivity.

2. **ResponsiveVoice**: A reliable cross-browser solution that provides consistent voice quality across different browsers and platforms. Requires internet connection.

3. **Web Speech API (Fallback)**: Uses the browser's built-in speech synthesis for basic TTS functionality when other options are unavailable.

## Setup and Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env.local` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Technical Details

- Built with Next.js 14 (App Router)
- Uses MUI (Material-UI) for UI components
- Integrates with OpenAI API for chat functionality
- Implements the Web Speech API for speech recognition
- Uses multiple TTS solutions for different quality levels and fallback scenarios:
  - ResponsiveVoice.js for cross-browser TTS
  - VITS for high-quality, on-device TTS using ONNX runtime
  - Web Speech API as a final fallback

## License

This project is licensed under the MIT License.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key (only needed for chat functionality)

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
| OPENAI_API_KEY | Your OpenAI API key (for chat functionality only) |

## Technology Stack

- [Next.js](https://nextjs.org/) - React framework
- [Material UI](https://mui.com/) - UI components
- [OpenAI API](https://platform.openai.com/) - For chat functionality
- [React Speech Recognition](https://www.npmjs.com/package/react-speech-recognition) - For voice input
- [ResponsiveVoice](https://responsivevoice.org/) - For high-quality text-to-speech output

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
