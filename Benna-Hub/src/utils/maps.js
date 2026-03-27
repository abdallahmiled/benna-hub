/**
 * Google Maps : seules les URLs d’intégration (/maps/embed?...) s’affichent dans un <iframe>.
 * Les liens « Partager » classiques sont bloqués par Google (cadre vide).
 */
export function getMapPreviewState(raw) {
  if (!raw || !String(raw).trim()) {
    return { embedSrc: null, externalUrl: null, hint: null };
  }

  let text = String(raw).trim();
  const iframeMatch = text.match(/src\s*=\s*["']([^"']+)["']/i);
  let url = iframeMatch ? iframeMatch[1] : text;
  url = url.replace(/&amp;/gi, '&').trim();

  const isGoogleMaps = /google\.[\w.]+\/maps|maps\.google\.com/i.test(url);

  const isEmbed =
    /\/maps\/embed\b/i.test(url) ||
    /\/maps\?.*\boutput=embed\b/i.test(url) ||
    /\bembed\b.*google.*maps/i.test(url);

  if (isEmbed && (url.startsWith('http://') || url.startsWith('https://'))) {
    return { embedSrc: url, externalUrl: url, hint: null };
  }

  if (isGoogleMaps && (url.startsWith('http://') || url.startsWith('https://'))) {
    return {
      embedSrc: null,
      externalUrl: url,
      hint: 'Ce lien ne s’affiche pas dans la page. Sur Google Maps : Partager → Intégrer une carte → copiez le code iframe (ou l’URL qui contient /maps/embed).'
    };
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return { embedSrc: url, externalUrl: url, hint: null };
  }

  return { embedSrc: null, externalUrl: null, hint: null };
}

/** URL à enregistrer en base (iframe embed si possible, sinon lien classique). */
export function extractMapUrlForStorage(raw) {
  const s = getMapPreviewState(raw);
  return s.embedSrc || s.externalUrl || '';
}
