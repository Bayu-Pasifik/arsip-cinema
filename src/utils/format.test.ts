import { describe, expect, it } from 'vitest';
import { clamp, formatDate, formatMoney, formatRuntime, statusLabel } from './format';

describe('formatDate', () => {
  it('memformat tanggal ISO ke bahasa Indonesia', () => {
    expect(formatDate('2024-03-01')).toBe('1 Maret 2024');
  });
  it('mengembalikan string kosong untuk masukan tak valid', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('2024')).toBe('');
  });
});

describe('formatMoney', () => {
  it('meringkas jutaan dan miliaran', () => {
    expect(formatMoney(165_000_000)).toBe('$165 jt');
    expect(formatMoney(1_200_000_000)).toBe('$1,2 M');
  });
  it('0 atau kosong = tidak diketahui', () => {
    expect(formatMoney(0)).toBe('');
    expect(formatMoney(undefined)).toBe('');
  });
});

describe('statusLabel', () => {
  it('menerjemahkan status TMDB dan meneruskan yang tak dikenal', () => {
    expect(statusLabel('Released')).toBe('Sudah rilis');
    expect(statusLabel('Whatever')).toBe('Whatever');
    expect(statusLabel(undefined)).toBe('');
  });
});

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
