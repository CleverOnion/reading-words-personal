import {writeFile} from 'node:fs/promises';
import {BRAND_SVG} from '../lib/brand.ts';

await writeFile(new URL('../public/favicon.svg',import.meta.url),BRAND_SVG+'\n');
console.log('Updated the reading-notes favicon from lib/brand.ts.');
