// The “d / 摘录” stamp: a lowercase d enclosing a quotation mark.
// Keep the header, login page and generated favicon on the same geometry.
export const brand = {
  ink: '#344936',
  paper: '#f8f5e9',
  accent: '#c4cf9a',
  tile: 'M16 0H48Q64 0 64 16V43Q64 64 43 64H16Q0 64 0 48V16Q0 0 16 0Z',
  letter: 'M42 10H52V36C52 48 44 55 32 55S12 48 12 36S20 17 32 17H42V27H32C25.5 27 22 30 22 36S25.5 45 32 45S42 42 42 36V10Z',
  quote: 'M31 29C28.5 29 27 30.5 27 33S28.5 37 31 37C30.5 38.5 29 40 27 41L29 43C33.5 40.5 36 37.5 36 33C36 30.5 34 29 31 29Z',
};
export const BRAND_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><path fill="${brand.ink}" d="${brand.tile}"/><path fill="${brand.paper}" d="${brand.letter}"/><path fill="${brand.accent}" d="${brand.quote}"/></svg>`;
export const BRAND_ICON_URL = '/favicon.svg?v=excerpt-1';
