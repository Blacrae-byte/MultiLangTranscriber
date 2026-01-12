
import React from 'react';

interface Props {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Header: React.FC<Props> = ({ isDarkMode, toggleTheme }) => {
  return (
    <header className={`border-b transition-colors py-6 px-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 rotate-3">
            <svg className="w-7 h-7 text-white -rotate-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
          <div>
            <h1 className={`text-2xl font-black leading-tight tracking-tight uppercase transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Dialect Detective</h1>
            <p className={`text-xs font-bold uppercase tracking-widest transition-colors ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Global Phonetics Engine</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl border transition-all hover:scale-110 active:scale-95 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-50 border-slate-200 text-indigo-600'}`}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 118.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          
          <div className="hidden md:block text-right">
            <div className={`text-xs font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Operational Status</div>
            <div className="flex items-center gap-2 text-sm text-green-600 font-bold uppercase">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.4)]"></span>
              Pulse Active
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
