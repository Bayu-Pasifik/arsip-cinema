import { describe, expect, it } from 'vitest';
import { crewGroups } from './crew';

const c = (id: number, name: string, job: string) => ({ id, name, job });

describe('crewGroups', () => {
  it('mengelompokkan menurut peran, urutan peran tetap', () => {
    const r = crewGroups([c(1, 'A', 'Editor'), c(2, 'B', 'Director'), c(3, 'C', 'Screenplay')]);
    expect(r.map((g) => g.key)).toEqual(['director', 'writing', 'editing']);
  });
  it('orang yang sama dengan dua job penulis hanya sekali', () => {
    const r = crewGroups([c(3, 'C', 'Screenplay'), c(3, 'C', 'Story'), c(4, 'D', 'Writer')]);
    expect(r[0].people.map((p) => p.id)).toEqual([3, 4]);
  });
  it('membatasi jumlah per peran dan membuang job lain', () => {
    const many = Array.from({ length: 9 }, (_, i) => c(i + 1, `P${i}`, 'Producer'));
    expect(crewGroups([...many, c(99, 'X', 'Gaffer')])[0].people).toHaveLength(4);
    expect(crewGroups([c(99, 'X', 'Gaffer')])).toEqual([]);
    expect(crewGroups(undefined)).toEqual([]);
  });
});
