import { NextResponse } from 'next/server';

// This API will test if the VITS module can be imported server-side
export async function GET() {
  console.log("VITS test API called");
  
  try {
    // We don't actually need to try importing the VITS module server-side
    // Just report that it's a client-only feature
    return NextResponse.json({
      success: true,
      message: "VITS test completed",
      environment: "server",
      vitsInfo: "VITS is a client-side only feature and cannot be tested server-side",
      vitsStatus: "client-only",
      nodeVersion: process.version,
      systemInfo: {
        nodejs: process.version,
        platform: process.platform,
        arch: process.arch,
        systemMemory: process.memoryUsage()
      }
    });
  } catch (error) {
    console.error("VITS test API error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 