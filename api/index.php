<?php

$autoloadPath = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoloadPath)) {
    $autoloadPath = __DIR__ . '/../vendor/vendor/autoload.php';
}
if (file_exists($autoloadPath)) {
    require $autoloadPath;
}

// Simple PHP API router to replace Node/Express backend

require __DIR__ . '/config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// LOAD PHPMAILER
// If using Composer:
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';

// Determine the base path (e.g. "/api") and trim it from the URI
$scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
if ($scriptDir !== '' && strpos($requestUri, $scriptDir) === 0) {
    $path = substr($requestUri, strlen($scriptDir));
} else {
    $path = $requestUri;
}
$path = '/' . trim($path, '/');

// Basic routing
switch ($method . ' ' . $path) {


    // case 'PUT /announcements/:id':
    //     handle_update_announcement($pdo, $path);
    //     break;

    case 'GET /billing/summary':
        handle_get_billing_summary($pdo);
        break;

    case 'POST /billing/payment':
        handle_create_payment($pdo);
        break;
    
    // Add this if you want to delete a payment mistake
    case 'DELETE /billing/payment/:id':
        handle_delete_payment($pdo, $path);
        break;

case 'GET /announcements':
        handle_get_announcements($pdo);
        break;

    case 'POST /announcements':
        handle_create_announcement($pdo);
        break;

    // case 'DELETE /announcements/:id':
    //     handle_delete_announcement($pdo, $path);
    //     break;

    case 'GET /activity-logs':
        handle_get_activity_logs($pdo);
        break;

    case 'POST /auth/verify-password':
        handle_verify_password($pdo);
        break;

    case 'GET /health':
        json_response([
            'status' => 'ok',
            'timestamp' => gmdate('c'),
        ]);
        break;

    case 'POST /auth/login':
        handle_login($pdo);
        break;

    case 'POST /auth/signup':
        handle_signup($pdo);
        break;

    case 'GET /projects':
        handle_get_projects($pdo);
        break;

    case 'POST /projects':
        handle_create_project($pdo);
        break;

    case 'GET /tasks':
        handle_get_tasks($pdo);
        break;

    case 'POST /tasks':
        handle_create_task($pdo);
        break;

    case 'GET /worklogs':
        handle_get_worklogs($pdo);
        break;

    case 'POST /worklogs':
        handle_create_worklog($pdo);
        break;

    case 'GET /materials':
        handle_get_materials($pdo);
        break;

    case 'POST /materials':
        handle_create_material($pdo);
        break;

    case 'GET /users':
        handle_get_users($pdo);
        break;
    // get all user where is_active = 0
    case 'GET /users/inactive':
        handle_get_inactive_users($pdo);
        break;
    // make user inactive 
    case 'PUT /users/:id':
        handle_update_user_inactive($pdo, $path);
        break;
    // make the user active again set is_active = 1
    case 'PUT /users/active/:id':
        handle_update_user_active($pdo, $path);
        break;

    case 'POST /users/client':
        handle_create_client($pdo);
        break;

    case 'POST /auth/logout':
        handle_logout($pdo); // Passed PDO for logging
        break;

    case 'GET /auth/me':
        handle_me($pdo);
        break;

    case 'GET /debug/test-password':
        // Debug endpoint to test password verification
        $stmt = $pdo->prepare('SELECT email, password_hash FROM users WHERE email = :email LIMIT 1');
        $stmt->execute([':email' => 'admin@ehub.com']);
        $user = $stmt->fetch();

        $testPassword = 'admin123';
        $result = [
            'email' => $user['email'] ?? 'not found',
            'hash_exists' => !empty($user['password_hash']),
            'hash_length' => strlen($user['password_hash'] ?? ''),
            'hash_prefix' => substr($user['password_hash'] ?? '', 0, 7),
            'actual_hash' => $user['password_hash'] ?? '',
            'test_password' => $testPassword,
            'verification_result' => password_verify($testPassword, $user['password_hash'] ?? ''),
            'php_version' => PHP_VERSION
        ];
        json_response($result);
        break;

    case 'PUT /projects/:id':
        handle_update_project($pdo, $path);
        break;

    case 'DELETE /projects/:id':
        handle_delete_project($pdo, $path);
        break;

    // Using string matching for exact paths for new endpoints
    case 'POST /projects/broadcast-fabricators':
        handle_broadcast_fabricators($pdo);
        break;

    case 'POST /projects/respond-assignment':
        handle_respond_assignment($pdo);
        break;
        // reports routes
    case 'GET reports':
    case 'GET /reports':
        handle_get_reports($pdo);
        break;
    case 'POST reports':
    case 'POST /reports/create':
        handle_create_report($pdo);
        break;
    case 'POST /reports/export':
    case 'POST reports/export':
        handle_export_report($pdo);
        break;
    case 'PUT reports':
    case 'PUT /reports/edit':
        handle_edit_report($pdo);
        break;

    case 'DELETE reports':
    case 'DELETE /reports/:id':
        handle_delete_report($pdo, $path);
        break;

    case 'GET /reports/:id/analytics':
        handle_get_report_analytics($pdo, $path);
        break;
    // We need to handle dynamic routes manually in the default or before switch
   default:
    if (preg_match('#^PUT /tasks/([^/]+)$#', $method . ' ' . $path, $matches)) {
        handle_update_task($pdo, $matches[1]);
    } elseif (preg_match('#^DELETE /tasks/([^/]+)$#', $method . ' ' . $path, $matches)) {
        handle_delete_task($pdo, $matches[1]);
    } elseif (preg_match('#^PUT /worklogs/([^/]+)$#', $method . ' ' . $path, $matches)) {
        handle_update_worklog($pdo, $matches[1]);
    } elseif (preg_match('#^DELETE /worklogs/([^/]+)$#', $method . ' ' . $path, $matches)) {
        handle_delete_worklog($pdo, $matches[1]);
    } elseif (preg_match('#^PUT /projects/([^/]+)$#', $method . ' ' . $path, $matches)) {
        handle_update_project($pdo, $matches[1]);
    } elseif (preg_match('#^PUT /users/([^/]+)$#', $method . ' ' . $path, $matches)) {
        handle_update_user($pdo, $matches[1]);
    } elseif (preg_match('#^DELETE /projects/([^/]+)$#', $method . ' ' . $path, $matches)) {
        handle_delete_project($pdo, $matches[1]);
        // add routes for making inactive the user the is_active will set to 0
    } elseif (preg_match('#^PUT /users/inactive/([^/]+)$#', $method . ' ' . $path, $matches)) {
        handle_update_user_inactive($pdo, $matches[1]);
        // add routes for making active the user the is_active will set to 1
    } elseif (preg_match('#^PUT /users/active/([^/]+)$#', $method . ' ' . $path, $matches)) {
        handle_update_user_active($pdo, $matches[1]);
    } elseif ($method === 'DELETE' && preg_match('#^/reports/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        handle_delete_report($pdo, $id);
    } elseif ($method === 'PUT' && preg_match('#^/reports/([^/]+)$#', $path, $m)) {
        $id = $m[1];
        handle_update_report($pdo, $id);
    } elseif ($method === 'DELETE' && preg_match('#^(reports/([^/]+)|/reports/([^/]+))$#', $path, $m)) {
        $id = $m[2] ?? $m[3] ?? null;
        if ($id) handle_delete_report($pdo, $id);
        } elseif (preg_match('#^PUT /users/active/([^/]+)$#', $method . ' ' . $path, $matches)) {
        handle_update_user_active($pdo, $matches[1]);

   
    } elseif (preg_match('#^PUT /announcements/(\d+)$#', $method . ' ' . $path, $matches)) {
        handle_update_announcement($pdo, $path);
    } elseif (preg_match('#^DELETE /announcements/(\d+)$#', $method . ' ' . $path, $matches)) {
        handle_delete_announcement($pdo, $path);

    } elseif ($method === 'DELETE' && preg_match('#^/reports/([^/]+)$#', $path, $m)) {

    // --- ADD THESE NEW ROUTES FOR MATERIALS ---
        } elseif ($method === 'GET' && preg_match('#^/reports/([^/]+)/analytics$#', $path, $matches)) {
        handle_get_report_analytics($pdo, $matches[1]);
        } elseif (preg_match('#^PUT /materials/([^/]+)$#', $method . ' ' . $path, $matches)) {
            handle_update_material($pdo, $matches[1]);
        } elseif (preg_match('#^DELETE /materials/([^/]+)$#', $method . ' ' . $path, $matches)) {
            handle_delete_material($pdo, $matches[1]);

            } elseif (preg_match('#^DELETE /billing/payment/(\d+)$#', $method . ' ' . $path, $matches)) {
        // This catches "DELETE /billing/payment/123"
        handle_delete_payment($pdo, $path);
        // --
    } else {
        json_response(['error' => 'Not found'], 404);
    }
    break;
    }

// ----------------------------------------------------------------------
// HELPER: Activity Logger
// ----------------------------------------------------------------------
function handle_get_report_analytics(PDO $pdo, string $reportId): void
{
    require_login();

    $userId = $_SESSION['user_id'] ?? null;
    $role   = $_SESSION['role']   ?? null;

    if (!$userId || !$role) {
        json_response(['error' => 'Please login first'], 401);
        return;
    }

    // 1. Kunin ang report
    $stmt = $pdo->prepare("
        SELECT id, type, project_id, created_by, status 
        FROM reports 
        WHERE id = :id
    ");
    $stmt->execute([':id' => $reportId]);
    $report = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$report) {
        json_response(['error' => 'Report not found'], 404);
        return;
    }

    // 2. Permission check
    $canView = false;

    if ($role === 'admin') {
        $canView = true;
    } elseif ($report['created_by'] === $userId) {
        $canView = true;
    } elseif ($report['status'] === 'published') {
        $canView = true;
    } elseif ($role === 'supervisor') {
        // Supervisor check: may project ba siyang kasama sa report?
        if ($report['project_id']) {
            // Specific project report
            $stmt = $pdo->prepare("
                SELECT 1 
                FROM projects 
                WHERE id = :pid AND supervisor_id = :uid
            ");
            $stmt->execute([':pid' => $report['project_id'], ':uid' => $userId]);
            if ($stmt->fetchColumn() > 0) {
                $canView = true;
            }
        } else {
            // All projects report — basta may project siyang sinusupervise
            $stmt = $pdo->prepare("
                SELECT COUNT(*) 
                FROM projects 
                WHERE supervisor_id = :uid
            ");
            $stmt->execute([':uid' => $userId]);
            if ($stmt->fetchColumn() > 0) {
                $canView = true;
            }
        }
    }

    if (!$canView) {
        json_response([
            'error' => 'Hindi mo maa-access ang analytics ng report na ito',
            'details' => 'Only admin, creator, or supervisors of included projects can view (or if published)'
        ], 403);
        return;
    }

    // 3. Alamin kung aling projects ang isasama (filtered by role)
    $projectIds = [];

    if ($report['project_id']) {
        // Specific project lang — pero siguraduhin na allowed siya
        if ($role === 'supervisor') {
            $stmt = $pdo->prepare("
                SELECT id 
                FROM projects 
                WHERE id = :pid AND supervisor_id = :uid
            ");
            $stmt->execute([':pid' => $report['project_id'], ':uid' => $userId]);
            $allowedId = $stmt->fetchColumn();
            if ($allowedId) {
                $projectIds[] = $allowedId;
            }
        } else {
            // Admin or creator — pwede lahat
            $projectIds[] = $report['project_id'];
        }
    } else {
        // All projects — pero filtered by role
        if ($role === 'admin') {
            $stmt = $pdo->query("SELECT id FROM projects");
            $projectIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        } elseif ($role === 'supervisor') {
            $stmt = $pdo->prepare("SELECT id FROM projects WHERE supervisor_id = :uid");
            $stmt->execute([':uid' => $userId]);
            $projectIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        }
    }

    // Kung walang project na pwede makita
    if (empty($projectIds)) {
        json_response([
            'budget'       => 0.0,
            'totalCost'    => 0.0,
            'totalRevenue' => 0.0,
            'monthlyData'  => [],
            'message'      => 'Walang project na naka-assign sa iyo o kasama sa report na ito'
        ]);
        return;
    }

    // 4. Total aggregates
    $placeholders = implode(',', array_fill(0, count($projectIds), '?'));
    
    $stmt = $pdo->prepare("
        SELECT 
            COALESCE(SUM(budget), 0)   AS total_budget,
            COALESCE(SUM(spent), 0)    AS total_cost,
            COALESCE(SUM(revenue), 0)  AS total_revenue
        FROM projects 
        WHERE id IN ($placeholders)
    ");
    $stmt->execute($projectIds);
    $totals = $stmt->fetch(PDO::FETCH_ASSOC);

    $analytics = [
        'budget'       => (float)($totals['total_budget'] ?? 0),
        'totalCost'    => (float)($totals['total_cost'] ?? 0),
        'totalRevenue' => (float)($totals['total_revenue'] ?? 0),
        'monthlyData'  => []
    ];

    // 5. Monthly breakdown
    $stmt = $pdo->prepare("
        SELECT 
            DATE_FORMAT(wl.date, '%b %Y') AS month,
            ROUND(COALESCE(SUM(wl.hours_worked * 1000), 0), 2) AS cost,
            ROUND(COALESCE(SUM(wl.progress_percentage * 5000), 0), 2) AS revenue
        FROM work_logs wl
        WHERE wl.project_id IN ($placeholders)
        GROUP BY DATE_FORMAT(wl.date, '%Y-%m')
        ORDER BY MIN(wl.date) ASC
        LIMIT 12
    ");
    $stmt->execute($projectIds);
    $monthly = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Distribute budget evenly across months
    $monthCount = count($monthly) > 0 ? count($monthly) : 6;
    $monthlyBudgetPerMonth = $analytics['budget'] / $monthCount;

    foreach ($monthly as &$m) {
        $m['budget']  = round($monthlyBudgetPerMonth, 2);
        $m['cost']    = (float)$m['cost'];
        $m['revenue'] = (float)$m['revenue'];
    }
    unset($m);

    $analytics['monthlyData'] = $monthly;

    // 6. Return success
    json_response($analytics);
}
function log_activity(PDO $pdo, string $userId, string $action, ?string $description = null): void
{
    try {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
        $stmt = $pdo->prepare("INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES (:uid, :act, :desc, :ip)");
        $stmt->execute([
            ':uid' => $userId,
            ':act' => $action,
            ':desc' => $description,
            ':ip' => $ip
        ]);
    } catch (\Throwable $e) {
        // Silently fail if logging fails to not break the app
        error_log("Logging failed: " . $e->getMessage());
    }
}

function apply_project_progress_delta(PDO $pdo, string $projectId, float $delta): void
{
    if ($projectId === '' || $delta == 0.0) {
        return;
    }

    $stmt = $pdo->prepare(
        'UPDATE projects
         SET progress = LEAST(100, GREATEST(0, COALESCE(progress, 0) + :delta))
         WHERE id = :id'
    );
    $stmt->execute([
        ':delta' => $delta,
        ':id' => $projectId,
    ]);
}

// ----------------------------------------------------------------------
// HANDLERS
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// BILLING / PAYMENT HANDLERS
// ----------------------------------------------------------------------

function handle_get_billing_summary(PDO $pdo): void
{
    require_login();
    
    // This query fetches projects and SUMs up their payments
    // We filter by projects that actually have a client (client_id is not null)
    $sql = "
        SELECT 
            p.id, p.title, p.status, p.revenue as total_cost, p.client_id,
            u.name as client_name,
            COALESCE(SUM(pp.amount), 0) as total_paid,
            (p.revenue - COALESCE(SUM(pp.amount), 0)) as balance
        FROM projects p
        LEFT JOIN users u ON p.client_id = u.id
        LEFT JOIN project_payments pp ON p.id = pp.project_id
        WHERE p.client_id IS NOT NULL
        GROUP BY p.id
        ORDER BY balance DESC, p.created_at DESC
    ";

    $stmt = $pdo->query($sql);
    $summary = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Also fetch payment history details for the nested view
    $historySql = "
        SELECT pp.*, u.name as recorder_name 
        FROM project_payments pp
        JOIN users u ON pp.created_by = u.id
        ORDER BY pp.payment_date DESC
    ";
    $historyStmt = $pdo->query($historySql);
    $history = $historyStmt->fetchAll(PDO::FETCH_ASSOC);

    // Group history by project_id for easier frontend consumption
    $groupedHistory = [];
    foreach ($history as $h) {
        $groupedHistory[$h['project_id']][] = $h;
    }

    // Attach history to summary
    foreach ($summary as &$row) {
        $row['payment_history'] = $groupedHistory[$row['id']] ?? [];
    }

    json_response($summary);
}

function handle_create_payment(PDO $pdo): void
{
    require_login();
    $body = sanitize_recursive(json_input());

    if (empty($body['projectId']) || empty($body['amount']) || empty($body['date'])) {
        json_response(['error' => 'Project, Amount, and Date are required'], 400);
    }

    $stmt = $pdo->prepare("
        INSERT INTO project_payments (project_id, amount, payment_date, method, reference, notes, created_by)
        VALUES (:pid, :amt, :date, :method, :ref, :notes, :uid)
    ");

    $stmt->execute([
        ':pid' => $body['projectId'],
        ':amt' => $body['amount'],
        ':date' => $body['date'],
        ':method' => $body['method'] ?? 'Cash',
        ':ref' => $body['reference'] ?? null,
        ':notes' => $body['notes'] ?? null,
        ':uid' => $_SESSION['user_id']
    ]);

    log_activity($pdo, $_SESSION['user_id'], 'RECORD_PAYMENT', "Recorded payment of " . $body['amount'] . " for project " . $body['projectId']);

    json_response(['message' => 'Payment recorded successfully']);
}

function handle_delete_payment(PDO $pdo, string $path): void
{
    require_login();
    if ($_SESSION['role'] !== 'admin') {
        json_response(['error' => 'Unauthorized'], 403);
    }

    if (preg_match('#/billing/payment/(\d+)#', $path, $matches)) {
        $id = $matches[1];
    } else {
        json_response(['error' => 'Invalid ID'], 400);
    }

    $stmt = $pdo->prepare("DELETE FROM project_payments WHERE id = :id");
    $stmt->execute([':id' => $id]);

    log_activity($pdo, $_SESSION['user_id'], 'DELETE_PAYMENT', "Deleted payment ID: $id");
    json_response(['message' => 'Payment deleted']);
}

function handle_update_task(PDO $pdo, string $id): void
{
    require_login();
    $body = json_input();

    $fields = [];
    $params = [':id' => $id];

    $allowed = [
        'project_id',
        'title',
        'description',
        'status',
        'priority',
        'assigned_to',
        'due_date',
        'estimated_hours',
        'actual_hours'
    ];

    foreach ($allowed as $field) {
        $val = null;
        
        // Map camelCase from Frontend to snake_case for DB
        if (isset($body[$field])) $val = $body[$field];
        if ($field === 'project_id' && isset($body['projectId'])) $val = $body['projectId'];
        if ($field === 'assigned_to' && isset($body['assignedTo'])) {
            $val = is_array($body['assignedTo']) ? json_encode($body['assignedTo']) : $body['assignedTo'];
        }
        if ($field === 'due_date' && isset($body['dueDate'])) $val = $body['dueDate'];
        if ($field === 'estimated_hours' && isset($body['estimatedHours'])) $val = $body['estimatedHours'];
        if ($field === 'actual_hours' && isset($body['actualHours'])) $val = $body['actualHours'];

        if ($val !== null) {
            // Handle empty strings as NULL for specific fields
            if (($field === 'assigned_to' || $field === 'due_date') && $val === "") {
                $val = null; 
            }
            $fields[] = "$field = :$field";
            $params[":$field"] = $val;
        }
    }

    if (empty($fields)) {
        json_response(['message' => 'No changes provided'], 400);
    }

    try {
        $sql = "UPDATE tasks SET " . implode(', ', $fields) . ", updated_at = NOW() WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmt = $pdo->prepare('SELECT * FROM tasks WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $task = $stmt->fetch();

        if (!$task) {
             json_response(['error' => 'Task not found'], 404);
        }

        log_activity($pdo, $_SESSION['user_id'], 'UPDATE_TASK', "Updated task: " . ($task['title'] ?? $id));
        json_response($task);

    } catch (PDOException $e) {
        json_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handle_delete_task(PDO $pdo, string $id): void
{
    require_login();
    
    // Fetch title for logging before delete
    $stmt = $pdo->prepare('SELECT title FROM tasks WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $task = $stmt->fetch();
    $title = $task['title'] ?? 'Unknown';

    $stmt = $pdo->prepare('DELETE FROM tasks WHERE id = :id');
    $stmt->execute([':id' => $id]);

    // LOGGING
    log_activity($pdo, $_SESSION['user_id'], 'DELETE_TASK', "Deleted task: $title");

    json_response(['message' => 'Task deleted']);
}

function handle_update_user(PDO $pdo, string $id): void
{
    require_login();
    $body = sanitize_recursive(json_input());

    $allowed = ['name','email','role','school','phone','gcash_number','is_active'];
    $fields = [];
    $params = [':id' => $id];

    foreach ($allowed as $field) {
        $val = $body[$field] ?? null;
        if ($field === 'gcash_number' && isset($body['gcashNumber'])) $val = $body['gcashNumber'];
        if ($val !== null) {
            $fields[] = "$field = :$field";
            $params[":$field"] = $val;
        }
    }

    if (empty($fields)) {
        json_response(['message' => 'No changes provided'], 400);
    }

    $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    $stmt = $pdo->prepare('SELECT id, name, email, role, school, phone, gcash_number, secure_id, employee_number, is_active, created_at FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $user = $stmt->fetch();
    if (!$user) {
        json_response(['error' => 'User not found after update'], 404);
    }

    // LOGGING
    log_activity($pdo, $_SESSION['user_id'], 'UPDATE_USER', "Updated user details for: " . $user['name']);

    json_response(['user' => $user, 'message' => 'User updated successfully']);
}

function handle_update_user_inactive(PDO $pdo, string $id): void
{
    require_login();
    
    $stmt = $pdo->prepare("UPDATE users SET is_active = 0 WHERE id = :id");
    $stmt->execute([':id' => $id]);

    $stmt = $pdo->prepare("SELECT id, name, email, role, school, phone, gcash_number, secure_id, employee_number, is_active, created_at FROM users WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
    $user = $stmt->fetch();
    if (!$user) {
        json_response(['error' => 'User not found after update'], 404);
    }

    // LOGGING
    log_activity($pdo, $_SESSION['user_id'], 'DEACTIVATE_USER', "Deactivated user: " . $user['name']);

    json_response(['user' => $user, 'message' => 'User updated successfully']);
}

function handle_update_user_active(PDO $pdo, string $id): void
{
    require_login();
    
    $stmt = $pdo->prepare("UPDATE users SET is_active = 1 WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $stmt = $pdo->prepare("SELECT id, name, email, role, school, phone, gcash_number, secure_id, employee_number, is_active, created_at FROM users WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
    $user = $stmt->fetch();
    if (!$user) {
        json_response(['error' => 'User not found after update'], 404);
    }

    // LOGGING
    log_activity($pdo, $_SESSION['user_id'], 'RESTORE_USER', "Restored user: " . $user['name']);

    json_response(['user' => $user, 'message' => 'User updated successfully']);
}
// --- Handlers ---
function ensure_reports_shared_with(PDO $pdo): bool
{
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM reports LIKE 'shared_with'");
        $column = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($column) {
            return true;
        }

        $pdo->exec("ALTER TABLE reports ADD COLUMN shared_with JSON NULL");
        return true;
    } catch (PDOException $e) {
        return false;
    }
}

// reports handlers
function handle_get_reports($pdo) {
    require_login();
    $role = $_SESSION['role'] ?? 'guest';
    $userId = $_SESSION['user_id'];

    $includeShared = ensure_reports_shared_with($pdo);
    $query = $includeShared
        ? "SELECT id, title, description, type, status, project_id, shared_with, created_by, created_at, updated_at FROM reports"
        : "SELECT id, title, description, type, status, project_id, created_by, created_at, updated_at FROM reports";
    if ($role !== 'admin' && $role !== 'supervisor') {
        $query .= " WHERE status = 'published'";
    }
    $query .= " ORDER BY created_at DESC";

    try {
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        json_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }

    $reports = $reports ?? [];
    foreach ($reports as &$report) {
        if ($includeShared && array_key_exists('shared_with', $report)) {
            $decoded = json_decode($report['shared_with'] ?? '[]', true);
            $report['shared_with'] = is_array($decoded) ? $decoded : [];
        } else {
            $report['shared_with'] = [];
        }
    }
    unset($report);

    if ($role === 'supervisor') {
        $stmt = $pdo->prepare('SELECT id FROM projects WHERE supervisor_id = :uid');
        $stmt->execute([':uid' => $userId]);
        $projectIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $projectLookup = array_fill_keys($projectIds ?: [], true);

        $reports = array_values(array_filter($reports, function ($report) use ($userId, $projectLookup) {
            if (($report['created_by'] ?? null) === $userId) {
                return true;
            }
            if (($report['status'] ?? null) === 'published') {
                return true;
            }
            $projectId = $report['project_id'] ?? null;
            if ($projectId && isset($projectLookup[$projectId])) {
                return true;
            }
            $sharedWith = $report['shared_with'] ?? [];
            if (is_array($sharedWith) && in_array($userId, $sharedWith, true)) {
                return true;
            }
            return false;
        }));
    }

    json_response($reports);
}

function handle_create_report($pdo) {
    require_login();
    $body = sanitize_recursive(json_input());

    $title = trim($body['title'] ?? '');
    if ($title === '') {
        json_response(['error' => 'Title is required'], 400);
    }

    $allowedTypes = ['project', 'task', 'user', 'financial', 'custom'];
    $type = $body['type'] ?? 'custom';
    if (!in_array($type, $allowedTypes, true)) $type = 'custom';

    $allowedStatus = ['draft', 'published', 'archived'];
    $status = $body['status'] ?? 'draft';
    if (!in_array($status, $allowedStatus, true)) $status = 'draft';

    $projectId = $body['project_id'] ?? null;
    if ($projectId === '') $projectId = null;

    $id = 'report_' . time() . '_' . substr(md5(microtime()), 0, 8);

    try {
        $stmt = $pdo->prepare("
            INSERT INTO reports (id, title, description, type, status, project_id, created_by, created_at, updated_at)
            VALUES (:id, :title, :description, :type, :status, :project_id, :created_by, NOW(), NOW())
        ");

        $stmt->execute([
            ':id' => $id,
            ':title' => $title,
            ':description' => trim($body['description'] ?? ''),
            ':type' => $type,
            ':status' => $status,
            ':project_id' => $projectId,
            ':created_by' => $_SESSION['user_id']
        ]);

        // LOGGING
        log_activity($pdo, $_SESSION['user_id'], 'CREATE_REPORT', "Created report: $title");

        $stmt = $pdo->prepare("SELECT * FROM reports WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $report = $stmt->fetch(PDO::FETCH_ASSOC);

        json_response($report);
    } catch (PDOException $e) {
        json_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handle_export_report($pdo) {
    require_login();
    if (($_SESSION['role'] ?? '') !== 'admin') {
        json_response(['error' => 'Unauthorized'], 403);
    }

    if (!ensure_reports_shared_with($pdo)) {
        json_response(['error' => 'Unable to enable report sharing. Please check database permissions.'], 500);
    }

    $body = sanitize_recursive(json_input());
    $reportId = $body['report_id'] ?? ($body['reportId'] ?? null);
    $supervisorId = $body['supervisor_id'] ?? ($body['supervisorId'] ?? null);

    if (!$reportId || !$supervisorId) {
        json_response(['error' => 'Report ID and supervisor ID are required'], 400);
    }

    try {
        $stmt = $pdo->prepare('SELECT id, role, is_active FROM users WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $supervisorId]);
        $supervisor = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$supervisor || $supervisor['role'] !== 'supervisor' || (int)$supervisor['is_active'] !== 1) {
            json_response(['error' => 'Supervisor not found'], 404);
        }

        $stmt = $pdo->prepare('SELECT shared_with FROM reports WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $reportId]);
        $report = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$report) {
            json_response(['error' => 'Report not found'], 404);
        }

        $sharedWith = json_decode($report['shared_with'] ?? '[]', true);
        if (!is_array($sharedWith)) {
            $sharedWith = [];
        }

        if (!in_array($supervisorId, $sharedWith, true)) {
            $sharedWith[] = $supervisorId;
            $stmt = $pdo->prepare('UPDATE reports SET shared_with = :shared_with, updated_at = NOW() WHERE id = :id');
            $stmt->execute([
                ':shared_with' => json_encode($sharedWith),
                ':id' => $reportId,
            ]);
        }

        $stmt = $pdo->prepare('SELECT * FROM reports WHERE id = :id');
        $stmt->execute([':id' => $reportId]);
        $updated = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$updated) {
            json_response(['error' => 'Report not found'], 404);
        }

        if (array_key_exists('shared_with', $updated)) {
            $decoded = json_decode($updated['shared_with'] ?? '[]', true);
            $updated['shared_with'] = is_array($decoded) ? $decoded : [];
        }

        json_response($updated);
    } catch (PDOException $e) {
        json_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handle_update_report($pdo, $id = null, $body = null) {
    require_login();
    $body = sanitize_recursive($body ?? json_input());

    if (!$id) {
        $id = $body['id'] ?? null;
    }

    if (!$id) {
        json_response(['error' => 'Report ID is required'], 400);
    }

    $fields = [];
    $params = [':id' => $id];

    if (isset($body['title'])) {
        $fields[] = "title = :title";
        $params[':title'] = trim($body['title']);
    }
    if (array_key_exists('description', $body)) {
        $fields[] = "description = :description";
        $params[':description'] = trim($body['description']);
    }
    if (isset($body['type'])) {
        $allowedTypes = ['project', 'task', 'user', 'financial', 'custom'];
        if (!in_array($body['type'], $allowedTypes, true)) {
            json_response(['error' => 'Invalid report type'], 400);
        }
        $fields[] = "type = :type";
        $params[':type'] = $body['type'];
    }
    if (isset($body['status'])) {
        $allowedStatus = ['draft', 'published', 'archived'];
        if (!in_array($body['status'], $allowedStatus, true)) {
            json_response(['error' => 'Invalid report status'], 400);
        }
        $fields[] = "status = :status";
        $params[':status'] = $body['status'];
    }
    if (array_key_exists('project_id', $body)) {
        $fields[] = "project_id = :project_id";
        $params[':project_id'] = $body['project_id'] ?: null;
    }

    if (empty($fields)) {
        json_response(['message' => 'No changes'], 200);
    }

    $fields[] = "updated_at = NOW()";
    $sql = "UPDATE reports SET " . implode(', ', $fields) . " WHERE id = :id";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmt = $pdo->prepare("SELECT * FROM reports WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $report = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$report) {
            json_response(['error' => 'Report not found'], 404);
        }

    // LOGGING
    log_activity($pdo, $_SESSION['user_id'], 'EDIT_REPORT', "Edited report: " . $report['title']);

        json_response($report);
    } catch (PDOException $e) {
        json_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handle_edit_report($pdo, $id = null) {
    handle_update_report($pdo, $id);
}

function handle_delete_report($pdo, $id) {
    require_login();

    $stmt = $pdo->prepare("SELECT created_by, title FROM reports WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $report = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$report) {
        json_response(['error' => 'Report not found'], 404);
    }

    if ($_SESSION['role'] !== 'admin' && $report['created_by'] !== $_SESSION['user_id']) {
        json_response(['error' => 'Unauthorized'], 403);
    }

    $stmt = $pdo->prepare("DELETE FROM reports WHERE id = :id");
    $stmt->execute([':id' => $id]);

    // LOGGING
    log_activity($pdo, $_SESSION['user_id'], 'DELETE_REPORT', "Deleted report: " . $report['title']);

    json_response(['message' => 'Report deleted successfully']);
}

function get_table_columns(PDO $pdo, string $table): array
{
    $stmt = $pdo->query("SHOW COLUMNS FROM `$table`");
    $columns = [];
    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $column) {
        $columns[$column['Field']] = $column;
    }
    return $columns;
}

function parse_enum_values(?string $type): array
{
    if (!$type) {
        return [];
    }
    if (!preg_match('/^enum\\((.*)\\)$/i', $type, $matches)) {
        return [];
    }
    $values = [];
    if (preg_match_all("/'((?:\\\\'|[^'])*)'/", $matches[1], $valueMatches)) {
        foreach ($valueMatches[1] as $value) {
            $values[] = str_replace("\\'", "'", $value);
        }
    }
    return $values;
}

function ensure_projects_schema(PDO $pdo): array
{
    $columns = get_table_columns($pdo, 'projects');
    $addColumns = [
        'revenue' => "ALTER TABLE projects ADD COLUMN revenue DECIMAL(15,2) DEFAULT NULL",
        'spent' => "ALTER TABLE projects ADD COLUMN spent DECIMAL(15,2) DEFAULT 0",
        'fabricator_budgets' => "ALTER TABLE projects ADD COLUMN fabricator_budgets JSON NULL",
        'fabricator_allocation' => "ALTER TABLE projects ADD COLUMN fabricator_allocation DECIMAL(15,2) DEFAULT NULL",
        'materials_allocation' => "ALTER TABLE projects ADD COLUMN materials_allocation DECIMAL(15,2) DEFAULT NULL",
        'supervisor_allocation' => "ALTER TABLE projects ADD COLUMN supervisor_allocation DECIMAL(15,2) DEFAULT NULL",
        'company_allocation' => "ALTER TABLE projects ADD COLUMN company_allocation DECIMAL(15,2) DEFAULT NULL",
        'documentation_url' => "ALTER TABLE projects ADD COLUMN documentation_url TEXT NULL",
        'client_name' => "ALTER TABLE projects ADD COLUMN client_name VARCHAR(255) DEFAULT NULL",
        'attachments' => "ALTER TABLE projects ADD COLUMN attachments JSON NULL",
        'created_by' => "ALTER TABLE projects ADD COLUMN created_by VARCHAR(255) DEFAULT NULL",
        'fabricator_ids' => "ALTER TABLE projects ADD COLUMN fabricator_ids JSON DEFAULT NULL",
        'pending_supervisors' => "ALTER TABLE projects ADD COLUMN pending_supervisors JSON DEFAULT NULL",
        'pending_assignments' => "ALTER TABLE projects ADD COLUMN pending_assignments JSON DEFAULT NULL",
        'project_feedback' => "ALTER TABLE projects ADD COLUMN project_feedback JSON NULL"
    ];

    foreach ($addColumns as $name => $sql) {
        if (!isset($columns[$name])) {
            try {
                $pdo->exec($sql);
                $columns[$name] = ['Field' => $name];
            } catch (PDOException $e) {
                // Ignore schema updates if the environment doesn't allow ALTER TABLE.
            }
        }
    }

    if (isset($columns['status'])) {
        $existing = parse_enum_values($columns['status']['Type'] ?? '');
        $required = [
            '0_Created',
            '1_Assigned_to_FAB',
            '2_Ready_for_Supervisor_Review',
            '3_Ready_for_Admin_Review',
            '4_Ready_for_Client_Signoff',
            'planning',
            'pending-assignment',
            'in-progress',
            'review',
            'completed',
            'on-hold',
            'cancelled'
        ];
        $merged = array_values(array_unique(array_merge($existing, $required)));
        if (count($merged) > count($existing)) {
            $enumList = implode("','", array_map('addslashes', $merged));
            try {
                $pdo->exec("ALTER TABLE projects MODIFY COLUMN status ENUM('" . $enumList . "') DEFAULT 'planning'");
                $columns = get_table_columns($pdo, 'projects');
            } catch (PDOException $e) {
                // Ignore enum update failures and let callers normalize status instead.
            }
        }
    }

    return $columns;
}

function ensure_materials_schema(PDO $pdo): array
{
    $columns = get_table_columns($pdo, 'materials');
    $addColumns = [
        'added_by' => "ALTER TABLE materials ADD COLUMN added_by VARCHAR(255) DEFAULT NULL",
        'status' => "ALTER TABLE materials ADD COLUMN status ENUM('ordered','delivered','in-use','depleted') DEFAULT 'ordered'",
        'supplier' => "ALTER TABLE materials ADD COLUMN supplier VARCHAR(255) DEFAULT NULL",
        'category' => "ALTER TABLE materials ADD COLUMN category VARCHAR(255) DEFAULT NULL"
    ];

    foreach ($addColumns as $name => $sql) {
        if (!isset($columns[$name])) {
            try {
                $pdo->exec($sql);
                $columns[$name] = ['Field' => $name];
            } catch (PDOException $e) {
                // Ignore schema updates if the environment doesn't allow ALTER TABLE.
            }
        }
    }

    return $columns;
}

function ensure_work_logs_schema(PDO $pdo): array
{
    $columns = get_table_columns($pdo, 'work_logs');
    $addColumns = [
        'materials_used' => "ALTER TABLE work_logs ADD COLUMN materials_used JSON NULL"
    ];

    foreach ($addColumns as $name => $sql) {
        if (!isset($columns[$name])) {
            try {
                $pdo->exec($sql);
                $columns[$name] = ['Field' => $name];
            } catch (PDOException $e) {
                // Ignore schema updates if the environment doesn't allow ALTER TABLE.
            }
        }
    }

    return $columns;
}

function normalize_project_status(string $status, array $columns): string
{
    $status = trim($status);
    if ($status === '') {
        return 'planning';
    }
    $enumValues = parse_enum_values($columns['status']['Type'] ?? '');
    if (!$enumValues) {
        return $status;
    }
    if (in_array($status, $enumValues, true)) {
        return $status;
    }
    if (in_array('planning', $enumValues, true)) {
        return 'planning';
    }
    return $enumValues[0] ?? $status;
}

function handle_create_project(PDO $pdo): void
{
    require_login();
    $body = sanitize_recursive(json_input());

    $columns = ensure_projects_schema($pdo);

    $projectId = 'project-' . time() . '-' . substr(md5(microtime()), 0, 6);

    $title = trim($body['name'] ?? $body['title'] ?? '');
    if ($title === '') {
        json_response(['error' => 'Project title is required'], 400);
    }

    $pendingSupervisors = [];
    if (!empty($body['broadcastToSupervisors'])) {
        $stmt = $pdo->query("SELECT id FROM users WHERE role = 'supervisor' AND is_active = 1");
        $supervisors = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $pendingSupervisors = $supervisors;
    }

    $statusInput = $body['status'] === '1_Assigned_to_FAB' ? 'planning' : $body['status'];
    $status = normalize_project_status((string) $statusInput, $columns);

    $fabricatorIds = $body['fabricatorIds'] ?? $body['fabricator_ids'] ?? [];
    if (!is_array($fabricatorIds)) {
        $fabricatorIds = [];
    }

    $pendingAssignments = $body['pendingAssignments'] ?? $body['pending_assignments'] ?? [];
    if (!is_array($pendingAssignments)) {
        $pendingAssignments = [];
    }

    $documentationUrl = $body['documentationUrl'] ?? $body['documentation_url'] ?? null;
    if (is_string($documentationUrl) && trim($documentationUrl) === '') {
        $documentationUrl = null;
    }

    $clientName = $body['clientName'] ?? $body['client_name'] ?? null;
    if (is_string($clientName) && trim($clientName) === '') {
        $clientName = null;
    }

    $payload = [
        'id' => $projectId,
        'title' => $title,
        'description' => $body['description'] ?? null,
        'status' => $status,
        'priority' => $body['priority'] ?? 'medium',
        'progress' => $body['progress'] ?? 0,
        'start_date' => $body['startDate'] ?? $body['start_date'] ?? null,
        'due_date' => $body['endDate'] ?? ($body['dueDate'] ?? ($body['due_date'] ?? null)),
        'budget' => $body['budget'] ?? 0.00,
        'revenue' => $body['revenue'] ?? 0.00,
        'spent' => $body['spent'] ?? 0.00,
        'fabricator_budgets' => json_encode($body['fabricatorBudgets'] ?? []),
        'fabricator_allocation' => $body['fabricatorAllocation'] ?? $body['fabricator_allocation'] ?? 0.00,
        'materials_allocation' => $body['materialsAllocation'] ?? $body['materials_allocation'] ?? 0.00,
        'supervisor_allocation' => $body['supervisorAllocation'] ?? $body['supervisor_allocation'] ?? 0.00,
        'company_allocation' => $body['companyAllocation'] ?? $body['company_allocation'] ?? 0.00,
        'documentation_url' => $documentationUrl,
        'client_id' => $body['clientId'] ?? $body['client_id'] ?? null,
        'client_name' => $clientName,
        'supervisor_id' => $body['supervisorId'] ?? $body['supervisor_id'] ?? null,
        'fabricator_ids' => json_encode($fabricatorIds),
        'pending_supervisors' => json_encode($pendingSupervisors),
        'pending_assignments' => json_encode($pendingAssignments),
        'project_feedback' => json_encode($body['projectFeedback'] ?? $body['project_feedback'] ?? $body['feedbackEntries'] ?? $body['feedback_entries'] ?? []),
        'created_by' => $_SESSION['user_id'] ?? ($body['createdBy'] ?? null),
    ];

    $filtered = [];
    foreach ($payload as $field => $value) {
        if (isset($columns[$field])) {
            $filtered[$field] = $value;
        }
    }

    if (empty($filtered)) {
        json_response(['error' => 'No valid project fields to insert'], 400);
    }

    $fields = array_keys($filtered);
    $placeholders = array_map(function ($field) {
        return ':' . $field;
    }, $fields);

    $sql = 'INSERT INTO projects (' . implode(', ', $fields) . ') VALUES (' . implode(', ', $placeholders) . ')';

    try {
        $stmt = $pdo->prepare($sql);
        $params = [];
        foreach ($filtered as $field => $value) {
            $params[':' . $field] = $value;
        }
        $stmt->execute($params);
        // LOGGING
        log_activity($pdo, $_SESSION['user_id'], 'CREATE_PROJECT', "Created project: $title");

        $stmt = $pdo->prepare('SELECT * FROM projects WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $projectId]);
        $project = $stmt->fetch();

        json_response($project);
    } catch (PDOException $e) {
        json_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

function handle_update_project(PDO $pdo, string $id): void
{
    require_login();
    $body = sanitize_recursive(json_input());
    $columns = ensure_projects_schema($pdo);
    $updates = [];

    if (array_key_exists('title', $body) || array_key_exists('name', $body)) {
        $updates['title'] = $body['title'] ?? $body['name'];
    }
    if (array_key_exists('description', $body)) {
        $updates['description'] = $body['description'];
    }
    if (array_key_exists('status', $body)) {
        $updates['status'] = normalize_project_status((string) $body['status'], $columns);
    }
    if (array_key_exists('priority', $body)) {
        $updates['priority'] = $body['priority'];
    }
    if (array_key_exists('progress', $body)) {
        $updates['progress'] = $body['progress'];
    }
    if (array_key_exists('startDate', $body) || array_key_exists('start_date', $body)) {
        $updates['start_date'] = $body['startDate'] ?? $body['start_date'];
    }
    if (array_key_exists('endDate', $body) || array_key_exists('dueDate', $body) || array_key_exists('due_date', $body)) {
        $updates['due_date'] = $body['endDate'] ?? $body['dueDate'] ?? $body['due_date'];
    }
    if (array_key_exists('budget', $body)) {
        $updates['budget'] = $body['budget'];
    }
    if (array_key_exists('spent', $body)) {
        $updates['spent'] = $body['spent'];
    }
    if (array_key_exists('revenue', $body)) {
        $updates['revenue'] = $body['revenue'];
    }

    if (array_key_exists('clientId', $body) || array_key_exists('client_id', $body)) {
        $updates['client_id'] = $body['clientId'] ?? $body['client_id'];
    }
    if (array_key_exists('clientName', $body) || array_key_exists('client_name', $body)) {
        $clientName = $body['clientName'] ?? $body['client_name'];
        if (is_string($clientName) && trim($clientName) === '') {
            $clientName = null;
        }
        $updates['client_name'] = $clientName;
    }
    if (array_key_exists('supervisorId', $body) || array_key_exists('supervisor_id', $body)) {
        $updates['supervisor_id'] = $body['supervisorId'] ?? $body['supervisor_id'];
    }
    if (array_key_exists('fabricatorIds', $body) || array_key_exists('fabricator_ids', $body)) {
        $fabricatorIds = $body['fabricatorIds'] ?? $body['fabricator_ids'] ?? [];
        if (!is_array($fabricatorIds)) {
            $fabricatorIds = [];
        }
        $updates['fabricator_ids'] = json_encode($fabricatorIds);
    }
    if (array_key_exists('fabricatorBudgets', $body) || array_key_exists('fabricator_budgets', $body)) {
        $fabricatorBudgets = $body['fabricatorBudgets'] ?? $body['fabricator_budgets'] ?? [];
        if (!is_array($fabricatorBudgets)) {
            $fabricatorBudgets = [];
        }
        $updates['fabricator_budgets'] = json_encode($fabricatorBudgets);
    }
    if (array_key_exists('pendingAssignments', $body) || array_key_exists('pending_assignments', $body)) {
        $pendingAssignments = $body['pendingAssignments'] ?? $body['pending_assignments'] ?? [];
        if (!is_array($pendingAssignments)) {
            $pendingAssignments = [];
        }
        $updates['pending_assignments'] = json_encode($pendingAssignments);
    }

    if (array_key_exists('fabricatorAllocation', $body) || array_key_exists('fabricator_allocation', $body)) {
        $updates['fabricator_allocation'] = $body['fabricatorAllocation'] ?? $body['fabricator_allocation'];
    }
    if (array_key_exists('materialsAllocation', $body) || array_key_exists('materials_allocation', $body)) {
        $updates['materials_allocation'] = $body['materialsAllocation'] ?? $body['materials_allocation'];
    }
    if (array_key_exists('supervisorAllocation', $body) || array_key_exists('supervisor_allocation', $body)) {
        $updates['supervisor_allocation'] = $body['supervisorAllocation'] ?? $body['supervisor_allocation'];
    }
    if (array_key_exists('companyAllocation', $body) || array_key_exists('company_allocation', $body)) {
        $updates['company_allocation'] = $body['companyAllocation'] ?? $body['company_allocation'];
    }

    if (array_key_exists('documentationUrl', $body) || array_key_exists('documentation_url', $body)) {
        $documentationUrl = $body['documentationUrl'] ?? $body['documentation_url'];
        if (is_string($documentationUrl) && trim($documentationUrl) === '') {
            $documentationUrl = null;
        }
        $updates['documentation_url'] = $documentationUrl;
    }
    if (array_key_exists('attachments', $body)) {
    $attachments = $body['attachments'];
    if (!is_array($attachments)) {
        $attachments = [];
    }
    $updates['attachments'] = json_encode($attachments);
}

    if (array_key_exists('projectFeedback', $body) ||
        array_key_exists('project_feedback', $body) ||
        array_key_exists('feedbackEntries', $body) ||
        array_key_exists('feedback_entries', $body)) {
        $feedbackEntries = $body['projectFeedback']
            ?? $body['project_feedback']
            ?? $body['feedbackEntries']
            ?? $body['feedback_entries']
            ?? [];
        if (!is_array($feedbackEntries)) {
            $feedbackEntries = [];
        }
        $updates['project_feedback'] = json_encode($feedbackEntries);
    }

    if (!empty($body['broadcastToSupervisors'])) {
        $stmt = $pdo->query("SELECT id FROM users WHERE role = 'supervisor' AND is_active = 1");
        $supervisors = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $updates['pending_supervisors'] = json_encode($supervisors);
    }

    $fields = [];
    $params = [':id' => $id];
    foreach ($updates as $field => $value) {
        if (!isset($columns[$field])) {
            continue;
        }
        $fields[] = "$field = :$field";
        $params[":$field"] = $value;
    }

    if (empty($fields)) {
        json_response(['message' => 'No changes provided']);
    }

    $sql = "UPDATE projects SET " . implode(', ', $fields) . " WHERE id = :id";
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    } catch (PDOException $e) {
        json_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }

    $stmt = $pdo->prepare('SELECT * FROM projects WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $project = $stmt->fetch();

    // LOGGING
    log_activity($pdo, $_SESSION['user_id'], 'UPDATE_PROJECT', "Updated project: " . ($project['title'] ?? $id));

    json_response($project);
}

function handle_delete_project(PDO $pdo, string $id): void
{
    require_login();
    
    $stmt = $pdo->prepare('SELECT title FROM projects WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $project = $stmt->fetch();
    $title = $project['title'] ?? 'Unknown';

    $stmt = $pdo->prepare('DELETE FROM projects WHERE id = :id');
    $stmt->execute([':id' => $id]);

    // LOGGING
    log_activity($pdo, $_SESSION['user_id'], 'DELETE_PROJECT', "Deleted project: $title");

    json_response(['message' => 'Project deleted']);
}

function handle_broadcast_fabricators(PDO $pdo): void
{
    require_login();
    $body = sanitize_recursive(json_input());
    $projectId = $body['projectId'] ?? null;
    $message = $body['message'] ?? '';

    if (!$projectId) {
        json_response(['error' => 'Project ID is required'], 400);
    }

    $stmt = $pdo->query("SELECT id FROM users WHERE role = 'fabricator' AND is_active = 1");
    $fabricators = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($fabricators)) {
        json_response(['message' => 'No active fabricators found']);
    }

    $newAssignments = [];
    foreach ($fabricators as $fabId) {
        $newAssignments[] = [
            'id' => 'pa-' . time() . '-' . substr(md5($fabId), 0, 5),
            'projectId' => $projectId,
            'fabricatorId' => $fabId,
            'assignedBy' => $_SESSION['user_id'],
            'assignedAt' => gmdate('c'),
            'status' => 'pending',
            'message' => $message
        ];
    }

    $stmt = $pdo->prepare('SELECT pending_assignments FROM projects WHERE id = :id');
    $stmt->execute([':id' => $projectId]);
    $row = $stmt->fetch();

    $existing = json_decode($row['pending_assignments'] ?? '[]', true) ?: [];
    $existingFabIds = array_column($existing, 'fabricatorId');
    $finalAssignments = $existing;

    foreach ($newAssignments as $new) {
        if (!in_array($new['fabricatorId'], $existingFabIds)) {
            $finalAssignments[] = $new;
        }
    }

    $stmt = $pdo->prepare('UPDATE projects SET pending_assignments = :pa, status = :status WHERE id = :id');
    $stmt->execute([
        ':pa' => json_encode($finalAssignments),
        ':status' => 'pending-assignment',
        ':id' => $projectId
    ]);

    // LOGGING
    log_activity($pdo, $_SESSION['user_id'], 'BROADCAST', "Broadcasted project $projectId to fabricators");

    json_response(['message' => 'Broadcasted to ' . count($fabricators) . ' fabricators', 'assignments' => $finalAssignments]);
}

function handle_respond_assignment(PDO $pdo): void
{
    require_login();
    $body = sanitize_recursive(json_input());
    $projectId = $body['projectId'] ?? null;
    $assignmentId = $body['assignmentId'] ?? null; 
    $response = $body['response'] ?? 'accepted'; 
    $role = $_SESSION['role'];
    $userId = $_SESSION['user_id'];

    if (!$projectId) {
        json_response(['error' => 'Project ID is required'], 400);
    }

    // LOGGING CONTEXT (We log at the end, but prepare message here)
    $logAction = $response === 'accepted' ? 'ACCEPT_PROJECT' : 'DECLINE_PROJECT';

    // 1. Handle Supervisor Response
    if ($role === 'supervisor') {
        $stmt = $pdo->prepare('SELECT pending_supervisors FROM projects WHERE id = :id');
        $stmt->execute([':id' => $projectId]);
        $proj = $stmt->fetch();
        $pendingSups = json_decode($proj['pending_supervisors'] ?? '[]', true) ?: [];

        if (in_array($userId, $pendingSups)) {
            if ($response === 'accepted') {
                $stmt = $pdo->prepare('UPDATE projects SET supervisor_id = :sid, pending_supervisors = NULL WHERE id = :pid');
                $stmt->execute([':sid' => $userId, ':pid' => $projectId]);
                
                log_activity($pdo, $userId, $logAction, "Supervisor accepted project $projectId");
                json_response(['message' => 'Project accepted', 'status' => 'accepted']);
            } else {
                $newPending = array_values(array_diff($pendingSups, [$userId]));
                $stmt = $pdo->prepare('UPDATE projects SET pending_supervisors = :ps WHERE id = :pid');
                $stmt->execute([':ps' => json_encode($newPending), ':pid' => $projectId]);
                
                log_activity($pdo, $userId, $logAction, "Supervisor declined project $projectId");
                json_response(['message' => 'Project declined', 'status' => 'declined']);
            }
        }
    }

    // 2. Handle Fabricator Response
    if ($role === 'fabricator') {
        $stmt = $pdo->prepare('SELECT pending_assignments, fabricator_ids FROM projects WHERE id = :id');
        $stmt->execute([':id' => $projectId]);
        $proj = $stmt->fetch();

        $pending = json_decode($proj['pending_assignments'] ?? '[]', true) ?: [];
        $currentFabs = json_decode($proj['fabricator_ids'] ?? '[]', true) ?: [];

        $foundIndex = -1;
        foreach ($pending as $idx => $assign) {
            if (($assignmentId && $assign['id'] === $assignmentId) || $assign['fabricatorId'] === $userId) {
                $foundIndex = $idx;
                break;
            }
        }

        if ($foundIndex !== -1) {
            if ($response === 'accepted') {
                $pending[$foundIndex]['status'] = 'accepted';
                $pending[$foundIndex]['respondedAt'] = gmdate('c');

                if (!in_array($userId, $currentFabs)) {
                    $currentFabs[] = $userId;
                }

                $stmt = $pdo->prepare('UPDATE projects SET pending_assignments = :pa, fabricator_ids = :fids, status = :status WHERE id = :id');
                $stmt->execute([
                    ':pa' => json_encode($pending),
                    ':fids' => json_encode($currentFabs),
                    ':status' => 'in-progress',
                    ':id' => $projectId
                ]);
                log_activity($pdo, $userId, $logAction, "Fabricator accepted assignment for project $projectId");
            } else {
                $pending[$foundIndex]['status'] = 'declined';
                $pending[$foundIndex]['respondedAt'] = gmdate('c');

                $stmt = $pdo->prepare('UPDATE projects SET pending_assignments = :pa WHERE id = :id');
                $stmt->execute([':pa' => json_encode($pending), ':id' => $projectId]);
                log_activity($pdo, $userId, $logAction, "Fabricator declined assignment for project $projectId");
            }
            json_response(['message' => 'Assignment ' . $response, 'assignments' => $pending]);
        } else {
            json_response(['error' => 'No pending assignment found'], 404);
        }
    }

    json_response(['message' => 'No action taken']);
}

function handle_login(PDO $pdo): void
{
    $body = sanitize_recursive(json_input());
    $identifier = $body['identifier'] ?? '';
    $password = $body['password'] ?? '';

    if ($identifier === '' || $password === '') {
        json_response(['error' => 'Identifier and password are required'], 400);
    }

    $searchId = $identifier;
    if (strtolower($identifier) === 'admin') {
        $stmt = $pdo->prepare('SELECT * FROM users WHERE role = "admin" AND is_active = 1 LIMIT 1');
        $stmt->execute();
    } else {
        $stmt = $pdo->prepare(
            'SELECT * FROM users WHERE (id = :id OR secure_id = :id OR employee_number = :id OR email = :id) AND is_active = 1 LIMIT 1'
        );
        $stmt->execute([':id' => $searchId]);
    }
    $user = $stmt->fetch();

    if (!$user) {
        json_response(['error' => 'User not found'], 404);
    }

    if (!password_verify($password, $user['password_hash'])) {
        json_response(['error' => 'Invalid password'], 401);
    }

    $_SESSION['user_id'] = $user['id'];
    $_SESSION['role'] = $user['role'];

    // LOGGING
    log_activity($pdo, $user['id'], 'LOGIN', 'User logged in successfully');

    $token = base64_encode(random_bytes(32));
    unset($user['password_hash']);

    json_response([
        'user' => $user,
        'token' => $token,
    ]);
}

function handle_signup(PDO $pdo): void
{
    $body = sanitize_recursive(json_input());

    $email    = isset($body['email'])    ? trim(strtolower($body['email'])) : '';
    $password = $body['password']         ?? '';
    $name     = trim($body['name']        ?? '');

    if ($email === '' || $password === '' || $name === '') {
        json_response(['error' => 'Email, password, and name are required'], 400);
    }

    // Check if email already exists
    $check = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $check->execute([':email' => $email]);
    if ($check->fetch()) {
        json_response(['error' => 'User already exists with this email'], 409);
    }

    // Role logic
    $allowedRoles = ['fabricator', 'supervisor', 'client', 'admin'];
    $role = isset($body['role']) && in_array($body['role'], $allowedRoles) 
        ? $body['role'] 
        : 'fabricator';

    // Generate secure_id
    $prefix = match ($role) {
        'supervisor' => 'SUP',
        'client'     => 'CLI',
        'admin'      => 'ADM',
        default      => 'FAB',
    };
    $secureId = $prefix . strtoupper(base_convert(time(), 10, 36)) . strtoupper(substr(bin2hex(random_bytes(2)), 0, 3));

    $employeeNumber = 'EMP' . substr((string)time(), -6) . str_pad((string)random_int(0, 999), 3, '0', STR_PAD_LEFT);

    $passwordHash = password_hash($password, PASSWORD_BCRYPT);

    $userId = 'user-' . time() . '-' . bin2hex(random_bytes(4)); // better uniqueness

    // Insert new user
    $stmt = $pdo->prepare(
        'INSERT INTO users 
            (id, name, email, password_hash, role, school, phone, gcash_number, secure_id, employee_number, is_active)
         VALUES 
            (:id, :name, :email, :password_hash, :role, :school, :phone, :gcash_number, :secure_id, :employee_number, 1)'
    );

    $stmt->execute([
        ':id'             => $userId,
        ':name'           => $name,
        ':email'          => $email,
        ':password_hash'  => $passwordHash,
        ':role'           => $role,
        ':school'         => $body['school']       ?? null,
        ':phone'          => $body['phone']        ?? null,
        ':gcash_number'   => $body['gcashNumber']  ?? null,
        ':secure_id'      => $secureId,
        ':employee_number'=> $employeeNumber,
    ]);

    $user = [
        'id'              => $userId,
        'name'            => $name,
        'email'           => $email,
        'role'            => $role,
        'school'          => $body['school']       ?? null,
        'phone'           => $body['phone']        ?? null,
        'gcash_number'    => $body['gcashNumber']  ?? null,
        'secure_id'       => $secureId,
        'employee_number' => $employeeNumber,
        'is_active'       => 1,
    ];

    // LOGGING
    log_activity($pdo, $userId, 'SIGNUP', "New user registered: $name ($role)");

    json_response([
        'success' => true,
        'message' => 'Registration successful! Please log in with your new credentials.',
        'user'    => $user,
    ]);
}

function handle_logout(PDO $pdo = null): void
{
    // Optional: log the logout activity
    if (isset($_SESSION['user_id']) && $pdo) {
        log_activity($pdo, $_SESSION['user_id'], 'LOGOUT', 'User logged out');
    }

    $_SESSION = [];                        // Clear session data
    if (ini_get('session.use_cookies')) {  // Delete session cookie
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params['path'],
            $params['domain'],
            $params['secure'],
            $params['httponly']
        );
    }
    session_destroy();                     // Destroy the session

    json_response(['message' => 'Logged out']);
}

function handle_me(PDO $pdo): void
{
    if (empty($_SESSION['user_id'])) {
        json_response(['user' => null]);
    }
    $stmt = $pdo->prepare('SELECT id, name, email, role, school, phone, gcash_number, secure_id, employee_number, is_active, created_at FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $_SESSION['user_id']]);
    $user = $stmt->fetch();
    if (!$user) {
        json_response(['user' => null]);
    }
    json_response(['user' => $user]);
}

function handle_get_projects(PDO $pdo): void
{
    require_login();
    $stmt = $pdo->query('SELECT * FROM projects ORDER BY created_at DESC');
    $projects = $stmt->fetchAll();
    json_response($projects);
}

function handle_get_tasks(PDO $pdo): void
{
    require_login();
    $stmt = $pdo->query('SELECT * FROM tasks ORDER BY created_at DESC');
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];

    foreach ($tasks as &$task) {
        // 1. Decode the assigned_to JSON string into a PHP array
        if (!empty($task['assigned_to'])) {
            $decoded = json_decode($task['assigned_to'], true);
            $task['assignedTo'] = is_array($decoded) ? $decoded : [];
        } else {
            $task['assignedTo'] = [];
        }

        // 2. Map snake_case to camelCase for the Frontend
        $task['projectId'] = $task['project_id'];
        $task['dueDate'] = $task['due_date'];
        $task['createdBy'] = $task['created_by'];
        $task['createdAt'] = $task['created_at'];
        $task['updatedAt'] = $task['updated_at'];
        $task['estimatedHours'] = $task['estimated_hours'];
        $task['actualHours'] = $task['actual_hours'];

        // 3. Optional: Remove original snake_case keys to keep response clean
        unset(
            $task['assigned_to'], 
            $task['project_id'], 
            $task['due_date'], 
            $task['created_by'], 
            $task['created_at'], 
            $task['updated_at'],
            $task['estimated_hours'],
            $task['actual_hours']
        );
    }
    unset($task); // Break reference

    json_response($tasks);
}

function handle_create_task(PDO $pdo): void
{
    require_login();
    $body = json_input(); // Don't use sanitize_recursive here yet if it mangles arrays
    $taskId = 'task-' . time();

    $title = trim((string) ($body['title'] ?? ''));
    $description = trim((string) ($body['description'] ?? ''));
    $status = trim((string) ($body['status'] ?? ''));
    $priority = trim((string) ($body['priority'] ?? ''));
    $projectId = trim((string) ($body['projectId'] ?? ''));
    $dueDate = trim((string) ($body['dueDate'] ?? ''));
    $createdBy = trim((string) ($body['createdBy'] ?? ''));
    
    // Handle assignedTo as an array or string
    $assignedToData = $body['assignedTo'] ?? [];
    // Convert array to JSON string for DB storage, otherwise keep as string
    $assignedToEncoded = is_array($assignedToData) ? json_encode($assignedToData) : $assignedToData;

    $missing = [];
    if ($projectId === '') $missing[] = 'projectId';
    if ($title === '') $missing[] = 'title';
    if ($description === '') $missing[] = 'description';
    if ($status === '') $missing[] = 'status';
    if ($priority === '') $missing[] = 'priority';
    if (empty($assignedToData) || $assignedToData === 'unassigned') $missing[] = 'assignedTo';
    if ($dueDate === '') $missing[] = 'dueDate';
    if ($createdBy === '') $missing[] = 'createdBy';

    if ($missing) {
        json_response(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO tasks (id, project_id, title, description, status, priority, assigned_to, created_by, due_date, estimated_hours, actual_hours)
         VALUES (:id, :project_id, :title, :description, :status, :priority, :assigned_to, :created_by, :due_date, :estimated_hours, :actual_hours)'
    );

    $stmt->execute([
        ':id' => $taskId,
        ':project_id' => $projectId,
        ':title' => $title,
        ':description' => $description,
        ':status' => $status,
        ':priority' => $priority,
        ':assigned_to' => $assignedToEncoded, // Stored as JSON string
        ':created_by' => $createdBy,
        ':due_date' => $dueDate,
        ':estimated_hours' => $body['estimatedHours'] ?? 0,
        ':actual_hours' => $body['actualHours'] ?? 0,
    ]);

    log_activity($pdo, $_SESSION['user_id'], 'CREATE_TASK', "Created task: " . $title);

    $stmt = $pdo->prepare('SELECT * FROM tasks WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $taskId]);
    $task = $stmt->fetch();

    json_response($task);
}

function handle_get_worklogs(PDO $pdo): void
{
    require_login();
    $stmt = $pdo->query('SELECT * FROM work_logs ORDER BY created_at DESC');
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
    foreach ($logs as &$log) {
        $log['projectId'] = $log['project_id'] ?? null;
        $log['fabricatorId'] = $log['user_id'] ?? null;
        $log['hoursWorked'] = $log['hours_worked'] ?? null;
        $log['progressPercentage'] = $log['progress_percentage'] ?? null;
        if (array_key_exists('materials_used', $log)) {
            $decoded = json_decode($log['materials_used'] ?? '[]', true);
            $log['materials'] = is_array($decoded) ? $decoded : [];
        }
    }
    unset($log);
    json_response($logs);
}

function handle_create_worklog(PDO $pdo): void
{
    require_login();

    $rawInput = file_get_contents('php://input');
    $body = json_decode($rawInput, true);

    $projectId = $body['projectId'] ?? $body['project_id'] ?? $body['projectid'] ?? null;
    $userId = $body['fabricatorId'] ?? $body['fabricator_id'] ?? $body['userId'] ?? $body['user_id'] ?? $body['userid'] ?? null;
    $date = $body['date'] ?? null;
    $hoursInput = $body['hoursWorked'] ?? $body['hours_worked'] ?? $body['hoursworked'] ?? null;

    $hasHours = isset($hoursInput) && $hoursInput !== '';

    if (!$projectId || !$userId || !$date || !$hasHours) {
        json_response([
            'error' => "Server Validation Failed. Missing fields.",
            'received_data' => $body
        ], 400);
    }

    $hours = floatval($hoursInput);
    $description = $body['description'] ?? null;
    $progressPercentage = $body['progressPercentage'] ?? $body['progress_percentage'] ?? 0;

    $materialsUsed = null;
    if (!empty($body['materials']) && is_array($body['materials'])) {
        $materialsUsed = json_encode($body['materials']);
    } elseif (!empty($body['materialsUsed']) && is_array($body['materialsUsed'])) {
        $materialsUsed = json_encode($body['materialsUsed']);
    }

    $workLogId = 'wl-' . time() . '-' . substr(md5(microtime()), 0, 6);
    $columns = ensure_work_logs_schema($pdo);
    $hasMaterialsColumn = isset($columns['materials_used']);

    try {
        $insertColumns = [
            'id',
            'project_id',
            'user_id',
            'date',
            'hours_worked',
            'description',
            'progress_percentage'
        ];
        $placeholders = [
            ':id',
            ':project_id',
            ':user_id',
            ':date',
            ':hours_worked',
            ':description',
            ':progress_percentage'
        ];
        $params = [
            ':id' => $workLogId,
            ':project_id' => $projectId,
            ':user_id' => $userId,
            ':date' => $date,
            ':hours_worked' => $hours,
            ':description' => $description,
            ':progress_percentage' => $progressPercentage
        ];

        if ($hasMaterialsColumn) {
            $insertColumns[] = 'materials_used';
            $placeholders[] = ':materials_used';
            $params[':materials_used'] = $materialsUsed;
        }

        $stmt = $pdo->prepare(
            "INSERT INTO work_logs (" . implode(', ', $insertColumns) . ")
             VALUES (" . implode(', ', $placeholders) . ")"
        );
        $stmt->execute($params);

        apply_project_progress_delta($pdo, $projectId, floatval($progressPercentage));

        // LOGGING
        log_activity($pdo, $_SESSION['user_id'], 'CREATE_WORKLOG', "Added $hours hours to project $projectId");

        $stmt = $pdo->prepare('SELECT * FROM work_logs WHERE id = :id');
        $stmt->execute([':id' => $workLogId]);
        $log = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

        $log['fabricatorId'] = $log['user_id'];
        if (array_key_exists('materials_used', $log)) {
            $log['materials'] = json_decode($log['materials_used'] ?? '[]', true);
        }

        json_response($log);

    } catch (PDOException $e) {
        json_response(['error' => 'Database SQL Error: ' . $e->getMessage()], 500);
    }
}

function handle_update_worklog(PDO $pdo, string $id): void
{
    require_login();
    $body = sanitize_recursive(json_input());

    $stmt = $pdo->prepare('SELECT project_id, progress_percentage FROM work_logs WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $existingLog = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$existingLog) {
        json_response(['error' => 'Work log not found'], 404);
    }
    $projectId = (string) ($existingLog['project_id'] ?? '');
    $previousProgress = floatval($existingLog['progress_percentage'] ?? 0);
    $progressDelta = 0.0;

    $fields = [];
    $params = [':id' => $id];
    $columns = ensure_work_logs_schema($pdo);
    $hasMaterialsColumn = isset($columns['materials_used']);

    if (array_key_exists('date', $body)) {
        $date = $body['date'];
        if (is_string($date) && trim($date) === '') {
            json_response(['error' => 'date is required'], 400);
        }
        $fields[] = 'date = :date';
        $params[':date'] = $date;
    }

    if (
        array_key_exists('hoursWorked', $body) ||
        array_key_exists('hours_worked', $body) ||
        array_key_exists('hoursworked', $body)
    ) {
        $hoursInput = $body['hoursWorked'] ?? $body['hours_worked'] ?? $body['hoursworked'] ?? 0;
        $hoursValue = ($hoursInput === '' || $hoursInput === null) ? 0 : floatval($hoursInput);
        $fields[] = 'hours_worked = :hours_worked';
        $params[':hours_worked'] = $hoursValue;
    }

    if (array_key_exists('description', $body)) {
        $fields[] = 'description = :description';
        $params[':description'] = $body['description'];
    }

    if (array_key_exists('progressPercentage', $body) || array_key_exists('progress_percentage', $body)) {
        $progressInput = $body['progressPercentage'] ?? $body['progress_percentage'] ?? 0;
        $progressValue = floatval($progressInput);
        $fields[] = 'progress_percentage = :progress_percentage';
        $params[':progress_percentage'] = $progressValue;
        $progressDelta = $progressValue - $previousProgress;
    }

    if (
        array_key_exists('materials', $body) ||
        array_key_exists('materialsUsed', $body) ||
        array_key_exists('materials_used', $body)
    ) {
        if ($hasMaterialsColumn) {
            $materialsInput = $body['materials'] ?? $body['materialsUsed'] ?? $body['materials_used'] ?? null;
            if ($materialsInput === null) {
                $materialsJson = null;
            } elseif (is_array($materialsInput)) {
                $materialsJson = json_encode($materialsInput);
            } else {
                $materialsJson = json_encode([$materialsInput]);
            }
            $fields[] = 'materials_used = :materials_used';
            $params[':materials_used'] = $materialsJson;
        }
    }

    if (empty($fields)) {
        json_response(['message' => 'No changes provided'], 400);
    }

    $sql = "UPDATE work_logs SET " . implode(', ', $fields) . " WHERE id = :id";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if ($progressDelta != 0.0 && $projectId !== '') {
            apply_project_progress_delta($pdo, $projectId, $progressDelta);
        }

        $stmt = $pdo->prepare('SELECT * FROM work_logs WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $log = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$log) {
            json_response(['error' => 'Work log not found or update failed'], 404);
        }

        // LOGGING
        log_activity($pdo, $_SESSION['user_id'], 'UPDATE_WORKLOG', "Updated work log: $id");

        $log['projectId'] = $log['project_id'] ?? null;
        $log['fabricatorId'] = $log['user_id'] ?? null;
        $log['hoursWorked'] = $log['hours_worked'] ?? null;
        $log['progressPercentage'] = $log['progress_percentage'] ?? null;
        if (array_key_exists('materials_used', $log)) {
            $log['materials'] = json_decode($log['materials_used'] ?? '[]', true);
        }

        json_response($log);
    } catch (PDOException $e) {
        json_response(['error' => 'Database SQL Error: ' . $e->getMessage()], 500);
    }
}

function handle_delete_worklog(PDO $pdo, string $id): void
{
    require_login();

    $stmt = $pdo->prepare('SELECT project_id, progress_percentage FROM work_logs WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $log = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$log) {
        json_response(['error' => 'Work log not found'], 404);
    }
    $projectId = (string) ($log['project_id'] ?? '');
    $progressDelta = -floatval($log['progress_percentage'] ?? 0);

    $stmt = $pdo->prepare('DELETE FROM work_logs WHERE id = :id');
    $stmt->execute([':id' => $id]);

    if ($progressDelta != 0.0 && $projectId !== '') {
        apply_project_progress_delta($pdo, $projectId, $progressDelta);
    }

    // LOGGING
    log_activity($pdo, $_SESSION['user_id'], 'DELETE_WORKLOG', "Deleted work log: $id");

    json_response([
        'message' => 'Work log deleted',
        'id' => $id,
        'projectId' => $log['project_id'] ?? null
    ]);
}

function handle_get_materials(PDO $pdo): void
{
    require_login();
    $stmt = $pdo->query('SELECT * FROM materials ORDER BY added_at DESC');
    $materials = $stmt->fetchAll();
    json_response($materials);
}

function handle_create_material(PDO $pdo): void
{
    require_login();
    $body = sanitize_recursive(json_input());
    $columns = ensure_materials_schema($pdo);
    $materialId = 'mat-' . time();

    $name = trim($body['name'] ?? '');
    if ($name === '' || !isset($body['quantity'])) {
        json_response(['error' => 'name and quantity are required'], 400);
    }

    $projectIdRaw = $body['projectId'] ?? $body['project_id'] ?? null;
    $projectId = is_string($projectIdRaw) ? trim($projectIdRaw) : '';
    if ($projectId === '' || in_array(strtolower($projectId), ['general', 'none'], true)) {
        $projectId = 'general';
    }

    $costPerUnit = $body['costPerUnit'] ?? $body['cost_per_unit'] ?? $body['cost'] ?? null;
    $totalCost = $body['totalCost'] ?? $body['total_cost'] ?? null;
    if ($totalCost === null && $costPerUnit !== null && isset($body['quantity'])) {
        $totalCost = (float) $body['quantity'] * (float) $costPerUnit;
    }

    $payload = [
        'id' => $materialId,
        'project_id' => $projectId,
        'name' => $name,
        'description' => $body['description'] ?? null,
        'quantity' => $body['quantity'],
        'unit' => $body['unit'] ?? null,
        'cost_per_unit' => $costPerUnit,
        'total_cost' => $totalCost,
        'added_by' => $_SESSION['user_id'] ?? ($body['addedBy'] ?? $body['added_by'] ?? null),
        'status' => $body['status'] ?? 'ordered',
        'supplier' => $body['supplier'] ?? null,
        'category' => $body['category'] ?? null
    ];

    $filtered = [];
    foreach ($payload as $field => $value) {
        if (isset($columns[$field])) {
            $filtered[$field] = $value;
        }
    }

    if (empty($filtered)) {
        json_response(['error' => 'No valid material fields to insert'], 400);
    }

    $fields = array_keys($filtered);
    $placeholders = array_map(function ($field) {
        return ':' . $field;
    }, $fields);

    $sql = 'INSERT INTO materials (' . implode(', ', $fields) . ') VALUES (' . implode(', ', $placeholders) . ')';

    try {
        $stmt = $pdo->prepare($sql);
        $params = [];
        foreach ($filtered as $field => $value) {
            $params[':' . $field] = $value;
        }
        $stmt->execute($params);
    } catch (PDOException $e) {
        json_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }

    // LOGGING
    log_activity($pdo, $_SESSION['user_id'], 'ADD_MATERIAL', "Added material: " . $name);

    $stmt = $pdo->prepare('SELECT * FROM materials WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $materialId]);
    $material = $stmt->fetch();

    json_response($material);
}


function get_emails_by_roles(PDO $pdo, array $targetRoles): array
{
    // If "all" is selected, fetch everyone active
    if (in_array('all', $targetRoles)) {
        $stmt = $pdo->query("SELECT email, name FROM users WHERE is_active = 1 AND email IS NOT NULL AND email != ''");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Safety check: if roles array is empty, return empty list
    if (empty($targetRoles)) {
        return [];
    }

    // Filter by specific roles
    // Create placeholders for the IN clause (e.g., ?, ?, ?)
    $placeholders = implode(',', array_fill(0, count($targetRoles), '?'));
    
    $sql = "SELECT email, name FROM users WHERE is_active = 1 AND role IN ($placeholders) AND email IS NOT NULL AND email != ''";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($targetRoles);
    
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

 function send_announcement_notification(array $recipients, string $title, string $content, string $authorName)
{
    if (empty($recipients)) return;

    // We instantiate PHPMailer inside the function to ensure a fresh instance
    $mail = new PHPMailer(true);

    try {
        // --- SERVER SETTINGS ---
        $mail->SMTPDebug = 0;                     
        $mail->isSMTP();                                            
        $mail->Host       = 'smtp.gmail.com';     
        $mail->SMTPAuth   = true;                                   
        $mail->Username   = 'arkquestdev@gmail.com';  
        $mail->Password   = 'hhjgxeprnxljiqdm';       
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;         
        $mail->Port       = 587;                                    

        // --- SENDER ---
        $mail->setFrom($mail->Username, 'Elektronik Hub');
        // Add sender as 'To' address to satisfy strict SMTP servers, while real recipients are BCC
        $mail->addAddress($mail->Username, 'Announcement Bot');

        // --- RECIPIENTS (BCC) ---
        foreach ($recipients as $user) {
            if (!empty($user['email'])) {
                $mail->addBCC($user['email'], $user['name']);
            }
        }

        // --- CONTENT ---
        $mail->isHTML(true);                                  
        $mail->Subject = 'New Announcement: ' . $title;
        
        // Format the content (newlines to HTML breaks)
        $htmlContent = nl2br(htmlspecialchars($content));
        
        $emailBody = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>
            <h2 style='color: #2563eb; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;'>Elektronik Hub</h2>
            <p style='font-size: 14px; color: #555;'><strong>$authorName</strong> posted a new announcement:</p>
            
            <div style='background-color: #f8fafc; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0;'>
                <h3 style='margin-top: 0; color: #1e293b;'>$title</h3>
                <div style='color: #334155; line-height: 1.6;'>$htmlContent</div>
            </div>
            
            <p style='font-size: 12px; color: #94a3b8; margin-top: 30px;'>
                Log in to the portal to view full details.
            </p>
        </div>";

        $mail->Body    = $emailBody;
        $mail->AltBody = "New Announcement: $title \n\n $content \n\n - Posted by $authorName";

        $mail->send();
        return true;

    } catch (\Throwable $e) { 
        // Catch ANY error (Authentication, Network, Class not found)
        error_log("MAILER ERROR: " . $e->getMessage());
        return false;
    }
}

function handle_update_material(PDO $pdo, string $id): void
{
    require_login();
    $body = sanitize_recursive(json_input());
    $columns = ensure_materials_schema($pdo);

    // 1. Fetch existing material to ensure it exists and to get current values for recalculation
    $stmt = $pdo->prepare("SELECT * FROM materials WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        json_response(['error' => 'Material not found'], 404);
    }

    $updates = [];

    // 2. Map Frontend Fields to Database Columns
    if (array_key_exists('name', $body)) $updates['name'] = trim($body['name']);
    if (array_key_exists('description', $body)) $updates['description'] = $body['description'];
    if (array_key_exists('unit', $body)) $updates['unit'] = $body['unit'];
    if (array_key_exists('supplier', $body)) $updates['supplier'] = $body['supplier'];
    if (array_key_exists('category', $body)) $updates['category'] = $body['category'];
    if (array_key_exists('status', $body)) $updates['status'] = $body['status'];
    
    // Handle Project ID logic (similar to create)
    if (array_key_exists('projectId', $body) || array_key_exists('project_id', $body)) {
        $pid = $body['projectId'] ?? $body['project_id'];
        if ($pid === '' || in_array(strtolower((string)$pid), ['general', 'none'], true)) {
            $updates['project_id'] = 'general';
        } else {
            $updates['project_id'] = $pid;
        }
    }

    // 3. Handle Cost and Quantity Recalculation
    // We determine the *new* quantity and cost, using existing values if not provided in body
    $newQuantity = isset($body['quantity']) ? (float)$body['quantity'] : (float)$existing['quantity'];
    
    // Frontend sends 'cost', backend stores 'cost_per_unit'
    $inputCost = $body['cost'] ?? $body['costPerUnit'] ?? $body['cost_per_unit'] ?? null;
    $newCostPerUnit = $inputCost !== null ? (float)$inputCost : (float)$existing['cost_per_unit'];

    // If either changed, update the fields and the total
    if (isset($body['quantity']) || $inputCost !== null) {
        $updates['quantity'] = $newQuantity;
        $updates['cost_per_unit'] = $newCostPerUnit;
        $updates['total_cost'] = $newQuantity * $newCostPerUnit;
    }

    // 4. Build SQL Query
    $fields = [];
    $params = [':id' => $id];

    foreach ($updates as $field => $value) {
        if (!isset($columns[$field])) continue; // Safety check against schema
        $fields[] = "$field = :$field";
        $params[":$field"] = $value;
    }

    if (empty($fields)) {
        json_response(['message' => 'No changes provided']);
    }

    $sql = "UPDATE materials SET " . implode(', ', $fields) . " WHERE id = :id";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
    } catch (PDOException $e) {
        json_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }

    // LOGGING
    log_activity($pdo, $_SESSION['user_id'], 'UPDATE_MATERIAL', "Updated material: " . ($updates['name'] ?? $existing['name']));

    // Return the updated object
    $stmt = $pdo->prepare('SELECT * FROM materials WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    json_response($stmt->fetch(PDO::FETCH_ASSOC));
}

function handle_delete_material(PDO $pdo, string $id): void
{
    require_login();

    // Fetch name for logging purposes before deletion
    $stmt = $pdo->prepare("SELECT name FROM materials WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $id]);
    $material = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$material) {
        json_response(['error' => 'Material not found'], 404);
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM materials WHERE id = :id");
        $stmt->execute([':id' => $id]);
    } catch (PDOException $e) {
        json_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }

    // LOGGING
    log_activity($pdo, $_SESSION['user_id'], 'DELETE_MATERIAL', "Deleted material: " . $material['name']);

    json_response(['success' => true, 'id' => $id]);
}
function handle_get_users(PDO $pdo): void
{
    require_login();
    $stmt = $pdo->query(
        'SELECT * FROM users WHERE is_active = 1 ORDER BY created_at DESC'
    );
    $users = $stmt->fetchAll();
    json_response($users);
}

function handle_get_inactive_users(PDO $pdo): void
{
    require_login();
    $stmt = $pdo->query(
        'SELECT * FROM users WHERE is_active = 0 ORDER BY created_at DESC'
    );
    $users = $stmt->fetchAll();
    json_response($users);
}

function handle_create_client(PDO $pdo): void
{
    require_login();
    $body = sanitize_recursive(json_input());

    $name = trim($body['name'] ?? '');
    $email = isset($body['email']) ? trim(strtolower($body['email'])) : '';
    $password = $body['password'] ?? '';
    $projectId = $body['projectId'] ?? null;
    $projectName = $body['projectName'] ?? null;

    if ($name === '' || $email === '' || $password === '' || !$projectId) {
        json_response(['error' => 'Name, email, password, and projectId are required'], 400);
    }

    $check = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $check->execute([':email' => $email]);
    if ($check->fetch()) {
        json_response(['error' => 'User already exists with this email'], 409);
    }

    $secureId = 'CLI' . strtoupper(base_convert(time(), 10, 36)) . strtoupper(substr(bin2hex(random_bytes(2)), 0, 3));
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    $userId = 'user-' . time();

    try {
        // 1. Start a database transaction
        $pdo->beginTransaction();

        // 2. Insert the new User
        $stmt = $pdo->prepare(
            'INSERT INTO users (id, name, email, password_hash, role, school, phone, secure_id, client_project_id, is_active)
             VALUES (:id, :name, :email, :password_hash, :role, :school, :phone, :secure_id, :client_project_id, 1)'
        );

        $stmt->execute([
            ':id' => $userId,
            ':name' => $name,
            ':email' => $email,
            ':password_hash' => $passwordHash,
            ':role' => 'client',
            ':school' => $projectName,
            ':phone' => $body['phone'] ?? null,
            ':secure_id' => $secureId,
            ':client_project_id' => $projectId,
        ]);

        // 3. UPDATE the Project table with the new Client Name and ID
        // This is the part missing from your original code
        $updateProject = $pdo->prepare(
            'UPDATE projects 
             SET client_id = :client_id, 
                 client_name = :client_name 
             WHERE id = :project_id'
        );

        $updateProject->execute([
            ':client_id' => $userId,
            ':client_name' => $name,
            ':project_id' => $projectId
        ]);

        // 4. Commit the transaction (save changes)
        $pdo->commit();

        // LOGGING
        log_activity($pdo, $_SESSION['user_id'], 'CREATE_CLIENT', "Created client: $name for project $projectId");

        // Send Email
        $emailSent = send_client_credentials_email($email, $name, $password, $projectName, $secureId);

        $stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch();
        unset($user['password_hash']);

        $user['email_sent'] = $emailSent;

        json_response(['user' => $user]);

    } catch (\Throwable $e) {
        // If anything goes wrong, roll back changes so we don't have broken data
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        json_response(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}
function handle_verify_password(PDO $pdo): void
{
    require_login(); 
    $body = json_input();
    $inputPassword = $body['password'] ?? '';

    $stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $_SESSION['user_id']]);
    $user = $stmt->fetch();

    if (!$user) {
        json_response(['success' => false, 'message' => 'User not found'], 404);
    }

    if (password_verify($inputPassword, $user['password_hash'])) {
        json_response(['success' => true]);
    } else {
        json_response(['success' => false, 'message' => 'Incorrect password'], 403);
    }
}

function handle_get_activity_logs(PDO $pdo): void
{
    require_login();
    
    // Only admins should see logs
    if ($_SESSION['role'] !== 'admin') {
        json_response(['error' => 'Unauthorized'], 403);
    }

    // Join with users table to get the name of the person who did the action
    $sql = "
        SELECT l.*, u.name as user_name, u.role as user_role 
        FROM activity_logs l
        LEFT JOIN users u ON l.user_id = u.id
        ORDER BY l.created_at DESC 
        LIMIT 200
    ";
    
    $stmt = $pdo->query($sql);
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    json_response($logs);
}

// ----------------------------------------------------------------------
// ANNOUNCEMENT HANDLERS
// ----------------------------------------------------------------------

function handle_get_announcements(PDO $pdo): void
{
    require_login();
    $currentUserRole = $_SESSION['role'];

    // Fetch all recent announcements
    $sql = "
        SELECT a.*, u.name as author_name 
        FROM announcements a
        JOIN users u ON a.created_by = u.id
        ORDER BY a.created_at DESC
        LIMIT 50
    ";

    $stmt = $pdo->query($sql);
    $all = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $filtered = [];

    // Filter in PHP because JSON querying varies by SQL version
    foreach ($all as $ann) {
        // Decode the target roles (e.g., '["admin", "supervisor"]')
        $targets = json_decode($ann['target_role'] ?? '[]', true);
        if (!is_array($targets)) $targets = [];

        // Logic: Show if:
        // 1. User is Admin (sees everything)
        // 2. Targets include 'all'
        // 3. Targets include the user's specific role
        if ($currentUserRole === 'admin' || in_array('all', $targets) || in_array($currentUserRole, $targets)) {
            $filtered[] = $ann;
        }
    }

    json_response($filtered);
}

function handle_create_announcement(PDO $pdo): void
{
    require_login();
    
    if (!in_array($_SESSION['role'], ['admin', 'supervisor'])) {
        json_response(['error' => 'Unauthorized'], 403);
    }

    $body = sanitize_recursive(json_input());
    $roles = $body['targetRoles'] ?? ['all'];
    $rolesJson = json_encode($roles);

    // 1. Insert into Database
    try {
        $stmt = $pdo->prepare("INSERT INTO announcements (title, content, created_by, target_role) VALUES (:title, :content, :uid, :roles)");
        $stmt->execute([
            ':title'   => $body['title'],
            ':content' => $body['content'],
            ':uid'     => $_SESSION['user_id'],
            ':roles'   => $rolesJson
        ]);
        
        log_activity($pdo, $_SESSION['user_id'], 'POST_ANNOUNCEMENT', "Posted: " . $body['title']);
    } catch (PDOException $e) {
        json_response(['error' => 'Database error: ' . $e->getMessage()], 500);
        return;
    }

    // 2. Debug Email Sending
    $emailDebug = "Init";
    try {
        $stmtName = $pdo->prepare("SELECT name FROM users WHERE id = :id");
        $stmtName->execute([':id' => $_SESSION['user_id']]);
        $authorName = $stmtName->fetchColumn() ?: 'Management';

        // Check if we actually found recipients
        $recipients = get_emails_by_roles($pdo, $roles);
        $recipientCount = count($recipients);

        if ($recipientCount > 0) {
            // Attempt to send
            $sent = send_announcement_notification($recipients, $body['title'], $body['content'], $authorName);
            $emailDebug = $sent ? "Success ($recipientCount recipients)" : "Failed to send (Mailer returned false)";
        } else {
            $emailDebug = "No recipients found in database for roles: " . implode(", ", $roles);
        }
    } catch (\Throwable $e) {
        // Capture the specific error message
        $emailDebug = "Exception: " . $e->getMessage();
    }

    // Return the debug info to the frontend
    json_response([
        'message' => 'Posted successfully', 
        'email_status' => $emailDebug
    ]);
}
function handle_update_announcement(PDO $pdo, string $path): void
{
    require_login();
    
    // Only Admin can edit ANY post. Supervisors can only edit their own? 
    // Requirement says: "Admin can edit announcement of other users"
    
    if (preg_match('#/announcements/(\d+)#', $path, $matches)) {
        $id = $matches[1];
    } else {
        json_response(['error' => 'Invalid ID'], 400);
    }

    $body = sanitize_recursive(json_input());
    
    // Check permission
    if ($_SESSION['role'] !== 'admin') {
        // If not admin, check if they own it
        $check = $pdo->prepare("SELECT created_by FROM announcements WHERE id = :id");
        $check->execute([':id' => $id]);
        $owner = $check->fetchColumn();
        if ($owner !== $_SESSION['user_id']) {
            json_response(['error' => 'Unauthorized'], 403);
        }
    }

    $fields = [];
    $params = [':id' => $id];

    if (!empty($body['title'])) {
        $fields[] = "title = :title";
        $params[':title'] = $body['title'];
    }
    if (!empty($body['content'])) {
        $fields[] = "content = :content";
        $params[':content'] = $body['content'];
    }
    if (!empty($body['targetRoles'])) {
        $fields[] = "target_role = :roles";
        $params[':roles'] = json_encode($body['targetRoles']);
    }

    if (empty($fields)) {
        json_response(['message' => 'No changes']);
    }

    $sql = "UPDATE announcements SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    log_activity($pdo, $_SESSION['user_id'], 'EDIT_ANNOUNCEMENT', "Edited announcement ID: $id");
    json_response(['message' => 'Updated successfully']);
}

function handle_delete_announcement(PDO $pdo, string $path): void
{
    require_login();
    
    if (preg_match('#/announcements/(\d+)#', $path, $matches)) {
        $id = $matches[1];
    } else {
        json_response(['error' => 'Invalid ID'], 400);
    }

    // Admin can delete anyone's. Supervisors can delete their own.
    if ($_SESSION['role'] !== 'admin') {
        $check = $pdo->prepare("SELECT created_by FROM announcements WHERE id = :id");
        $check->execute([':id' => $id]);
        $owner = $check->fetchColumn();
        if ($owner !== $_SESSION['user_id']) {
            json_response(['error' => 'Unauthorized'], 403);
        }
    }

    $stmt = $pdo->prepare("DELETE FROM announcements WHERE id = :id");
    $stmt->execute([':id' => $id]);

    log_activity($pdo, $_SESSION['user_id'], 'DELETE_ANNOUNCEMENT', "Deleted announcement ID: $id");
    json_response(['message' => 'Deleted successfully']);
}

function send_client_credentials_email($recipientEmail, $recipientName, $plainPassword, $projectName, $secureId) {
    // Create instance. "true" enables exceptions
    $mail = new PHPMailer(true);

    try {
        // --- SERVER SETTINGS ---
        $mail->SMTPDebug = 0;                      // 0 = OFF. (CRITICAL for JSON APIs)
        $mail->isSMTP();                                            
        $mail->Host       = 'smtp.gmail.com';     
        $mail->SMTPAuth   = true;                                   
        
        // --- YOUR CREDENTIALS ---
        $mail->Username   = 'arkquestdev@gmail.com';   // Your Gmail address
        $mail->Password   = 'hhjgxeprnxljiqdm';         // Your 16-digit App Password
        
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;         
        $mail->Port       = 587;                                    

        // --- RECIPIENTS ---
        $mail->setFrom($mail->Username, 'Electronik Hub');
        $mail->addAddress($recipientEmail, $recipientName);

        // --- CONTENT ---
        $mail->isHTML(true);                                  
        $mail->Subject = 'Your Client Access Credentials - ' . $projectName;
        
        $emailBody = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;'>
            <div style='text-align: center; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 20px;'>
                <h2 style='color: #2563eb; margin: 0;'>Elektronik Hub</h2>
                <p style='color: #666; margin: 5px 0 0; font-size: 14px;'>Project Management Portal</p>
            </div>

            <p>Hello <strong>$recipientName</strong>,</p>
            <p>Welcome to <strong>Elektronik Hub</strong>! A client account has been created for you to view the progress of project: <strong>$projectName</strong>.</p>
            
            <div style='background-color: #f5f8fa; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #e1e8ed;'>
               
                <p style='margin: 5px 0;'><strong>Client ID:</strong> <span style='font-family: monospace;'>$secureId</span></p>
                <p style='margin: 5px 0;'><strong>Email:</strong> $recipientEmail</p>
                <p style='margin: 5px 0;'><strong>Password:</strong> <span style='font-family: monospace; background: #ddd; padding: 2px 6px; border-radius: 4px;'>$plainPassword</span></p>
            </div>

            <p>Best regards,<br><strong>The Elektronik Hub Team</strong></p>

            <p style='color: #999; font-size: 11px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;'>This is an automated message sent from the Elektronik Hub system. Please do not reply.</p>
        </div>
        ";

        $mail->Body    = $emailBody;
        $mail->AltBody = "Hello $recipientName,\n\nYour account for $projectName is ready.\n\nClient ID: $secureId\nEmail: $recipientEmail\nPassword: $plainPassword\n\nLogin at: http://localhost:5173/login";

        $mail->send();
        return true;

    } catch (Throwable $e) { 
        // We use 'Throwable' to catch ANY crash.
        // We log it to the server file system, but we return 'false' so the script continues.
        error_log("MAILER ERROR: " . $e->getMessage());
        return false;
    }

   

/**
 * Helper: Fetch emails based on target roles
 */

}
