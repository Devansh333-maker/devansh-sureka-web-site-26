import fs from 'node:fs';
import path from 'node:path';

// The Notebook. Every post is one text file in /content/notebook (see the how-to file there);
// its images go in /public/notebook/<the post's file name>/. This reads them all at build time.
//
// Inside a post, blocks are separated by an empty line:
//   plain text                       → a paragraph
//   (text in brackets)               → an editor's note, set apart from the story
//   ## Heading                       → a subheading
//   > quote  (and optionally  > — who said it)  → a pull quote
//   ![what the image shows](/notebook/slug/photo.webp "caption")  → an image
//   [compare: then-now]              → the first version of this site against this one

export type Block = string | { h: string } | { quote: string; by?: string } | { img: string; alt: string; caption?: string } | { compare: 'then-now' };

export type Note = {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  kind: string; // Essay, Field note, Diary, Short story, Build log… anything
  place?: string;
  summary: string;
  cover?: string;
  body: Block[];
};

const DIR = path.join(process.cwd(), 'content', 'notebook');

function parseBlock(raw: string): Block {
  const lines = raw.split('\n').map((l) => l.trim());
  const text = lines.join(' ');
  if (/^\[compare:\s*then-now\]$/i.test(text)) return { compare: 'then-now' };
  if (lines[0].startsWith('#')) return { h: lines[0].replace(/^#+\s*/, '') };
  if (lines.every((l) => l.startsWith('>'))) {
    const q = lines.map((l) => l.replace(/^>\s?/, ''));
    const last = q[q.length - 1];
    const by = q.length > 1 && /^(—|--|-)\s*/.test(last) ? last.replace(/^(—|--|-)\s*/, '') : undefined;
    return { quote: (by ? q.slice(0, -1) : q).join(' '), ...(by && { by }) };
  }
  const img = text.match(/^!\[([^\]]*)\]\(\s*(\S+)(?:\s+"([^"]*)")?\s*\)$/);
  if (img) return { img: img[2], alt: img[1], ...(img[3] && { caption: img[3] }) };
  return text;
}

function readNote(file: string): Note {
  const src = fs.readFileSync(path.join(DIR, file), 'utf8').replace(/\r\n?/g, '\n');
  const m = src.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error(`Notebook: ${file} must start with the --- details --- block (see _how-to-add-a-post.md)`);
  const meta: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
  }
  for (const key of ['title', 'date', 'kind', 'summary']) {
    if (!meta[key]) throw new Error(`Notebook: ${file} is missing "${key}:" in its details`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) throw new Error(`Notebook: ${file} has date "${meta.date}"; write it as YYYY-MM-DD, e.g. 2026-11-03`);
  return {
    slug: file.replace(/\.md$/, ''),
    title: meta.title,
    date: meta.date,
    kind: meta.kind,
    place: meta.place || undefined,
    summary: meta.summary,
    cover: meta.cover || undefined,
    body: m[2]
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean)
      .map(parseBlock),
  };
}

// files starting with _ (like the how-to) are notes for you, not posts
export const notes: Note[] = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
  .map(readNote);

export const sortedNotes = [...notes].sort((a, b) => b.date.localeCompare(a.date));

export function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
