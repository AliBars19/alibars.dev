import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      'next-env.d.ts',
      'node_modules/**',
      '.next/**',
      'out/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'design_handoff_alibars_portfolio/**',
    ],
  },
];

export default eslintConfig;
