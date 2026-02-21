<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Current Users in Database:\n";
echo str_repeat("=", 80) . "\n";
echo sprintf("%-5s | %-20s | %-30s | %-15s\n", "ID", "Name", "Email", "Role");
echo str_repeat("=", 80) . "\n";

$users = App\Models\User::all(['id', 'name', 'email', 'role']);

foreach ($users as $user) {
    echo sprintf("%-5s | %-20s | %-30s | %-15s\n", 
        $user->id, 
        substr($user->name, 0, 20), 
        substr($user->email, 0, 30), 
        $user->role
    );
}

echo str_repeat("=", 80) . "\n";
echo "Total users: " . $users->count() . "\n";
