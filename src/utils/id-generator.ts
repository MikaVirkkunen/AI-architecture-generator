/**
 * ID Generator for Draw.io elements
 * Generates unique IDs for mxCell elements
 */

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function generateId(length: number = 20): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateCellId(prefix?: string): string {
  const id = generateId(20);
  return prefix ? `${prefix}-${id}` : id;
}

let counter = 0;

export function generateSequentialId(prefix: string = 'cell'): string {
  return `${prefix}-${++counter}`;
}

export function resetCounter(): void {
  counter = 0;
}
