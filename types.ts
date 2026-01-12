
export interface TermIdentified {
  word: string;
  meaning: string;
  standard_equivalent: string;
}

export interface UserSuggestion {
  region: string;
  concept: string;
  term: string;
}

export interface PolyglotResponse {
  mode: 'transcription' | 'reverse_lookup' | 'pronunciation_check';
  detected_region: string;
  result_word: string;
  contextual_meaning: string;
  phonetic_hint: string;
  fun_fact: string;
  transcription?: string;
  terms_identified?: TermIdentified[];
  confidence_score?: number;
  is_correct?: boolean;
  feedback?: string;
  is_evolutionary_match?: boolean; // Marker for terms learned from user input
}

export type DialectCategory = 'English' | 'Portuguese' | 'Spanish' | 'French' | 'Arabic' | 'Mandarin' | 'Dutch' | 'German' | 'Hindi' | 'Swahili';

export interface DialectOption {
  label: string;
  value: string;
}

export const DIALECT_MAP: Record<DialectCategory, DialectOption[]> = {
  English: [
    { label: 'Nigerian (Pidgin/Standard)', value: 'Nigerian' },
    { label: 'Kenyan (Sheng/Standard)', value: 'Kenyan' },
    { label: 'Canadian English', value: 'Canadian' },
    { label: 'Australian English', value: 'Australian' },
    { label: 'UK English', value: 'UK' },
    { label: 'US English', value: 'US' },
  ],
  Portuguese: [
    { label: 'Angola/Mozambique (African)', value: 'Angola/Mozambique' },
    { label: 'Brazil (LatAm)', value: 'Brazil' },
    { label: 'Portugal (Europe)', value: 'Portugal' },
  ],
  Spanish: [
    { label: 'Equatorial Guinea (African)', value: 'Equatorial Guinea' },
    { label: 'Mexico/Colombia (LatAm)', value: 'LatAm Spanish' },
    { label: 'Spain (Castilian)', value: 'Spain' },
  ],
  French: [
    { label: 'Senegal/Ivory Coast (African)', value: 'Senegal/Ivory Coast' },
    { label: 'Haiti (Caribbean)', value: 'Haiti' },
    { label: 'France (Metropolitan)', value: 'France' },
  ],
  Arabic: [
    { label: 'Egyptian (Masri)', value: 'Egyptian' },
    { label: 'Levantine (Shami)', value: 'Levantine' },
    { label: 'Gulf (Khaleeji)', value: 'Gulf' },
    { label: 'Maghrebi (Darija)', value: 'Maghrebi' },
  ],
  Mandarin: [
    { label: 'Mainland China (Standard)', value: 'Mainland Standard' },
    { label: 'Taiwanese Mandarin', value: 'Taiwanese' },
    { label: 'Singaporean/Malaysian Mandarin', value: 'Singaporean/Malaysian' },
  ],
  Dutch: [
    { label: 'Netherlands (Standard)', value: 'Netherlands' },
    { label: 'Flemish (Belgium)', value: 'Flemish' },
  ],
  German: [
    { label: 'Germany (Standard)', value: 'Standard German' },
    { label: 'Austrian German', value: 'Austrian' },
    { label: 'Swiss German (Schwiizertüütsch)', value: 'Swiss' },
  ],
  Hindi: [
    { label: 'Standard Hindi (Khari Boli)', value: 'Standard Hindi' },
    { label: 'Mumbai/Bambaiya Hindi', value: 'Bambaiya Hindi' },
    { label: 'Braj Bhasha/Traditional', value: 'Braj/Traditional' },
  ],
  Swahili: [
    { label: 'Tanzania (Kiswahili Sanifu)', value: 'Tanzanian Swahili' },
    { label: 'Kenya (Standard/Sheng)', value: 'Kenyan Swahili' },
    { label: 'Comoros (Shikomori)', value: 'Comorian Shikomori' },
    { label: 'D.R. Congo (Kingwana)', value: 'Congolese Swahili' },
    { label: 'Uganda (Regional Swahili)', value: 'Ugandan Swahili' },
    { label: 'Somalia (Bravanese/Swahili)', value: 'Somali Swahili' },
    { label: 'Mozambique (Regional Swahili)', value: 'Mozambican Swahili' },
    { label: 'Rwanda/Burundi (Regional Swahili)', value: 'Rwandan/Burundian Swahili' },
    { label: 'Malawi/Zambia (Regional Swahili)', value: 'Malawian/Zambian Swahili' },
  ],
};
