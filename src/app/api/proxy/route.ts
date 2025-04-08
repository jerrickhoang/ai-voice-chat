import { NextResponse } from 'next/server';

// This proxy route bypasses CORS restrictions for external APIs
export async function GET(request: Request) {
  try {
    // Get the URL to proxy from the query parameter
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }
    
    // Only allow proxying to specific trusted domains for security
    const allowedDomains = ['huggingface.co', 'cdn.jsdelivr.net'];
    const targetUrl = new URL(url);
    
    if (!allowedDomains.some(domain => targetUrl.hostname.includes(domain))) {
      return NextResponse.json(
        { error: 'Domain not allowed' },
        { status: 403 }
      );
    }
    
    console.log(`Proxying request to: ${url}`);
    
    // Make the request to the external API
    const response = await fetch(url);
    
    // Get the response data
    const data = await response.text();
    
    // Determine content type
    const contentType = response.headers.get('content-type') || 'application/json';
    
    // Create and return the response
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 500 }
    );
  }
} 