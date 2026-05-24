import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';

const envPaths = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'apps/api/.env'),
  resolve(process.cwd(), '../../.env'),
  resolve(process.cwd(), '../../apps/api/.env'),
];

for (const envPath of Array.from(new Set(envPaths))) {
  if (existsSync(envPath)) {
    config({ path: envPath, override: false });
  }
}
