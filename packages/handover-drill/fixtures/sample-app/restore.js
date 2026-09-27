import { copyFile } from 'node:fs/promises';

await copyFile(process.argv[2], 'data.json');
