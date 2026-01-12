
import React, { useState } from 'react';
import { PolyglotResponse, DIALECT_MAP, DialectCategory } from '../types';
import { reverseLookup } from '../services/geminiService';

interface Props {
  onResult: (res: PolyglotResponse) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  setLoadingMessage: (val: string) => void;
  isDarkMode: boolean;
}

const ReverseDictionary: React.FC<Props> = ({ onResult, isLoading, setIsLoading, setLoadingMessage, isDarkMode }) => {
  const [definition, setDefinition] = useState('');
  const [category, setCategory] = useState<DialectCategory>('English');
  const [targetDialect, setTargetDialect] = useState('');

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!definition || !targetDialect) return;

    const shortDef = definition.length > 30 ? definition.substring(0, 27) + '...' : definition;
    setLoadingMessage(`Cross-referencing lexicon for "${shortDef}"...`);
    setIsLoading(true);
    
    try {
      const result = await reverseLookup(definition, targetDialect);
      onResult(result);
    } catch (err) {
      console.error(err);
      alert("Lookup failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`rounded-2xl shadow-sm border p-8 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <div className="text-center mb-8">
        <h2 className={`text-xl font-bold mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Reverse Regional Dictionary</h2>
        <p className={`max-w-lg mx-auto transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Describe a concept or define a word, and I'll find the exact term used in your chosen regional dialect.
        </p>
      </div>

      <form onSubmit={handleLookup} className="space-y-6 max-w-2xl mx-auto">
        <div>
          <label className={`block text-sm font-semibold mb-2 transition-colors ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Select Language Family</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {(Object.keys(DIALECT_MAP) as DialectCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat);
                  setTargetDialect('');
                }}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                  category === cat
                    ? isDarkMode 
                      ? 'bg-indigo-900/30 border-indigo-500 text-indigo-300'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : isDarkMode
                      ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={`block text-sm font-semibold mb-2 transition-colors ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Select Target Dialect</label>
          <select
            value={targetDialect}
            onChange={(e) => setTargetDialect(e.target.value)}
            required
            className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
          >
            <option value="">Choose a regional variant...</option>
            {DIALECT_MAP[category].map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block text-sm font-semibold mb-2 transition-colors ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Word Definition or Description</label>
          <textarea
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            placeholder="e.g. 'A casual way to say friend' or 'The word for flip-flops'"
            required
            rows={4}
            className={`w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !definition || !targetDialect}
          className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Consulting Experts...' : 'Find Regional Word'}
        </button>
      </form>
    </div>
  );
};

export default ReverseDictionary;
