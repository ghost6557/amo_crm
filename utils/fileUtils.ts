import * as path from 'path';

export const filePath = __dirname.includes('app')
  ? '/app/utils/info.json'
  : path.join(__dirname.replace('\\dist', ''), 'info.json');
