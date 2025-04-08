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
    let vitsStatus = "unavailable";
    
    try {
      // This will likely fail since the library is client-only
      const vitsModulePromise = import('@diffusionstudio/vits-web');
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Import timed out after 5 seconds")), 5000);
      });
      
      // Race between the import and the timeout
      const vitsModule = await Promise.race([vitsModulePromise, timeoutPromise])
        .catch(e => {
          console.warn("VITS import error:", e.message);
          vitsStatus = "import-error";
          throw e; // Re-throw to be caught by the outer catch
        });
        
      // If we reach here, the module was imported successfully
      vitsInfo = `VITS library imported successfully. Available methods: ${
        vitsModule && typeof vitsModule === 'object' 
          ? Object.keys(vitsModule as object).join(', ') 
          : 'none'
      }`;
      vitsStatus = "available";
    } catch (importError) {
      const errorMessage = importError instanceof Error ? importError.message : 'Unknown error';
      vitsInfo = `VITS import error: ${errorMessage}`;
      
      // Check for specific module not found errors
      if (errorMessage.includes("not found") || 
          errorMessage.includes("Cannot find") || 
          errorMessage.includes("ENOENT") ||
          errorMessage.includes("404")) {
        vitsStatus = "not-found";
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "VITS test completed",
      environment: "server",
      vitsInfo,
      vitsStatus,
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