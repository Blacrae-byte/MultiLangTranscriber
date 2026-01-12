
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import DialectDetective from './components/DialectDetective';
import ReverseDictionary from './components/ReverseDictionary';
import { PolyglotResponse } from './types';
import ResultDisplay from './components/ResultDisplay';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'detective' | 'dictionary'>('detective');
  const [result, setResult] = useState<PolyglotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className={`min-h-screen transition-colors duration-300 pb-20 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      
      <main className="max-w-4xl mx-auto px-4 mt-8">
        <div className="flex justify-center mb-8">
          <div className={`p-1 rounded-xl shadow-sm border transition-colors flex gap-1 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <button
              onClick={() => { setActiveTab('detective'); setResult(null); }}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'detective'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Dialect Detective
            </button>
            <button
              onClick={() => { setActiveTab('dictionary'); setResult(null); }}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'dictionary'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              Reverse Dictionary
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === 'detective' ? (
            <DialectDetective 
              onResult={setResult} 
              setIsLoading={setIsLoading} 
              setLoadingMessage={setLoadingMessage}
              isLoading={isLoading} 
              isDarkMode={isDarkMode}
            />
          ) : (
            <ReverseDictionary 
              onResult={setResult} 
              setIsLoading={setIsLoading} 
              setLoadingMessage={setLoadingMessage}
              isLoading={isLoading} 
              isDarkMode={isDarkMode}
            />
          )}

          {result && !isLoading && <ResultDisplay result={result} isDarkMode={isDarkMode} />}
          
          {isLoading && (
            <div className={`flex flex-col items-center justify-center p-12 rounded-2xl shadow-sm border animate-in fade-in zoom-in-95 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 border-4 border-indigo-600/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className={`font-bold text-xl text-center max-w-md tracking-tight animate-pulse ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
                {loadingMessage || "Processing..."}
              </p>
              <div className="flex gap-1 mt-4">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></span>
              </div>
              <p className={`text-[10px] mt-6 uppercase tracking-[0.3em] font-black opacity-50 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Polyglot Pulse Neural Engine
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className={`mt-12 text-center text-sm transition-colors ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
        <p>© 2024 Polyglot Pulse — Dialect Expertise Engine</p>
      </footer>
    </div>
  );
};

export default App;
