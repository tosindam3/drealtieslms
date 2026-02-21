<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class HostingerDeployAndSetupCicdCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'hostinger:deploy-and-setup-cicd';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Deploy to Hostinger and setup CI/CD';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Preparing for deployment to Hostinger...');

        $rootDir = dirname(__DIR__, 4);

        // Install backend dependencies with dev
        $this->info('Installing backend dependencies...');
        $this->executeCommand('composer install --optimize-autoloader', $rootDir . '/backend');

        // Run backend tests
        $this->info('Running backend tests...');
        $this->executeCommand('vendor/bin/phpunit', $rootDir . '/backend', true); // continue on error

        // Install backend dependencies without dev
        $this->info('Optimizing backend for production...');
        $this->executeCommand('composer install --no-dev --optimize-autoloader', $rootDir . '/backend');

        // Install frontend dependencies
        $this->info('Installing frontend dependencies...');
        $this->executeCommand('npm install', $rootDir);

        // Build frontend
        $this->info('Building frontend...');
        $this->executeCommand('npm run build', $rootDir);

        // Check CI/CD setup
        $this->info('Checking CI/CD configuration...');
        $workflowDir = $rootDir . '/.github/workflows';
        if (is_dir($workflowDir)) {
            $workflows = glob($workflowDir . '/*.yml');
            $this->info('Found ' . count($workflows) . ' workflow(s): ' . implode(', ', array_map('basename', $workflows)));
        } else {
            $this->warn('No CI/CD workflows found in .github/workflows');
        }

        $this->info('Preparation completed. Ready for deployment.');
        $this->comment('To deploy, push to the main branch or run the deploy scripts manually on the server.');
    }

    protected function executeCommand($command, $cwd = null, $continueOnError = false)
    {
        $fullCommand = $command;
        if ($cwd) {
            $fullCommand = "cd " . escapeshellarg($cwd) . " && " . $command;
        }

        $output = shell_exec($fullCommand . ' 2>&1');
        if ($output === null && !$continueOnError) {
            $this->error('Failed to execute: ' . $command);
            exit(1);
        }
        $this->line($output);
    }
}