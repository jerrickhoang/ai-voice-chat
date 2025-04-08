import { NextResponse } from 'next/server';

// This API will test if the VITS module can be imported server-side
export async function GET() {
  console.log("VITS test API called");
  
  try {
    // Try to import the VITS library to see if it works server-side
    // Note: This might not work server-side, which is expected
    console.log("Attempting to import VITS library...");
    
    // We wrap this in a try-catch to handle expected failure
    let vitsInfo = "Not available server-side";
    try {
      // This will likely fail since the library is client-only
      const vitsModule = await import('@diffusionstudio/vits-web');
      vitsInfo = `VITS library imported successfully. Available methods: ${Object.keys(vitsModule).join(', ')}`;
    } catch (importError) {
      vitsInfo = `VITS import error: ${importError instanceof Error ? importError.message : 'Unknown error'}`;
    }
    
    return NextResponse.json({
      success: true,
      message: "VITS test completed",
      environment: "server",
      vitsInfo,
      systemInfo: {
        nodejs: process.version,
        platform: process.platform
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