import fuzzysort from 'fuzzysort';

const INITIAL_LOCALITIES = [
  'Doboka',
  'Niz Doboka',
  'Doboka Bypass',
  'Kordoba',
  'Kodoba',
  'College Road',
  'Masjid Road',
  'Lumding Road',
  'Diphu Road',
  'Islampur',
  'SBI Doboka',
  'NH54',
  'Hojai',
  'Nagaon',
  'Jamunamukh',
  'Lanka'
];

export class AddressEngine {
  private localities: Set<string>;

  constructor() {
    this.localities = new Set(INITIAL_LOCALITIES);
    if (typeof localStorage !== 'undefined') {
      this.loadLearnedLocalities();
    }
  }

  private loadLearnedLocalities() {
    const stored = localStorage.getItem('learned_localities_v2');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        parsed.forEach((l: string) => this.localities.add(l));
      } catch (e) {
        console.error('Failed to parse learned localities');
      }
    }
  }

  private saveLocalities() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('learned_localities_v2', JSON.stringify(Array.from(this.localities)));
    }
  }

  public recognizeArea(address: string, landmark: string = ''): string {
    const combined = `${address} ${landmark}`.toLowerCase();

    // Exact match first (longest first)
    const sortedLocalities = Array.from(this.localities).sort((a, b) => b.length - a.length);

    for (const locality of sortedLocalities) {
      if (combined.includes(locality.toLowerCase())) {
        return locality;
      }
    }

    // Fuzzy match
    const results = fuzzysort.go(combined, sortedLocalities, {
      limit: 1,
      threshold: -500,
    });

    if (results.length > 0) {
      return results[0].target;
    }

    return 'Other';
  }

  public learnLocality(locality: string) {
    if (locality && locality.length >= 3) {
      this.localities.add(locality);
      this.saveLocalities();
    }
  }

  public getAllLocalities(): string[] {
    return Array.from(this.localities);
  }
}

export const addressEngine = new AddressEngine();
