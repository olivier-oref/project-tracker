export const OWNER_COLORS = [
  '#B4531B', // rust-orange
  '#16233F', // navy
  '#1F6F5C', // forest green
  '#8B6914', // dark gold
  '#7B3B6E', // plum
  '#2E5984', // steel blue
  '#8C4A2F', // brown
  '#3D6B4F', // sage
  '#6B4E8B', // purple
  '#4A7C6B', // teal
  '#9B5B3A', // copper
  '#3B5E8C', // ocean blue
] as const;

export function getNextColor(usedCount: number): string {
  return OWNER_COLORS[usedCount % OWNER_COLORS.length];
}
