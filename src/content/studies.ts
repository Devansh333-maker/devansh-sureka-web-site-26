import fs from 'node:fs';
import path from 'node:path';

// Earlier studies and course reports, each one JSON file in /content/studies, all read the same
// way on screen (see app/studies/[slug]). _index.json sets which ones the Studio archive lists.

export type StudyBlock =
  | { h: string }
  | { p: string }
  | { list: string[] }
  | { table: { head: string[]; rows: string[][] } }
  | { img: string; alt: string; caption?: string };

export type Study = {
  slug: string;
  title: string;
  kind: string;
  year?: string;
  context?: string;
  summary: string;
  points: string[];
  mode: 'text' | 'deck' | 'pages';
  body?: StudyBlock[];
  pages?: { src: string; w: number; h: number }[];
  place?: 'studio' | 'workshop'; // whose page it belongs to (studio if not set)
};

const DIR = path.join(process.cwd(), 'content', 'studies');

export const studies: Study[] = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')) as Study);

export const getStudy = (slug: string) => studies.find((s) => s.slug === slug);

// the archive's order; studies not listed (like the Spotify one, told on the page itself) stay out
export const archive: Study[] = (JSON.parse(fs.readFileSync(path.join(DIR, '_index.json'), 'utf8')) as string[])
  .map((s) => getStudy(s))
  .filter((s): s is Study => !!s);
