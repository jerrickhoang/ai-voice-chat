import { OpenAI } from 'openai';
import { NextRequest } from 'next/server';

// IMPORTANT! Set the runtime to edge for better performance
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    // Check if API key is available
    if (!apiKey) {
      console.error('OpenAI API key is missing');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create an OpenAI API client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const { text, voice = 'alloy' } = await req.json();

    // Check if text is provided
    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Log the TTS request (helpful for debugging)
    console.log(`Processing TTS request: voice=${voice}, text length=${text.length}`);

    // Create an audio response using OpenAI's API
    const audioResponse = await openai.audio.speech.create({
      model: 'tts-1', // or 'tts-1-hd' for higher quality
      voice: voice, // alloy, echo, fable, onyx, nova, or shimmer
      input: text,
    });

    // Get the audio data as an ArrayBuffer
    const audioBuffer = await audioResponse.arrayBuffer();
    
    console.log('TTS response generated successfully');

    // Return the audio file
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error: unknown) {
    // More detailed error logging
    console.error('TTS API error:', error);
    
    // Extract useful error information if available
    const errorMessage = error instanceof Error ? error.message : 'Unknown TTS service error';
    const statusCode = 500;
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: String(error)
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 