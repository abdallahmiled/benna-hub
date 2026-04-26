/**
 * Valeurs stockées en base (Restaurant.delegation / Cafe.delegation) — معتمديات ولاية قابس.
 * Les libellés affichés passent par i18n : clé `delegation_${value}`.
 */
export const GABES_DELEGATIONS = [
  { value: 'gabes_ville' },
  { value: 'gabes_nord' },
  { value: 'gabes_sud' },
  { value: 'bouchemma' },
  { value: 'ghannouch' },
  { value: 'el_nahal' },
  { value: 'el_hamma' },
  { value: 'chenini' },
  { value: 'el_metouia' },
  { value: 'oudhref' },
];

export function translateDelegation(t, value) {
  if (!value) return '';
  const key = `delegation_${value}`;
  const label = t(key);
  return label === key ? String(value).replace(/_/g, ' ') : label;
}
