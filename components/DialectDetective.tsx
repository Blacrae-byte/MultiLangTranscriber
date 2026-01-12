
import React, { useState, useRef, useEffect } from 'react';
import { PolyglotResponse } from '../types';
import { analyzeAudio, transcribeOnly } from '../services/geminiService';

interface Props {
  onResult: (res: PolyglotResponse) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  setLoadingMessage: (val: string) => void;
  isDarkMode: boolean;
}

const DialectDetective: React.FC<Props> = ({ onResult, isLoading, setIsLoading, setLoadingMessage, isDarkMode }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [timer, setTimer] = useState(0);
  const [showDeepScanPrompt, setShowDeepScanPrompt] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
      };

      recorder.start();
      setIsRecording(true);
      setTimer(0);
      setShowDeepScanPrompt(false);
      timerRef.current = window.setInterval(() => setTimer(t => t + 1), 1000) as unknown as number;
    } catch (err) {
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleProcess = async (mode: 'standard' | 'deep') => {
    if (!audioBlob) return;
    
    const msg = mode === 'standard' 
      ? "Analyzing audio sample for regional markers..." 
      : "Performing high-fidelity acoustic deconstruction...";
    
    setLoadingMessage(msg);
    setIsLoading(true);
    
    try {
      const result = mode === 'standard' 
        ? await analyzeAudio(audioBlob) 
        : await transcribeOnly(audioBlob);
      
      onResult(result);
      
      if (result.confidence_score !== undefined && result.confidence_score < 0.6) {
        setShowDeepScanPrompt(true);
      }
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className={`rounded-2xl shadow-sm border p-8 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      <div className="text-center mb-8">
        <h2 className={`text-xl font-bold mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Identify Regional Variants</h2>
        <p className={`max-w-lg mx-auto transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Record a phrase. I'll identify the dialect, transcribe it, and explain regional idioms. If the signal is weak, use Deep Transcription.
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="relative group">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording 
                ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/20' 
                : isDarkMode 
                  ? 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-900/40'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isRecording ? (
              <svg className="w-10 h-10 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            )}
          </button>
          {isRecording && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-red-500 font-mono text-lg font-bold">
              {formatTime(timer)}
            </div>
          )}
        </div>

        {audioBlob && !isRecording && (
          <div className="flex flex-col items-center gap-4 mt-4 w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
            <audio src={URL.createObjectURL(audioBlob)} controls className={`w-full rounded-lg ${isDarkMode ? 'invert opacity-80' : ''}`} />
            
            <div className="flex flex-col gap-3 w-full">
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => handleProcess('standard')}
                  disabled={isLoading}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Analyze Dialect'}
                </button>
                <button
                  onClick={() => setAudioBlob(null)}
                  disabled={isLoading}
                  className={`px-6 py-3 border rounded-xl font-bold transition-all active:scale-95 ${isDarkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  Clear
                </button>
              </div>

              {(showDeepScanPrompt || audioBlob) && (
                <button
                  onClick={() => handleProcess('deep')}
                  disabled={isLoading}
                  className={`w-full py-2.5 rounded-xl text-sm font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                    isDarkMode 
                      ? 'bg-slate-800 border-indigo-500/30 text-indigo-400 hover:bg-slate-700' 
                      : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.642.257a6 6 0 01-3.86.517l-2.387-.477a2 2 0 00-1.022.547l-1.168 1.168a1 1 0 001.414 1.414l1.168-1.168a2 2 0 011.022-.547l2.387.477a6 6 0 003.86-.517l.642-.257a6 6 0 013.86-.517l2.387.477a2 2 0 011.022.547l1.168-1.168a1 1 0 00-1.414-1.414l-1.168 1.168z" />
                  </svg>
                  High Fidelity Transcription
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mt-6">
          <label className="flex flex-col items-center cursor-pointer group">
            <span className={`text-[10px] font-black uppercase tracking-widest mb-3 transition-colors ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>External Audio Source</span>
            <input 
              type="file" 
              accept="audio/*" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                    setAudioBlob(file);
                    setShowDeepScanPrompt(false);
                }
              }}
            />
            <div className={`px-6 py-2.5 border-2 border-dashed rounded-xl text-xs font-bold transition-all transform group-hover:scale-105 ${isDarkMode ? 'border-slate-800 text-slate-500 group-hover:border-indigo-500 group-hover:text-indigo-400' : 'border-slate-200 text-slate-500 group-hover:border-indigo-400 group-hover:text-indigo-600'}`}>
              Load Audio Artifact
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default DialectDetective;
