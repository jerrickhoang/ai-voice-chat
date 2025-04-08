import { OpenAI } from 'openai';
import { NextRequest } from 'next/server';

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// IMPORTANT! Set the runtime to edge
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Check if messages array exists and is not empty
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Request the OpenAI API for the response
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      stream: true,
      messages: messages,
    });

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);

    // Respond with the stream
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// OpenAI stream helper function
function OpenAIStream(response: unknown) {
  // Assert response is an async iterable
  if (!response || typeof response !== 'object' || Symbol.asyncIterator in (response as object) === false) {
    throw new Error('Response is not an async iterable');
  }

  const encoder = new TextEncoder();
  
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of response as AsyncIterable<unknown>) {
          if (chunk && typeof chunk === 'object' && 'choices' in chunk) {
            const choices = (chunk as { choices: Array<{ delta?: { content?: string } }> }).choices;
            const content = choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        }
        controller.close();
      } catch (error) {
        console.error('Error in stream processing:', error);
        controller.error(error);
      }
    },
  });
}

// StreamingTextResponse helper since we had issues with the import
class StreamingTextResponse extends Response {
  constructor(stream: ReadableStream) {
    super(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
} 