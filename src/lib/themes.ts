export const themes = [
  {
    id: 'obsidian',
    name: 'Obsidian',
    note: 'A little less noise. A lot more focus.',
    bg: '#0B0D0F',
    surface: '#1E2226',
    accent: '#C5F277',
    text: '#F5F5F5',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    note: 'For your late-night lightbulb moments.',
    bg: '#0B1120',
    surface: '#1B2942',
    accent: '#9BBFFF',
    text: '#F1F5FF',
  },
  {
    id: 'plum',
    name: 'Plum',
    note: 'A fresh perspective, in full color.',
    bg: '#170F22',
    surface: '#30213E',
    accent: '#D9B8FF',
    text: '#FAF3FF',
  },
  {
    id: 'forest',
    name: 'Forest',
    note: 'Room to breathe. Space to grow.',
    bg: '#0B1914',
    surface: '#1C3329',
    accent: '#9DE8BD',
    text: '#F0FFF5',
  },
  {
    id: 'rose',
    name: 'Rose',
    note: 'Make a little room for possibility.',
    bg: '#211016',
    surface: '#3D242E',
    accent: '#FFB3CD',
    text: '#FFF3F6',
  },
  {
    id: 'ivory',
    name: 'Ivory',
    note: 'A clean page for your next big idea.',
    bg: '#F8F6EF',
    surface: '#FFFFFF',
    accent: '#355C36',
    text: '#20271E',
  },
] as const;
export type Theme = (typeof themes)[number]['id'];
export function validTheme(value: unknown): Theme {
  return themes.find((t) => t.id === value)?.id ?? 'obsidian';
}
