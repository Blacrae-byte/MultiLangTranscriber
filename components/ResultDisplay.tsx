
import React, { useEffect, useState, useRef } from 'react';
import { PolyglotResponse, UserSuggestion } from '../types';
import { checkPronunciation } from '../services/geminiService';

interface Props {
  result: PolyglotResponse;
  isDarkMode: boolean;
}

const ResultDisplay: React.FC<Props> = ({ result, isDarkMode }) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Practice Mode State
  const [isPracticing, setIsPracticing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState<{is_correct?: boolean; feedback?: string} | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Evolutionary Learning State
  const [isEvolving, setIsEvolving] = useState(false);
  const [suggestedTerm, setSuggestedTerm] = useState('');
  const [suggestedMeaning, setSuggestedMeaning] = useState('');
  const [isSubmittingEvolution, setIsSubmittingEvolution] = useState(false);
  const [evolutionSuccess, setEvolutionSuccess] = useState(false);
  const [learnedTermsForRegion, setLearnedTermsForRegion] = useState<UserSuggestion[]>([]);

  useEffect(() => {
    if (result.confidence_score !== undefined) {
      const target = Math.round(result.confidence_score * 100);
      setAnimatedScore(0);
      const timer = setTimeout(() => setAnimatedScore(target), 100);
      return () => clearTimeout(timer);
    }
  }, [result.confidence_score]);

  useEffect(() => {
    // Load existing community terms for this region
    const stored = localStorage.getItem('pulse_learned_lexicon');
    if (stored) {
      try {
        const items: UserSuggestion[] = JSON.parse(stored);
        setLearnedTermsForRegion(items.filter(i => i.region.toLowerCase() === result.detected_region.toLowerCase()));
      } catch (e) {
        console.error("Failed to parse lexicon", e);
      }
    }
  }, [result.detected_region, evolutionSuccess]);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const startPracticeRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setIsEvaluating(true);
        try {
          const evalResult = await checkPronunciation(blob, result.result_word, result.detected_region);
          setPracticeFeedback({
            is_correct: evalResult.is_correct,
            feedback: evalResult.feedback
          });
        } catch (err) {
          alert("Evaluation failed.");
        } finally {
          setIsEvaluating(false);
        }
      };
      recorder.start();
      setIsRecording(true);
      setPracticeFeedback(null);
    } catch (err) {
      alert("Microphone access denied.");
    }
  };

  const stopPracticeRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmitEvolution = async () => {
    if (!suggestedTerm || !suggestedMeaning) return;
    setIsSubmittingEvolution(true);
    
    const newSuggestion: UserSuggestion = {
      region: result.detected_region,
      concept: suggestedMeaning,
      term: suggestedTerm
    };

    try {
      const existing = localStorage.getItem('pulse_learned_lexicon');
      const list: UserSuggestion[] = existing ? JSON.parse(existing) : [];
      list.push(newSuggestion);
      localStorage.setItem('pulse_learned_lexicon', JSON.stringify(list));
      
      setEvolutionSuccess(true);
      setTimeout(() => {
        setIsEvolving(false);
        setEvolutionSuccess(false);
        setSuggestedTerm('');
        setSuggestedMeaning('');
      }, 3000);
    } catch (err) {
      alert("Failed to update memory.");
    } finally {
      setIsSubmittingEvolution(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-400';
    if (score >= 50) return 'bg-amber-400';
    return 'bg-rose-400';
  };

  const CopyButton = ({ text, id }: { text: string; id: string }) => (
    <button
      onClick={(e) => { e.stopPropagation(); copyToClipboard(text, id); }}
      className={`p-2 rounded-lg transition-all transform active:scale-90 ${
        isDarkMode ? 'bg-white/10 hover:bg-white/20 text-indigo-300' : 'bg-slate-100 hover:bg-slate-200 text-indigo-600'
      }`}
      title="Copy to clipboard"
    >
      {copiedKey === id ? (
        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Primary Header Card */}
      <div className={`rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl relative overflow-hidden transition-all duration-500 ${isDarkMode ? 'bg-gradient-to-br from-indigo-900 via-slate-900 to-black' : 'bg-gradient-to-br from-indigo-700 via-violet-900 to-fuchsia-900'}`}>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl"></div>

        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10 relative z-10">
          <div className="space-y-2">
            <span className="text-indigo-200 text-xs font-black uppercase tracking-[0.2em] bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md inline-block">
              {result.mode === 'transcription' ? 'Acoustic Fingerprint Identified' : 'Dialect Lexicon Match'}
              {result.is_evolutionary_match && (
                <span className="ml-2 text-amber-400 border-l border-white/20 pl-2">Learned Variant ✨</span>
              )}
            </span>
            <h3 className="text-4xl font-black mt-4 tracking-tight drop-shadow-xl">{result.detected_region}</h3>
          </div>

          {result.confidence_score !== undefined && (
            <div className="w-full md:w-64 bg-white/5 backdrop-blur-2xl p-5 rounded-3xl border border-white/10 shadow-2xl space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 opacity-70">Detection Confidence</span>
                <span className={`text-2xl font-black tabular-nums ${animatedScore >= 80 ? 'text-green-400' : animatedScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {animatedScore}%
                </span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-out rounded-full ${getScoreColor(animatedScore)}`}
                  style={{ width: `${animatedScore}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-center relative z-10">
          <div className="lg:col-span-7 space-y-8">
            <div className="relative group">
              <div className="absolute -inset-4 bg-white/5 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-3 pr-4">
                  <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-ping"></span>
                    Primary Target Term
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsPracticing(!isPracticing)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        isPracticing 
                          ? 'bg-indigo-400 border-indigo-300 text-white' 
                          : 'bg-white/10 border-white/10 text-indigo-200 hover:bg-white/20'
                      }`}
                    >
                      {isPracticing ? 'Close Practice' : 'Practice Pronunciation'}
                    </button>
                    <CopyButton text={result.result_word} id="main-term" />
                  </div>
                </div>
                <div className="inline-flex flex-col">
                  <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-[0_8px_16px_rgba(0,0,0,0.4)] select-all transition-transform duration-300 group-hover:scale-[1.02]">
                    {result.result_word}
                  </h2>
                  <div className="h-3 w-full bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-transparent rounded-full opacity-40 blur-[2px] -mt-3"></div>
                </div>
              </div>
            </div>

            {isPracticing && (
              <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[2rem] border border-white/20 animate-in zoom-in-95 duration-300">
                <p className="text-white text-xs font-black uppercase tracking-widest mb-4">Voice Check: {result.result_word}</p>
                <div className="flex items-center gap-6">
                  <button
                    onMouseDown={startPracticeRecording}
                    onMouseUp={stopPracticeRecording}
                    onTouchStart={startPracticeRecording}
                    onTouchEnd={stopPracticeRecording}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                      isRecording ? 'bg-red-500 scale-110 shadow-lg' : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                  >
                    {isRecording ? (
                      <div className="w-6 h-6 bg-white rounded-sm animate-pulse"></div>
                    ) : (
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1">
                    {isEvaluating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <p className="text-white/60 text-sm font-bold animate-pulse">Evaluating Resonance...</p>
                      </div>
                    ) : practiceFeedback ? (
                      <div className={`p-4 rounded-2xl ${practiceFeedback.is_correct ? 'bg-green-500/20 border border-green-500/30' : 'bg-rose-500/20 border border-rose-500/30'}`}>
                        <div className="flex items-center gap-2 mb-1">
                           <span className={`text-xs font-black uppercase tracking-widest ${practiceFeedback.is_correct ? 'text-green-400' : 'text-rose-400'}`}>
                             {practiceFeedback.is_correct ? 'Accurate!' : 'Needs Adjustment'}
                           </span>
                        </div>
                        <p className="text-white text-sm leading-snug">{practiceFeedback.feedback}</p>
                      </div>
                    ) : (
                      <p className="text-indigo-200 text-sm italic">Hold to record yourself saying "{result.result_word}"</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-md shadow-inner group transition-all hover:bg-white/10">
              <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Linguistic Context</p>
              <p className="text-2xl md:text-3xl font-medium leading-tight text-indigo-50 tracking-tight">
                {result.contextual_meaning}
              </p>
              
              {/* Variant Cluster - Quick Alternative Access */}
              {result.terms_identified && result.terms_identified.length > 0 && (
                <div className="mt-8 animate-in slide-in-from-left-4 duration-500 delay-200">
                  <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Dialect Synonyms & Variants
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.terms_identified.map((term, i) => (
                      <span 
                        key={i} 
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-xs font-bold text-white transition-all cursor-default"
                        title={term.meaning}
                      >
                        {term.word}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="lg:col-span-5 bg-black/30 rounded-[2.5rem] p-10 border border-white/10 backdrop-blur-md shadow-2xl flex flex-col justify-center items-center text-center group">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-400/30 rotate-3 group-hover:rotate-12 transition-transform">
              <svg className="w-8 h-8 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </div>
            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Phonetic Signature</p>
            <p className="text-4xl font-mono text-white italic font-black tracking-widest bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
              {result.phonetic_hint}
            </p>
            <p className="text-indigo-300/40 text-[10px] mt-6 uppercase tracking-[0.2em] font-bold">Resonance Analysis Complete</p>
          </div>
        </div>
      </div>

      {/* Evolutionary Learning Widget */}
      <div className={`rounded-[2.5rem] shadow-xl border overflow-hidden transition-all duration-500 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        {!isEvolving ? (
          <button 
            onClick={() => setIsEvolving(true)}
            className={`w-full p-8 flex items-center justify-between group transition-all ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-indigo-50/50'}`}
          >
            <div className="flex items-center gap-6">
              <div className="bg-amber-500 p-4 rounded-2xl shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="text-left">
                <h4 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Evolutionary Contribution</h4>
                <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Know a better word or alternative meaning for {result.detected_region}?</p>
              </div>
            </div>
            <svg className="w-6 h-6 text-slate-400 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        ) : (
          <div className="p-10 animate-in slide-in-from-top-4 duration-500">
            {evolutionSuccess ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-2xl font-black text-green-500">Memory Updated</h4>
                <p className="text-slate-500 text-center">Your knowledge has been integrated into the Polyglot Pulse evolutionary lexicon for {result.detected_region}.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-8">
                  <h4 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Refine Dialect Core</h4>
                  <button onClick={() => setIsEvolving(false)} className="text-slate-400 hover:text-rose-500">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Target Concept (What does it mean?)</label>
                    <input 
                      type="text"
                      value={suggestedMeaning}
                      onChange={(e) => setSuggestedMeaning(e.target.value)}
                      placeholder="e.g. A beautiful lady"
                      className={`w-full px-5 py-3 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Alternative Regional Term</label>
                    <input 
                      type="text"
                      value={suggestedTerm}
                      onChange={(e) => setSuggestedTerm(e.target.value)}
                      placeholder="e.g. Leng"
                      className={`w-full px-5 py-3 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    />
                  </div>
                  
                  <div className={`p-5 rounded-2xl text-sm italic ${isDarkMode ? 'bg-indigo-900/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
                    Note: Your suggestion for <strong>{result.detected_region}</strong> will be stored locally and used to improve future analysis within this session.
                  </div>

                  <button 
                    onClick={handleSubmitEvolution}
                    disabled={isSubmittingEvolution || !suggestedTerm || !suggestedMeaning}
                    className="w-full bg-amber-500 text-white py-4 rounded-xl font-black text-lg hover:bg-amber-600 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    {isSubmittingEvolution ? 'Integrating Lexicon...' : 'Evolve AI Memory'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* List of other community learned terms for this region */}
        {learnedTermsForRegion.length > 0 && !isEvolving && (
          <div className={`px-10 pb-10 pt-4 border-t transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-50 bg-slate-50/50'}`}>
            <h5 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Also from Community Knowledge:</h5>
            <div className="flex flex-wrap gap-2">
              {learnedTermsForRegion.map((item, i) => (
                <div key={i} className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all hover:scale-105 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-indigo-300' : 'bg-white border-slate-200 text-indigo-700'}`}>
                  <span className="opacity-50 font-medium">{item.concept}:</span> {item.term}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cultural Insight Card */}
      <div className={`rounded-[2.5rem] shadow-xl border p-10 flex flex-col md:flex-row gap-8 items-start transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="bg-indigo-600 p-5 rounded-[1.5rem] shadow-2xl shadow-indigo-500/30 shrink-0">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="space-y-4">
          <h4 className="text-indigo-600 font-black text-xs uppercase tracking-[0.3em]">Ethno-Linguistic Discovery</h4>
          <p className={`text-xl md:text-2xl leading-relaxed font-semibold italic transition-colors ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            "{result.fun_fact}"
          </p>
        </div>
      </div>

      {/* Lexicon Variants Table - Primary for Reverse Lookup */}
      {result.terms_identified && result.terms_identified.length > 0 && (
        <div className={`rounded-[3rem] shadow-2xl border overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className={`px-12 py-8 border-b flex items-center justify-between transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-50'}`}>
            <h4 className={`font-black text-sm uppercase tracking-[0.3em] transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-900'}`}>
              {result.mode === 'reverse_lookup' ? 'All Regional Matches Found' : 'Lexical Markers Detected'}
            </h4>
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest transition-colors ${isDarkMode ? 'bg-slate-800 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>
              {result.terms_identified.length} VARIANTS IDENTIFIED
            </span>
          </div>
          <div className={`divide-y transition-colors ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {result.terms_identified.map((term, idx) => (
              <div key={idx} className={`p-12 transition-all group ${isDarkMode ? 'hover:bg-slate-900' : 'hover:bg-slate-50'}`}>
                <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
                  <div className="flex items-center gap-4">
                    <span className={`px-6 py-3 rounded-2xl text-xl font-black shadow-md transition-all duration-300 transform group-hover:-translate-y-1 ${isDarkMode ? 'bg-slate-800 border-2 border-indigo-900 text-indigo-300 group-hover:bg-indigo-600 group-hover:text-white' : 'bg-white border-2 border-indigo-100 text-indigo-700 group-hover:border-indigo-400 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                      {term.word}
                    </span>
                    <CopyButton text={term.word} id={`lexicon-${idx}`} />
                  </div>
                  <div className="flex items-center gap-4 text-slate-500 group-hover:text-indigo-500 transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Global / Standard equivalent</span>
                      <span className={`text-base font-black uppercase tracking-widest transition-colors ${isDarkMode ? 'text-slate-300' : 'text-slate-900'}`}>
                        {term.standard_equivalent}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className={`text-xl leading-relaxed max-w-3xl transition-colors font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {term.meaning}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase tracking-widest ${isDarkMode ? 'border-slate-800 text-slate-600' : 'border-slate-100 text-slate-400'}`}>
                      {term.word.toLowerCase() === result.result_word.toLowerCase() ? 'Primary Match' : 'Related Concept'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transcription Grid */}
      {result.transcription && (
        <div className={`rounded-[2.5rem] shadow-sm border p-10 transition-colors duration-500 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="flex justify-between items-center mb-6">
            <h4 className={`font-black text-xs uppercase tracking-[0.3em] flex items-center gap-3 transition-colors ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
              <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
              Verbatim Transcription
            </h4>
            <CopyButton text={result.transcription} id="transcription-text" />
          </div>
          <div className="relative">
            <div className={`absolute top-0 left-0 w-1.5 h-full rounded-full transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
            <p className={`text-3xl italic font-bold leading-relaxed pl-10 py-2 transition-colors tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              {result.transcription}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;
