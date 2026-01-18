-- Ehub Project Management System Database
-- Deployment SQL for phpMyAdmin
-- Created: 2024

-- Create database
CREATE DATABASE IF NOT EXISTS `ehubph_pms` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ehubph_pms`;

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'supervisor', 'fabricator', 'client') NOT NULL,
  `school` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `gcash_number` VARCHAR(20) DEFAULT NULL,
  `secure_id` VARCHAR(50) UNIQUE DEFAULT NULL,
  `employee_number` VARCHAR(50) UNIQUE DEFAULT NULL,
  `client_project_id` VARCHAR(255) DEFAULT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_secure_id` (`secure_id`),
  INDEX `idx_employee_number` (`employee_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Projects table
CREATE TABLE IF NOT EXISTS `projects` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `status` ENUM(
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
  ) DEFAULT 'planning',
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  `progress` INT DEFAULT 0,
  `start_date` DATE DEFAULT NULL,
  `due_date` DATE DEFAULT NULL,
  `budget` DECIMAL(15,2) DEFAULT NULL,
  `revenue` DECIMAL(15,2) DEFAULT NULL,
  `spent` DECIMAL(15,2) DEFAULT 0,
  `fabricator_budgets` JSON DEFAULT NULL,
  `fabricator_allocation` DECIMAL(15,2) DEFAULT NULL,
  `materials_allocation` DECIMAL(15,2) DEFAULT NULL,
  `supervisor_allocation` DECIMAL(15,2) DEFAULT NULL,
  `company_allocation` DECIMAL(15,2) DEFAULT NULL,
  `documentation_url` TEXT DEFAULT NULL,
  `client_id` VARCHAR(255) DEFAULT NULL,
  `client_name` VARCHAR(255) DEFAULT NULL,
  `supervisor_id` VARCHAR(255) DEFAULT NULL,
  `fabricator_ids` JSON DEFAULT NULL,
  `pending_supervisors` JSON DEFAULT NULL,
  `pending_assignments` JSON DEFAULT NULL,
  `created_by` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_status` (`status`),
  INDEX `idx_client_id` (`client_id`),
  INDEX `idx_supervisor_id` (`supervisor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tasks table
CREATE TABLE IF NOT EXISTS `tasks` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `status` ENUM('pending', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
  `priority` ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  `assigned_to` VARCHAR(255) DEFAULT NULL,
  `created_by` VARCHAR(255) DEFAULT NULL,
  `due_date` DATE DEFAULT NULL,
  `estimated_hours` DECIMAL(5,2) DEFAULT NULL,
  `actual_hours` DECIMAL(5,2) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_project_id` (`project_id`),
  INDEX `idx_assigned_to` (`assigned_to`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Work logs table
CREATE TABLE IF NOT EXISTS `work_logs` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(255) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `date` DATE NOT NULL,
  `hours_worked` DECIMAL(5,2) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `progress_percentage` DECIMAL(5,2) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_project_id` (`project_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Materials table
CREATE TABLE IF NOT EXISTS `materials` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `project_id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `quantity` DECIMAL(10,2) NOT NULL,
  `unit` VARCHAR(50) DEFAULT NULL,
  `cost_per_unit` DECIMAL(10,2) DEFAULT NULL,
  `total_cost` DECIMAL(15,2) DEFAULT NULL,
  `added_by` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('ordered','delivered','in-use','depleted') DEFAULT 'ordered',
  `supplier` VARCHAR(255) DEFAULT NULL,
  `category` VARCHAR(255) DEFAULT NULL,
  `added_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reports table
CREATE TABLE IF NOT EXISTS `reports` (
  `id` VARCHAR(255) NOT NULL PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `type` ENUM('project', 'task', 'user', 'financial', 'custom') DEFAULT 'custom',
  `status` ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  `project_id` VARCHAR(255) DEFAULT NULL,
  `shared_with` JSON DEFAULT NULL,
  `created_by` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_reports_status` (`status`),
  INDEX `idx_reports_type` (`type`),
  INDEX `idx_reports_project` (`project_id`),
  INDEX `idx_reports_creator` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity logs table
CREATE TABLE IF NOT EXISTS `activity_logs` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` VARCHAR(255) NOT NULL,
  `action` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_activity_user_id` (`user_id`),
  INDEX `idx_activity_action` (`action`),
  INDEX `idx_activity_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user
INSERT IGNORE INTO `users` (
  `id`, `name`, `email`, `password_hash`, `role`, `secure_id`, `employee_number`, `is_active`
) VALUES (
  'admin-1',
  'System Administrator',
  'admin@ehub.com',
  '$2y$10$eZ8YF4H2jz6xywtquWObQemHuvi1VGEBa7a8st7PzJd27UgB/tr1u', -- password: admin123
  'admin',
  'ADM001',
  'EMP001',
  TRUE
);

-- Insert sample data for testing
INSERT IGNORE INTO `users` (
  `id`, `name`, `email`, `password_hash`, `role`, `secure_id`, `employee_number`, `is_active`
) VALUES (
  'supervisor-1',
  'John Supervisor',
  'supervisor@ehub.com',
  '$2y$10$eZ8YF4H2jz6xywtquWObQemHuvi1VGEBa7a8st7PzJd27UgB/tr1u', -- password: admin123
  'supervisor',
  'SUP001',
  'EMP002',
  TRUE
);

INSERT IGNORE INTO `users` (
  `id`, `name`, `email`, `password_hash`, `role`, `secure_id`, `employee_number`, `is_active`
) VALUES (
  'fabricator-1',
  'Mike Fabricator',
  'fabricator@ehub.com',
  '$2y$10$eZ8YF4H2jz6xywtquWObQemHuvi1VGEBa7a8st7PzJd27UgB/tr1u', -- password: admin123
  'fabricator',
  'FAB001',
  'EMP003',
  TRUE
);

INSERT IGNORE INTO `users` (
  `id`, `name`, `email`, `password_hash`, `role`, `secure_id`, `employee_number`, `is_active`
) VALUES (
  'client-1',
  'Sarah Client',
  'client@ehub.com',
  '$2y$10$eZ8YF4H2jz6xywtquWObQemHuvi1VGEBa7a8st7PzJd27UgB/tr1u', -- password: admin123
  'client',
  'CLI001',
  NULL,
  TRUE
);

-- Insert sample project
INSERT IGNORE INTO `projects` (
  `id`, `title`, `description`, `status`, `priority`, `progress`, `start_date`, `due_date`, `budget`, `client_id`, `supervisor_id`
) VALUES (
  'project-1',
  'Sample Construction Project',
  'A sample construction project for testing the system',
  'planning',
  'high',
  0,
  '2024-01-15',
  '2024-06-15',
  50000.00,
  'client-1',
  'supervisor-1'
);

-- Insert sample tasks
INSERT IGNORE INTO `tasks` (
  `id`, `project_id`, `title`, `description`, `status`, `priority`, `assigned_to`, `created_by`, `due_date`, `estimated_hours`
) VALUES (
  'task-1',
  'project-1',
  'Project Planning',
  'Create detailed project plan and timeline',
  'pending',
  'high',
  'fabricator-1',
  'supervisor-1',
  '2024-02-01',
  8.00
);

INSERT IGNORE INTO `tasks` (
  `id`, `project_id`, `title`, `description`, `status`, `priority`, `assigned_to`, `created_by`, `due_date`, `estimated_hours`
) VALUES (
  'task-2',
  'project-1',
  'Material Procurement',
  'Order and organize required materials',
  'pending',
  'medium',
  'fabricator-1',
  'supervisor-1',
  '2024-02-15',
  4.00
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS `idx_users_role` ON `users` (`role`);
CREATE INDEX IF NOT EXISTS `idx_projects_created_at` ON `projects` (`created_at`);
CREATE INDEX IF NOT EXISTS `idx_tasks_due_date` ON `tasks` (`due_date`);
CREATE INDEX IF NOT EXISTS `idx_work_logs_user_date` ON `work_logs` (`user_id`, `date`);

-- Grant permissions (adjust as needed for your hosting environment)
-- GRANT ALL PRIVILEGES ON ehub_pms.* TO 'your_username'@'localhost';
-- FLUSH PRIVILEGES;

