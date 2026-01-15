<?php

// Simple PHP API router to replace Node/Express backend

require __DIR__ . '/config.php';

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

    // We need to handle dynamic routes manually in the default or before switch
   default:
    if (preg_match('#^PUT /tasks/([^/]+)$#', $method . ' ' . $path, $matches)) {
        handle_update_task($pdo, $matches[1]);
    } elseif (preg_match('#^DELETE /tasks/([^/]+)$#', $method . ' ' . $path, $matches)) {
        handle_delete_task($pdo, $matches[1]);
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
    } else {
        json_response(['error' => 'Not found'], 404);
    }
    break;
    }

// ----------------------------------------------------------------------
// HELPER: Activity Logger
// ----------------------------------------------------------------------
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
    } catch (Exception $e) {
        // Silently fail if logging fails to not break the app
        error_log("Logging failed: " . $e->getMessage());
    }
}

// ----------------------------------------------------------------------
// HANDLERS
// ----------------------------------------------------------------------

function handle_update_task(PDO $pdo, string $id): void
{
    require_login();
    $body = sanitize_recursive(json_input());

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
        'actual_hours',
        'updated_at'
    ];

    foreach ($allowed as $field) {
        $val = null;
        if (isset($body[$field])) {
            $val = $body[$field];
        }
        if ($field === 'project_id' && isset($body['projectId'])) $val = $body['projectId'];
        if ($field === 'assigned_to' && isset($body['assignedTo'])) $val = $body['assignedTo'];
        if ($field === 'due_date' && isset($body['dueDate'])) $val = $body['dueDate'];
        if ($field === 'estimated_hours' && isset($body['estimatedHours'])) $val = $body['estimatedHours'];
        if ($field === 'actual_hours' && isset($body['actualHours'])) $val = $body['actualHours'];
        if ($field === 'updated_at' && isset($body['updatedAt'])) $val = $body['updatedAt'];

        if ($val !== null) {
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

    $sql = "UPDATE tasks SET " . implode(', ', $fields) . " WHERE id = :id";
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmt = $pdo->prepare('SELECT * FROM tasks WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $task = $stmt->fetch();

        if (!$task) {
             json_response(['error' => 'Task not found or update failed'], 404);
        }

        // LOGGING
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
        'created_by' => "ALTER TABLE projects ADD COLUMN created_by VARCHAR(255) DEFAULT NULL"
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

    $statusInput = $body['status'] ?? 'planning';
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

    $email = isset($body['email']) ? trim(strtolower($body['email'])) : '';
    $password = $body['password'] ?? '';
    $name = trim($body['name'] ?? '');

    if ($email === '' || $password === '' || $name === '') {
        json_response(['error' => 'Email, password, and name are required'], 400);
    }

    $check = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $check->execute([':email' => $email]);
    if ($check->fetch()) {
        json_response(['error' => 'User already exists with this email'], 409);
    }

    $allowedRoles = ['fabricator', 'supervisor', 'client', 'admin'];
    $role = isset($body['role']) && in_array($body['role'], $allowedRoles) ? $body['role'] : 'fabricator';

    if ($role === 'supervisor') {
        $secureId = 'SUP' . strtoupper(base_convert(time(), 10, 36)) . strtoupper(substr(bin2hex(random_bytes(2)), 0, 3));
    } elseif ($role === 'client') {
        $secureId = 'CLI' . strtoupper(base_convert(time(), 10, 36)) . strtoupper(substr(bin2hex(random_bytes(2)), 0, 3));
    } elseif ($role === 'admin') {
        $secureId = 'ADM' . strtoupper(base_convert(time(), 10, 36)) . strtoupper(substr(bin2hex(random_bytes(2)), 0, 3));
    } else {
        $secureId = 'FAB' . strtoupper(base_convert(time(), 10, 36)) . strtoupper(substr(bin2hex(random_bytes(2)), 0, 3));
    }
    $employeeNumber = 'EMP' . substr((string)time(), -6) . str_pad((string)random_int(0, 999), 3, '0', STR_PAD_LEFT);
    $passwordHash = password_hash($password, PASSWORD_BCRYPT);

    $userId = 'user-' . time();

    $stmt = $pdo->prepare(
        'INSERT INTO users (id, name, email, password_hash, role, school, phone, gcash_number, secure_id, employee_number, is_active)
         VALUES (:id, :name, :email, :password_hash, :role, :school, :phone, :gcash_number, :secure_id, :employee_number, 1)'
    );
    $stmt->execute([
        ':id' => $userId,
        ':name' => $name,
        ':email' => $email,
        ':password_hash' => $passwordHash,
        ':role' => $role,
        ':school' => $body['school'] ?? null,
        ':phone' => $body['phone'] ?? null,
        ':gcash_number' => $body['gcashNumber'] ?? null,
        ':secure_id' => $secureId,
        ':employee_number' => $employeeNumber,
    ]);

    $user = [
        'id' => $userId,
        'name' => $name,
        'email' => $email,
        'role' => $role,
        'school' => $body['school'] ?? null,
        'phone' => $body['phone'] ?? null,
        'gcash_number' => $body['gcashNumber'] ?? null,
        'secure_id' => $secureId,
        'employee_number' => $employeeNumber,
        'is_active' => 1,
    ];

    $_SESSION['user_id'] = $userId;
    $_SESSION['role'] = 'fabricator';

    // LOGGING
    log_activity($pdo, $userId, 'SIGNUP', "New user registered: $name ($role)");

    $token = base64_encode(random_bytes(32));

    json_response([
        'user' => $user,
        'token' => $token,
    ]);
}

function handle_logout(PDO $pdo = null): void
{
    // Log before destroying session
    if (isset($_SESSION['user_id']) && $pdo) {
        log_activity($pdo, $_SESSION['user_id'], 'LOGOUT', 'User logged out');
    }

    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
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
    session_destroy();
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
    $tasks = $stmt->fetchAll();
    json_response($tasks);
}

function handle_create_task(PDO $pdo): void
{
    require_login();
    $body = sanitize_recursive(json_input());
    $taskId = 'task-' . time();

    $title = trim((string) ($body['title'] ?? ''));
    $description = trim((string) ($body['description'] ?? ''));
    $status = trim((string) ($body['status'] ?? ''));
    $priority = trim((string) ($body['priority'] ?? ''));
    $projectId = trim((string) ($body['projectId'] ?? ''));
    $assignedTo = trim((string) ($body['assignedTo'] ?? ''));
    $dueDate = trim((string) ($body['dueDate'] ?? ''));
    $createdBy = trim((string) ($body['createdBy'] ?? ''));

    $missing = [];
    if ($projectId === '') $missing[] = 'projectId';
    if ($title === '') $missing[] = 'title';
    if ($description === '') $missing[] = 'description';
    if ($status === '') $missing[] = 'status';
    if ($priority === '') $missing[] = 'priority';
    if ($assignedTo === '' || $assignedTo === 'unassigned') $missing[] = 'assignedTo';
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
        ':assigned_to' => $assignedTo,
        ':created_by' => $createdBy,
        ':due_date' => $dueDate,
        ':estimated_hours' => $body['estimatedHours'] ?? 0,
        ':actual_hours' => $body['actualHours'] ?? 0,
    ]);

    // LOGGING
    log_activity($pdo, $_SESSION['user_id'], 'CREATE_TASK', "Created task: " . $body['title']);

    $stmt = $pdo->prepare('SELECT * FROM tasks WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $taskId]);
    $task = $stmt->fetch();

    json_response($task);
}

function handle_get_worklogs(PDO $pdo): void
{
    require_login();
    $stmt = $pdo->query('SELECT * FROM work_logs ORDER BY created_at DESC');
    $logs = $stmt->fetchAll();
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

    try {
        $stmt = $pdo->prepare("
            INSERT INTO work_logs 
            (id, project_id, user_id, date, hours_worked, description, progress_percentage, materials_used)
            VALUES (:id, :project_id, :user_id, :date, :hours_worked, :description, :progress_percentage, :materials_used)
        ");

        $stmt->execute([
            ':id'                => $workLogId,
            ':project_id'        => $projectId,
            ':user_id'           => $userId,
            ':date'              => $date,
            ':hours_worked'      => $hours,
            ':description'       => $description,
            ':progress_percentage' => $progressPercentage,
            ':materials_used'    => $materialsUsed,
        ]);

        // LOGGING
        log_activity($pdo, $_SESSION['user_id'], 'CREATE_WORKLOG', "Added $hours hours to project $projectId");

        $stmt = $pdo->prepare('SELECT * FROM work_logs WHERE id = :id');
        $stmt->execute([':id' => $workLogId]);
        $log = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

        $log['fabricatorId'] = $log['user_id'];
        $log['materials'] = json_decode($log['materials_used'] ?? '[]', true);

        json_response($log);

    } catch (PDOException $e) {
        json_response(['error' => 'Database SQL Error: ' . $e->getMessage()], 500);
    }
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
    $materialId = 'mat-' . time();

    if (empty($body['projectId']) || empty($body['name']) || !isset($body['quantity'])) {
        json_response(['error' => 'projectId, name, and quantity are required'], 400);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO materials (id, project_id, name, description, quantity, unit, cost_per_unit, total_cost)
         VALUES (:id, :project_id, :name, :description, :quantity, :unit, :cost_per_unit, :total_cost)'
    );

    $stmt->execute([
        ':id' => $materialId,
        ':project_id' => $body['projectId'],
        ':name' => $body['name'],
        ':description' => $body['description'] ?? null,
        ':quantity' => $body['quantity'],
        ':unit' => $body['unit'] ?? null,
        ':cost_per_unit' => $body['costPerUnit'] ?? null,
        ':total_cost' => $body['totalCost'] ?? null,
    ]);

    // LOGGING
    log_activity($pdo, $_SESSION['user_id'], 'ADD_MATERIAL', "Added material: " . $body['name']);

    $stmt = $pdo->prepare('SELECT * FROM materials WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $materialId]);
    $material = $stmt->fetch();

    json_response($material);
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

    // LOGGING
    log_activity($pdo, $_SESSION['user_id'], 'CREATE_CLIENT', "Created client: $name for project $projectId");

    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();
    unset($user['password_hash']);

    json_response(['user' => $user]);
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
    
    if (empty($body['title']) || empty($body['content'])) {
        json_response(['error' => 'Title and content are required'], 400);
    }

    // Expecting an array of roles from frontend, e.g., ["admin", "fabricator"]
    $roles = $body['targetRoles'] ?? ['all'];
    $rolesJson = json_encode($roles);

    $stmt = $pdo->prepare("INSERT INTO announcements (title, content, created_by, target_role) VALUES (:title, :content, :uid, :roles)");
    $stmt->execute([
        ':title' => $body['title'],
        ':content' => $body['content'],
        ':uid' => $_SESSION['user_id'],
        ':roles' => $rolesJson
    ]);

    log_activity($pdo, $_SESSION['user_id'], 'POST_ANNOUNCEMENT', "Posted: " . $body['title']);
    json_response(['message' => 'Posted successfully']);
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