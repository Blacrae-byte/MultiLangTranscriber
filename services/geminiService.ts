
import { GoogleGenAI, Type } from "@google/genai";
import { PolyglotResponse, UserSuggestion } from "../types";

// Helper to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Local learning simulation
const getLearnedContext = (): string => {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem('pulse_learned_lexicon');
  if (!stored) return '';
  try {
    const items: UserSuggestion[] = JSON.parse(stored);
    return `
EVOLUTIONARY MEMORY (User-learned variants):
The following terms have been contributed by the community and should be prioritized or included:
${items.map(i => `- In ${i.region}, the concept of "${i.concept}" is also known as "${i.term}".`).join('\n')}
    `;
  } catch {
    return '';
  }
};

// Client-side verification for evolutionary matches
const verifyEvolutionaryMatch = (response: PolyglotResponse): PolyglotResponse => {
  if (typeof window === 'undefined') return response;
  const stored = localStorage.getItem('pulse_learned_lexicon');
  if (!stored) return response;
  try {
    const items: UserSuggestion[] = JSON.parse(stored);
    const isMatch = items.some(item => 
      item.region.toLowerCase() === response.detected_region.toLowerCase() &&
      item.term.toLowerCase() === response.result_word.toLowerCase()
    );
    return { ...response, is_evolutionary_match: isMatch || response.is_evolutionary_match };
  } catch {
    return response;
  }
};

const LINGUISTIC_MATRIX = `
KNOWLEDGE BASE:
- ENGLISH:
  * UK: Biscuit (snack), Lorry (vehicle), Mate/Lad (friend), Quid (money), Knackered (tired).
  * US: Cookie (snack), Truck (vehicle), Buddy/Dude (friend), Buck (money), Beat (tired).
  * Nigerian: Small chops (snack), Danfo (bus), Padi/Guy/Oga (friend/boss), Akara (bean cake).
  * Kenyan: Bite (snack), Matatu (bus), Msee/Rada (friend/vibe), Nyama Choma (roasted meat).
  * Australian: Bikkie (snack), Ute (truck), Cobber/Mate (friend), Barbie (BBQ), Arvo (afternoon).
- PORTUGUESE:
  * Portugal: Autocarro (bus), Gelado (ice cream), Fixe/Giro (cool), Puto (boy), Bica (coffee), Carago (expletive/emphasis).
  * Brazil: Ônibus (bus), Sorvete (ice cream), Legal/Massa (cool), Mano/Cara (bro), Grana (money), Busão (bus).
  * Angola: Machimbombo/Candongueiro (bus/taxi), Gelado (ice cream), Mambo (thing/vibe), Kwanza (money), Bue (very/lots).
- FRENCH:
  * France: Bagnole (car), Bouffer (eat), Meuf (girl - verlan), Ouf (crazy - verlan), Bosser (work), Thune (money).
  * Senegal/Ivory Coast (African): Enjailler (to party/enjoy), Une go (girl), Le pia/pon (money), Daba (eat), S'envoler (to leave).
  * Haiti/Caribbean: Chèche (look for), Degage (get by), Bagay (thing), Zen (gossip/news), Ti moun (child).
- SPANISH:
  * Spain: Curro (work), Pasta/Pelas (money), Guay/Mola (cool), Tío (dude), Coche (car), Caña (beer).
  * Mexico: Chamba (work), Lana (money), Chido/Padre (cool), Guey/Compa (dude), Chela (beer), Neta (truth).
  * Colombia: Camello (work), Plata (money), Bacano/Chévere (cool), Parce (friend), Tinto (black coffee), Pola (beer).
  * Argentina/Uruguay: Laburo (work), Guita (money), Copado (cool), Pibe/Che (boy/dude), Bondi (bus), Morfar (eat).
  * Equatorial Guinea: El tapi (taxi), La tori (gossip), Antéose (I don't know), ¿Ustin? (What?).
- ARABIC:
  * Egyptian: Ezayyak (How are you), Arabeyya (Car), Mabsoot (Happy), Ful (beans/great).
  * Levantine: Kifak (How are you), Sayyara (Car), Mabsoot (Happy), Waynak (Where are you).
  * Gulf: Shlonik (How are you), Motar (Car), Mastanas (Happy), Kashkha (elegant).
  * Maghrebi: Labas (How are you), Tonobil (Car), Farhan (Happy), Daba (Now - Moroccan).
- MANDARIN:
  * Mainland: Gōngjiāochē (Bus), Tǔdòu (Potato), Ruǎnjiàn (Software), Niúbì (Awesome).
  * Taiwan: Gōngchē (Bus), Mǎlíngshǔ (Potato), Rùnjiàn (Software), Chao-cool (Very cool).
  * Singapore/Malaysia: Bāshì (Bus), Kentang (Potato), Auntie/Uncle (Honorifics), Shiok (Great pleasure).
- DUTCH:
  * Netherlands: Patat (Fries), Lopen (Walk/Run), Pinpas (Debit card), Gezellig (cozy/sociable).
  * Flemish: Frieten (Fries), Stappen (Walk), Bankkaart (Debit card), Toffe (cool).
- GERMAN:
  * Germany: Fahrrad (Bike), Brötchen (Roll), Tschüss (Bye), Kohle (money).
  * Austria: Radl (Bike), Semmel (Roll), Servus (Hello/Bye), Pickerl (sticker).
  * Swiss: Velo (Bike), Weggli (Roll), Adieu/Uf Wiederluege (Bye), Znüni (9am snack).
- HINDI:
  * Standard: Dost (Friend), Paise (Money), Swadisht (Tasty).
  * Bambaiya (Mumbai): Bantai/Public (Friend/People), Rokda (Money), Jhakaas (Tasty/Excellent), Khoka (crore).
  * Traditional/Braj: Sakha (Friend), Mudra (Money).
- SWAHILI VARIANTS:
  * Tanzania (Sanifu): Rafiki (Friend), Safi (Cool/Good), Daladala (Bus).
  * Kenya (Sheng): Maze/Msee (Friend), Poa (Cool/Good), Matatu (Bus), Nguna (money).
  * Comoros (Shikomori): Marahaba (Thank you), Ndugu (Relative/Friend).
  * DRC (Kingwana): Rafiki/Ndugu (Friend), Gari (Car), Machindano (Competition).
`;

const getSystemInstruction = () => `
You are the "Dialect Detective" API. Your purpose is to bridge the gap between global languages and their specific regional "souls." 

OPERATIONAL LOGIC:
1. VOICE-TO-MEANING (Audio): Analyze cadence and vocabulary. Identify dialect precisely, transcribe, and highlight regional terms.
2. MEANING-TO-WORD (Reverse Lookup): Exhaustively provide ALL known regional terms for a definition in a specific variant. This includes official dictionary words, local slang, and evolutionary community-learned terms.
3. PRONUNCIATION EVALUATION: Compare user audio against a target regional word.

LANGUAGE VARIANTS MATRIX:
${LINGUISTIC_MATRIX}

${getLearnedContext()}

RULES:
- When performing a Reverse Lookup, DO NOT return just one word. Return a comprehensive list of all applicable terms (Official and Slang).
- Place the most descriptive or common term in 'result_word'.
- List EVERY OTHER variation, slang, or official name in the 'terms_identified' array.
- For is_evolutionary_match: set to true if the result_word matches a term in the EVOLUTIONARY MEMORY context provided.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    mode: { type: Type.STRING, enum: ['transcription', 'reverse_lookup', 'pronunciation_check'] },
    detected_region: { type: Type.STRING },
    result_word: { type: Type.STRING, description: 'The primary or most common regional word found.' },
    contextual_meaning: { type: Type.STRING },
    phonetic_hint: { type: Type.STRING, description: 'Phonetic guide for the primary word.' },
    fun_fact: { type: Type.STRING, description: 'Cultural origin or fun fact about the term/dialect.' },
    transcription: { type: Type.STRING },
    confidence_score: { type: Type.NUMBER },
    is_correct: { type: Type.BOOLEAN, description: 'For pronunciation_check mode: is the pronunciation correct?' },
    feedback: { type: Type.STRING, description: 'For pronunciation_check mode: corrective feedback or praise.' },
    is_evolutionary_match: { type: Type.BOOLEAN, description: 'True if this term was retrieved from user-taught memory.' },
    terms_identified: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: 'The regional variation (official or slang).' },
          meaning: { type: Type.STRING, description: 'Brief context for this specific variant.' },
          standard_equivalent: { type: Type.STRING, description: 'The global/standard term for this concept.' },
        },
        required: ["word", "meaning", "standard_equivalent"]
      }
    }
  },
  required: ["mode", "detected_region", "result_word", "contextual_meaning", "phonetic_hint", "fun_fact"]
};

export const analyzeAudio = async (audioBlob: Blob): Promise<PolyglotResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await blobToBase64(audioBlob);

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: audioBlob.type || 'audio/wav' } },
        { text: "VOICE ANALYSIS MODE: Identify dialect, transcribe, and explain terms." }
      ]
    },
    config: {
      systemInstruction: getSystemInstruction(),
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA
    }
  });

  const parsed = JSON.parse(response.text.trim());
  return verifyEvolutionaryMatch({ ...parsed, mode: 'transcription' });
};

export const transcribeOnly = async (audioBlob: Blob): Promise<PolyglotResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await blobToBase64(audioBlob);

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: audioBlob.type || 'audio/wav' } },
        { text: "HIGH FIDELITY TRANSCRIPTION MODE: Focus strictly on accurate word-for-word transcription. Then attempt to deduce dialect as a secondary task." }
      ]
    },
    config: {
      systemInstruction: getSystemInstruction(),
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA
    }
  });

  const parsed = JSON.parse(response.text.trim());
  return verifyEvolutionaryMatch({ ...parsed, mode: 'transcription' });
};

export const checkPronunciation = async (audioBlob: Blob, targetWord: string, region: string): Promise<PolyglotResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = await blobToBase64(audioBlob);

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: audioBlob.type || 'audio/wav' } },
        { text: `PRONUNCIATION EVALUATION MODE: The user is attempting to say "${targetWord}" in the "${region}" dialect. Analyze their audio and determine if they are pronouncing it correctly for that specific region. Provide specific feedback.` }
      ]
    },
    config: {
      systemInstruction: getSystemInstruction(),
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA
    }
  });

  const parsed = JSON.parse(response.text.trim());
  return verifyEvolutionaryMatch({ ...parsed, mode: 'pronunciation_check' });
};

export const reverseLookup = async (meaning: string, dialect: string): Promise<PolyglotResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `REVERSE LOOKUP MODE: 
  Target Dialect: ${dialect}
  Description/Meaning: ${meaning}
  
  TASK:
  1. Identify EVERY known regional term for this concept in ${dialect}.
  2. Include official dictionary terms AND local slang (e.g., if someone says 'beautiful lady' in UK, include 'cracker', 'leng', 'fit', 'peng', etc.).
  3. Provide the most common/accepted one as 'result_word'.
  4. List ALL variations in 'terms_identified'.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: getSystemInstruction(),
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA
    }
  });

  const parsed = JSON.parse(response.text.trim());
  return verifyEvolutionaryMatch({ ...parsed, mode: 'reverse_lookup' });
};
