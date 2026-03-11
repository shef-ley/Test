export const DEFAULT_LEVEL = 4;

export const LEVELS = [
  { level: 7, title: 'Outstanding Job!', color: '#2e7d32' },
  { level: 6, title: 'Awesome Job!', color: '#1e88e5' },
  { level: 5, title: 'Great Job', color: '#8e24aa' },
  { level: 4, title: 'Ready to Learn', color: '#f9a825' },
  { level: 3, title: 'Think About It', color: '#fb8c00' },
  { level: 2, title: 'Consequence', color: '#ef6c00' },
  { level: 1, title: 'Parent Contact', color: '#d32f2f' },
] as const;

export type ActionType =
  | 'move up'
  | 'move down'
  | 'set level'
  | 'new day reset'
  | 'add student'
  | 'remove student'
  | 'edit student';
