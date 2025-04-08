import { OpenAI } from 'openai';
import { NextRequest } from 'next/server';

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  console.log('Chat API: Request received');
  try {
    const { messages } = await req.json();

    // Check if messages array exists and is not empty
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('Chat API: No messages provided');
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Chat API: Processing ${messages.length} messages`);
    console.log(`Chat API: Last message: "${messages[messages.length - 1].content.substring(0, 100)}..."`);

    // Request the OpenAI API for the response
    console.log('Chat API: Calling OpenAI API');
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      stream: false, // Changed to false for simplicity
      messages: messages,
    });
    
    console.log('Chat API: Received response from OpenAI');
    
    // Get the text from the completion
    const text = response.choices[0]?.message?.content || '';
    console.log(`Chat API: Generated text (first 100 chars): "${text.substring(0, 100)}..."`);
    
    // Return as plain text
    return new Response(text, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 