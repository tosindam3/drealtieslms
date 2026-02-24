import https from 'https';

const options = {
    hostname: 'api.github.com',
    path: '/repos/tosindam3/drealtieslms/actions/runs?per_page=1',
    method: 'GET',
    headers: {
        'User-Agent': 'Node.js',
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN || ''}`,
        'Accept': 'application/vnd.github.v3+json'
    }
};

const req = https.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            if (parsed.workflow_runs && parsed.workflow_runs.length > 0) {
                const run = parsed.workflow_runs[0];
                console.log('--- LATEST GITHUB ACTION RUN ---');
                console.log('Run Name: ' + run.name);
                console.log('Status: ' + run.status);
                console.log('Conclusion: ' + run.conclusion);
                console.log('URL: ' + run.html_url);
            } else {
                console.log('No runs found yet.');
            }
        } catch (e) {
            console.log('Error parsing JSON:', e.message);
            console.log('Raw data received (first 100 chars):', data.substring(0, 100));
        }
    });
});

req.on('error', e => console.error('Request Error:', e.message));
req.end();
