import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The game uses sprite icons only: no emoji or pictograph symbols (stars, hearts, arrows, checkboxes).
const FORBIDDEN = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{25A0}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe('no emoji', () => {
  it('src/ and index.html contain no emoji or pictographs', () => {
    const hits: string[] = [];
    for (const path of [...files('src'), 'index.html']) {
      readFileSync(path, 'utf8').split('\n').forEach((line, i) => {
        const m = line.match(FORBIDDEN);
        if (m) hits.push(`${path}:${i + 1} ${m[0]}`);
      });
    }
    expect(hits).toEqual([]);
  });
});
