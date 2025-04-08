import { NextRequest } from 'next/server';

// IMPORTANT! Set the runtime to edge for better performance
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    // Simply return a success response with the text to be spoken
    // The actual TTS will be handled client-side with ResponsiveVoice
    const { text, voice = 'default' } = await req.json();

    // Check if text is provided
    if (!text) {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Log the TTS request (helpful for debugging)
    console.log(`Processing TTS request: voice=${voice}, text length=${text.length}`);

    // Return a success response with the text to be spoken
    return new Response(JSON.stringify({ 
      success: true,
      text,
      voice
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
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