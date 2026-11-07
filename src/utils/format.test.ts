import { describe, expect, it } from 'vitest';
import { clamp, formatRuntime } from './format';

describe('clamp', () => {
  it('membatasi nilai ke rentang', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });
});

describe('formatRuntime', () => {
  it('memformat jam dan menit', () => {
    expect(formatRuntime(173)).toBe('2j 53m');
    expect(formatRuntime(45)).toBe('45m');
  });
  it('mengembalikan string kosong bila tidak ada durasi', () => {
    expect(formatRuntime(null)).toBe('');
    expect(formatRuntime(0)).toBe('');
  });
});
