// Lint rules: Next.js's recommended set (Core Web Vitals) plus its TypeScript rules.
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  { ignores: ['.next/**', '.next-prod/**', 'out/**', 'node_modules/**', 'public/**', 'assets-src/**', '.firebase/**', 'scripts/**', 'docs/**'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default config;
