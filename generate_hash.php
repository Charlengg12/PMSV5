<?php
// Update all user passwords in database to admin123

require __DIR__ . '/api/config.php';

$password = 'admin123';
$hash = password_hash($password, PASSWORD_BCRYPT);

echo "Generated hash: " . $hash . "\n\n";

try {
    // Update all test users with the new hash
    $stmt = $pdo->prepare('UPDATE users SET password_hash = :hash WHERE id IN (:id1, :id2, :id3, :id4)');
    $stmt->execute([
        ':hash' => $hash,
        ':id1' => 'admin-1',
        ':id2' => 'supervisor-1',
        ':id3' => 'fabricator-1',
        ':id4' => 'client-1'
    ]);

    echo "Updated " . $stmt->rowCount() . " users\n\n";

    // Verify the update
    $stmt = $pdo->query("SELECT id, email, password_hash FROM users WHERE id IN ('admin-1', 'supervisor-1', 'fabricator-1', 'client-1')");
    $users = $stmt->fetchAll();

    echo "Verification:\n";
    foreach ($users as $user) {
        $verified = password_verify($password, $user['password_hash']) ? '✓' : '✗';
        echo "{$verified} {$user['email']}\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
