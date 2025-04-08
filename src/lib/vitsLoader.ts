"use client";

// Define basic types for VITS
export interface VITSModule {
  voices: () => Promise<string[]>;
  stored: () => Promise<string[]>;
  predict: (params: { text: string; voiceId: string }) => Promise<Blob>;
  download: (voiceId: string, progressCallback?: (progress: { loaded: number; total: number }) => void) => Promise<void>;
}

// Function to dynamically load VITS in a way that won't be statically analyzed
export async function loadVITSModule(): Promise<VITSModule | null> {
  // Only run in browser
  if (typeof window === 'undefined') {
    console.warn('VITS Loader: Cannot load VITS in server environment');
    return null;
  }

  try {
    // Use a dynamic variable to prevent static analysis
    const moduleName = '@' + 'diffusionstudio/vits-web';
    
    console.log(`VITS Loader: Attempting to dynamically import ${moduleName}`);
    
    // Use a dynamic import that won't be statically analyzed
    const moduleImport = Function('moduleName', 'return import(moduleName)')(moduleName)
      .catch((err: Error) => {
        console.warn(`VITS Loader: Import error: ${err.message}`);
        return null;
      });
    
    // Add a timeout to prevent hanging
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error("VITS import timed out after 5 seconds")), 5000);
    });

    // Race the import against the timeout
    const vitsModule = await Promise.race([moduleImport, timeoutPromise])
      .catch(error => {
        console.warn(`VITS Loader: Failed to load module: ${error instanceof Error ? error.message : String(error)}`);
        return null;
      });
    
    if (!vitsModule) {
      console.warn('VITS Loader: Module import returned null');
      return null;
    }
    
    console.log('VITS Loader: Module loaded successfully');
    return vitsModule as unknown as VITSModule;
  } catch (error) {
    console.warn('VITS Loader: Error during dynamic import:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// Check if VITS is available at runtime
export async function isVITSAvailable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    const vitsModule = await loadVITSModule();
    return !!vitsModule;
  } catch {
    return false;
  }
} 