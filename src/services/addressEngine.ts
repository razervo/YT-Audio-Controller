import fuzzysort from 'fuzzysort';

const INITIAL_LOCALITIES = [
  'Doboka',
  'Niz Doboka',
  'Kodoba',
  'Islampur',
  'Doboka Bypass',
  'College Road',
  'Masjid Road',
  'Lumding Road',
  'Diphu Road',
  'Hojai',
  'Nagaon'
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
    const stored = localStorage.getItem('learned_localities');
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.forEach((l: string) => this.localities.add(l));
    }
  }

  private saveLocalities() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('learned_localities', JSON.stringify(Array.from(this.localities)));
    }
  }

  public recognizeArea(address: string): string | null {
    const normalizedAddr = address.toLowerCase();

    // Sort localities by length descending so "Niz Doboka" is matched before "Doboka"
    const sortedLocalities = Array.from(this.localities).sort((a, b) => b.length - a.length);

    for (const locality of sortedLocalities) {
      if (normalizedAddr.includes(locality.toLowerCase())) {
        return locality;
      }
    }

    const results = fuzzysort.go(address, sortedLocalities, {
      limit: 1,
    });

    if (results.length > 0 && results[0].score > -1000) {
      return results[0].target;
    }

    return null;
  }

  public learnLocality(locality: string) {
    if (locality && locality.length > 3) {
      this.localities.add(locality);
      this.saveLocalities();
    }
  }

  public getAllLocalities(): string[] {
    return Array.from(this.localities);
  }
}

export const addressEngine = new AddressEngine();
