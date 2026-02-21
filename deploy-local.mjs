import { execSync } from 'child_process';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { resolve } from 'path';

// Configuration
const HOST = '178.16.128.142';
const USER = 'u416132331';
const PORT = '65002';
const PRIVATE_KEY_PATH = resolve('SAVE kEY/open_key');
const REMOTE_PATH = '~/domains/drealtiesfx.com';

const SSH_OPTS = `-i "${PRIVATE_KEY_PATH}" -p ${PORT} -o StrictHostKeyChecking=no`;
const SCP_OPTS = `-i "${PRIVATE_KEY_PATH}" -P ${PORT} -o StrictHostKeyChecking=no`;
const SSH_CMD = `ssh ${SSH_OPTS} ${USER}@${HOST}`;

function run(cmd, cwd = process.cwd()) {
    console.log(`\n> ${cmd}`);
    try {
        execSync(cmd, { cwd, stdio: 'inherit' });
    } catch (e) {
        console.error(`Command failed: ${cmd}`);
        process.exit(1);
    }
}

async function deploy() {
    console.log('🚀 Starting DrealtiesFX Deployment to Hostinger...\n');

    // 1. Build React Frontend
    console.log('📦 1. Building React Frontend...');
    run('npm install');
    run('npm run build');

    // 2. Prepare Deployment Archive
    // Since we don't have git, we'll use tar to bundle everything, excluding node_modules, vendor, etc.
    console.log('\n🗜️ 2. Creating deployment archive...');
    const ignoreList = [
        'node_modules',
        'backend/vendor',
        '.git',
        '.github',
        '.env',         // Don't overwrite remote env
        'backend/.env', // Don't overwrite remote env
        'deploy.tar.gz'
    ];

    // Create an exclude file for tar
    writeFileSync('tar_exclude.txt', ignoreList.join('\n'));

    // Use standard Windows tar (available in recent Windows versions) to create the archive
    run(`tar -czf deploy.tar.gz --exclude-from=tar_exclude.txt .`);

    // 3. Upload Archive
    console.log(`\n☁️ 3. Uploading archive to Hostinger (${HOST})...`);
    run(`scp ${SCP_OPTS} deploy.tar.gz ${USER}@${HOST}:${REMOTE_PATH}/deploy.tar.gz`);

    // 4. Extract and Install on Server
    console.log('\n⚙️ 4. Extracting and running Composer on Hostinger...');

    const remoteCommands = `
        cd ${REMOTE_PATH} &&
        tar -xzf deploy.tar.gz &&
        rm deploy.tar.gz &&
        rm -rf public_html/* &&
        cp -r dist/* public_html/ &&
        cd backend &&
        composer install --no-dev --optimize-autoloader &&
        php artisan migrate --force &&
        php artisan config:cache &&
        php artisan route:cache &&
        php artisan view:cache
    `;

    run(`${SSH_CMD} "${remoteCommands}"`);

    // Cleanup local files
    console.log('\n🧹 Cleaning up local temporary files...');
    unlinkSync('deploy.tar.gz');
    unlinkSync('tar_exclude.txt');

    console.log('\n✅ Deployment successfully completed!');
}

deploy().catch(console.error);
