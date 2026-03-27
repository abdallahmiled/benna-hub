const stripDiacritics = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const normalizeSpaces = (s) => String(s || '').replace(/\s+/g, ' ').trim();

const normalizeArabic = (s) => {
  const v = String(s || '');
  return v
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '') // harakat
    .replace(/\u0640/g, '') // tatweel
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه');
};

const toBasic = (s) =>
  normalizeSpaces(
    normalizeArabic(stripDiacritics(String(s || '').toLowerCase()))
      .replace(/[’']/g, ' ')
      .replace(/[^0-9a-z\u0600-\u06FF\s]/gi, ' ')
  );

const AR_TO_LAT = [
  [/خ/g, 'kh'],
  [/غ/g, 'gh'],
  [/ش/g, 'ch'],
  [/ث/g, 'th'],
  [/ذ/g, 'dh'],
  [/ق/g, 'q'],
  [/ح/g, 'h'],
  [/ص/g, 's'],
  [/ض/g, 'd'],
  [/ط/g, 't'],
  [/ظ/g, 'z'],
  [/ع/g, 'a'],
  [/ء/g, ''],
  [/ا/g, 'a'],
  [/ب/g, 'b'],
  [/ت/g, 't'],
  [/ج/g, 'j'],
  [/د/g, 'd'],
  [/ر/g, 'r'],
  [/ز/g, 'z'],
  [/س/g, 's'],
  [/ف/g, 'f'],
  [/ك/g, 'k'],
  [/ل/g, 'l'],
  [/م/g, 'm'],
  [/ن/g, 'n'],
  [/ه/g, 'h'],
  [/و/g, 'w'],
  [/ي/g, 'y'],
];

const arabicToLatin = (s) => {
  let out = normalizeArabic(String(s || ''));
  for (const [re, rep] of AR_TO_LAT) out = out.replace(re, rep);
  return toBasic(out);
};

const SYNONYMS = [
  // foods
  { a: ['بيتزا', 'بيتزاا', 'pizza'], b: ['pizza'] },
  { a: ['برغر', 'بورغر', 'burger'], b: ['burger'] },
  { a: ['تاكوس', 'tacos'], b: ['tacos'] },
  { a: ['ساندويتش', 'سندويتش', 'sandwich'], b: ['sandwich'] },
  { a: ['شاورما', 'shawarma', 'chawarma'], b: ['shawarma', 'chawarma'] },
  { a: ['مقرونه', 'مكرونه', 'pates', 'pâtes', 'pasta'], b: ['pates', 'pasta'] },
  // places
  { a: ['مطعم', 'restaurant', 'resto'], b: ['restaurant', 'resto'] },
  { a: ['مقهى', 'قهوة', 'كافي', 'cafe', 'café', 'coffee'], b: ['cafe', 'coffee'] },
];

export const expandQueryVariants = (query) => {
  const q = toBasic(query);
  if (!q) return [];

  const variants = new Set([q]);

  // If Arabic letters, try a latin-ish transliteration too.
  if (/[\u0600-\u06FF]/.test(q)) variants.add(arabicToLatin(q));

  // Add synonym expansions.
  for (const s of SYNONYMS) {
    const all = [...new Set([...s.a, ...s.b])].map(toBasic).filter(Boolean);
    const hit = all.some((x) => q.includes(x));
    if (hit) for (const x of all) variants.add(x);
  }

  // Extra: split words to allow partial hits.
  for (const part of q.split(' ')) if (part.length >= 2) variants.add(part);

  return [...variants].filter(Boolean);
};

export const buildSearchEntryText = (parts) => toBasic(parts.filter(Boolean).join(' '));

export const searchEntries = (entries, query, limit = 20) => {
  const qs = expandQueryVariants(query);
  if (!qs.length) return [];

  const scored = [];
  for (const e of entries) {
    const hay = e._searchText || '';
    let best = 0;
    for (const q of qs) {
      if (!q) continue;
      if (hay === q) best = Math.max(best, 1000);
      else if (hay.startsWith(q)) best = Math.max(best, 600);
      else if (hay.includes(` ${q}`) || hay.includes(q)) best = Math.max(best, 300);
    }
    if (best > 0) scored.push({ e, s: best });
  }

  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map((x) => x.e);
};

