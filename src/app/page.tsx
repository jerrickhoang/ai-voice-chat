import VoiceChat from '@/components/VoiceChat';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 shadow-sm py-4">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI Voice Assistant</h1>
        </div>
      </header>
      
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm h-[calc(100vh-10rem)] overflow-hidden flex flex-col">
            <VoiceChat />
          </div>
        </div>
      </main>
      
      <footer className="bg-white dark:bg-gray-900 py-4 border-t dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} AI Voice Chat - Powered by Next.js and OpenAI
        </div>
      </footer>
    </div>
  );
}
