import * as tar from 'tar';
import * as fs from 'fs';

async function extract() {
  console.log('Current working directory:', process.cwd());
  console.log('File exists:', fs.existsSync('./barbeiro_deploy.tar.gz'));
  try {
    await tar.x({
      file: './barbeiro_deploy.tar.gz',
      C: './'
    });
    console.log('Extraction complete');
  } catch (err) {
    console.error('Extraction failed:', err);
    process.exit(1);
  }
}

extract();
