import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function waitForServer(url, maxAttempts = 60, interval = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      attempts++;
      const req = http.get(url, (res) => {
        if (res.statusCode === 200) {
          console.log('✅ Web server is ready');
          resolve();
        } else {
          if (attempts >= maxAttempts) {
            reject(new Error('Server not ready after max attempts'));
          } else {
            setTimeout(check, interval);
          }
        }
      });
      req.on('error', () => {
        if (attempts >= maxAttempts) {
          reject(new Error('Server not ready after max attempts'));
        } else {
          setTimeout(check, interval);
        }
      });
    };
    check();
  });
}

async function main() {
  console.log('🚀 Starting desktop development environment...');

  console.log('📦 Starting web dev server...');
  const webDev = spawn('pnpm', ['--filter', '@gitary/web', 'dev'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  });

  try {
    console.log('⏳ Waiting for web server to be ready...');
    await waitForServer('http://localhost:5173');

    console.log('⚡ Starting Electron...');
    const electron = spawn('pnpm', ['--filter', '@gitary/electron', 'dev'], {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
    });

    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down...');
      webDev.kill();
      electron.kill();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down...');
      webDev.kill();
      electron.kill();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start:', error);
    webDev.kill();
    process.exit(1);
  }
}

main();


