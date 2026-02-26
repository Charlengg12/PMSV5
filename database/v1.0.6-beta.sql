-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 26, 2026 at 01:18 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `ehubph_pms`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `action` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_id`, `action`, `description`, `ip_address`, `created_at`) VALUES
(1, 'supervisor-1', 'LOGOUT', 'User logged out', '::1', '2026-01-21 06:55:44'),
(2, 'user-1768974134', 'LOGIN', 'User logged in successfully', '::1', '2026-01-21 06:56:07'),
(3, 'admin-1', 'LOGOUT', 'User logged out', '::1', '2026-01-21 23:35:10'),
(4, 'admin-1', 'LOGIN', 'User logged in successfully', '::1', '2026-01-21 23:35:21'),
(5, 'admin-1', 'LOGOUT', 'User logged out', '::1', '2026-01-21 23:35:43'),
(6, 'supervisor-1', 'LOGIN', 'User logged in successfully', '::1', '2026-01-21 23:36:01'),
(7, 'supervisor-1', 'LOGOUT', 'User logged out', '::1', '2026-01-22 02:35:09'),
(8, 'admin-1', 'LOGIN', 'User logged in successfully', '::1', '2026-01-22 02:35:29'),
(9, 'admin-1', 'LOGIN', 'User logged in successfully', '::1', '2026-01-22 04:56:57'),
(10, 'admin-1', 'UPLOAD_GCASH_QR', 'Uploaded new GCash QR: gcash-qr-admin-1-1769057880.png', '::1', '2026-01-22 04:58:00'),
(11, 'admin-1', 'UPDATE_USER', 'Updated user details for: Admin 123 ADmin', '::1', '2026-01-22 04:58:06'),
(12, 'admin-1', 'LOGOUT', 'User logged out', '::1', '2026-01-22 05:00:29'),
(13, 'supervisor-1', 'LOGIN', 'User logged in successfully', '::1', '2026-01-22 05:00:40'),
(14, 'supervisor-1', 'LOGOUT', 'User logged out', '::1', '2026-01-22 05:00:53'),
(15, 'admin-1', 'LOGIN', 'User logged in successfully', '::1', '2026-01-22 05:01:26'),
(16, 'admin-1', 'UPLOAD_GCASH_QR', 'Uploaded new GCash QR: gcash-qr-admin-1-1769058320.png', '::1', '2026-01-22 05:05:20'),
(17, 'admin-1', 'UPLOAD_GCASH_QR', 'Uploaded new GCash QR: gcash-qr-admin-1-1769058419.png', '::1', '2026-01-22 05:06:59'),
(18, 'admin-1', 'UPLOAD_GCASH_QR', 'Uploaded new GCash QR: gcash-qr-admin-1-1769058698.png', '::1', '2026-01-22 05:11:38'),
(19, 'admin-1', 'UPLOAD_GCASH_QR', 'Uploaded new GCash QR: gcash-qr-admin-1-1769058719.png', '::1', '2026-01-22 05:11:59'),
(20, 'user-1768974134', 'LOGIN', 'User logged in successfully', '::1', '2026-01-22 07:02:41'),
(21, 'user-1768974134', 'LOGOUT', 'User logged out', '::1', '2026-01-22 07:55:57'),
(22, 'admin-1', 'LOGOUT', 'User logged out', '::1', '2026-01-22 07:59:17'),
(23, 'admin-1', 'LOGIN', 'User logged in successfully', '::1', '2026-01-22 07:59:41'),
(24, 'admin-1', 'CREATE_PROJECT', 'Created project: test test', '::1', '2026-01-22 08:01:25'),
(25, 'admin-1', 'LOGOUT', 'User logged out', '::1', '2026-01-22 08:06:08'),
(26, 'admin-1', 'LOGIN', 'User logged in successfully', '::1', '2026-01-22 08:06:17'),
(27, 'admin-1', 'CREATE_TASK', 'Created task: make task', '::1', '2026-01-23 00:28:02'),
(28, 'admin-1', 'LOGOUT', 'User logged out', '::1', '2026-01-23 00:28:16'),
(29, 'admin-1', 'LOGIN', 'User logged in successfully', '::1', '2026-01-23 00:28:27'),
(30, 'admin-1', 'CREATE_REPORT', 'Created report: Report 123', '::1', '2026-01-23 00:30:07'),
(31, 'admin-1', 'DELETE_REPORT', 'Deleted report: Report 123', '::1', '2026-01-23 00:30:16'),
(32, 'admin-1', 'LOGOUT', 'User logged out', '::1', '2026-01-23 00:34:16'),
(33, 'admin-1', 'LOGIN', 'User logged in successfully', '::1', '2026-01-23 00:34:23'),
(34, 'user-1769128503-461a31ee', 'SIGNUP', 'New user registered: Super 123 (supervisor)', '::1', '2026-01-23 00:35:03'),
(35, 'admin-1', 'DEACTIVATE_USER', 'Deactivated user: Super 123', '::1', '2026-01-23 00:35:15'),
(36, 'admin-1', 'LOGOUT', 'User logged out', '::1', '2026-01-23 00:35:39'),
(37, 'admin-1', 'LOGIN', 'User logged in successfully', '::1', '2026-01-23 00:35:47'),
(38, 'admin-1', 'LOGOUT', 'User logged out', '::1', '2026-01-23 00:35:51'),
(39, 'user-1768974134', 'LOGIN', 'User logged in successfully', '::1', '2026-01-23 00:36:10'),
(40, 'user-1768974134', 'LOGOUT', 'User logged out', '::1', '2026-01-23 00:36:17'),
(41, 'user-1768974134', 'RESET_PASSWORD', 'Password reset link sent', '::1', '2026-01-23 00:36:37'),
(42, 'user-1768974134', 'RESET_PASSWORD', 'Password updated via reset link', '::1', '2026-01-23 00:37:09'),
(43, 'user-1768974134', 'LOGIN', 'User logged in successfully', '::1', '2026-01-23 00:37:38'),
(44, 'user-1768974134', 'LOGOUT', 'User logged out', '::1', '2026-01-23 00:38:09'),
(45, 'admin-1', 'LOGIN', 'User logged in successfully', '::1', '2026-01-23 01:35:47'),
(46, 'admin-1', 'LOGOUT', 'User logged out', '::1', '2026-01-23 01:35:56'),
(47, 'admin-1', 'LOGIN', 'User logged in successfully', '::1', '2026-01-23 01:36:16'),
(48, 'admin-1', 'UPDATE_PROJECT', 'Updated project: test test 123', '::1', '2026-01-23 01:40:53'),
(49, 'admin-1', 'LOGOUT', 'User logged out', '::1', '2026-01-23 01:41:08'),
(50, 'admin-1', 'LOGIN', 'User logged in successfully', '::1', '2026-01-23 01:41:17'),
(51, 'admin-1', 'UPDATE_PROJECT', 'Updated project: test test 123123', '::1', '2026-01-23 01:41:42'),
(52, 'fabricator-1', 'LOGIN', 'User logged in successfully', '::1', '2026-01-23 01:51:21'),
(53, 'fabricator-1', 'UPLOAD_GCASH_QR', 'Uploaded new GCash QR: gcash-qr-fabricator-1-1769133108.jpg', '::1', '2026-01-23 01:51:48');

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `created_by` varchar(255) NOT NULL,
  `target_role` text DEFAULT NULL,
  `is_pinned` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`id`, `title`, `content`, `created_by`, `target_role`, `is_pinned`, `created_at`) VALUES
(1, 'Test Announcement', 'Test Content', 'admin-1', '[\"client\"]', 0, '2026-01-21 06:13:20');

-- --------------------------------------------------------

--
-- Table structure for table `materials`
--

CREATE TABLE `materials` (
  `id` varchar(255) NOT NULL,
  `project_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `cost_per_unit` decimal(10,2) DEFAULT NULL,
  `total_cost` decimal(15,2) DEFAULT NULL,
  `added_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `added_by` varchar(255) DEFAULT NULL,
  `status` enum('ordered','delivered','in-use','depleted') DEFAULT 'ordered',
  `supplier` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `materials`
--

INSERT INTO `materials` (`id`, `project_id`, `name`, `description`, `quantity`, `unit`, `cost_per_unit`, `total_cost`, `added_at`, `added_by`, `status`, `supplier`, `category`) VALUES
('mat-1768976790', 'project-1768973722-2e7a72', 'Test Material', 'Test desc', 100.00, 'lbs', 100.00, 10000.00, '2026-01-21 06:26:30', 'fabricator-1', 'ordered', 'Test Supplier', 'Raw Materials');

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `password_resets`
--

INSERT INTO `password_resets` (`id`, `user_id`, `token_hash`, `expires_at`, `used_at`, `created_at`) VALUES
(1, 'user-1768974134', '31ba8ab667655533d3e9d30c8288e812a36d30730bf95dbdc75fee6274932899', '2026-01-23 02:06:30', '2026-01-23 08:37:09', '2026-01-23 00:36:30');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('planning','pending-assignment','in-progress','completed','cancelled','review','on-hold','0_Created','1_Assigned_to_FAB','2_Ready_for_Supervisor_Review','3_Ready_for_Admin_Review','4_Ready_for_Client_Signoff') DEFAULT 'planning',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `progress` int(11) DEFAULT 0,
  `start_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `budget` decimal(15,2) DEFAULT NULL,
  `client_id` varchar(255) DEFAULT NULL,
  `supervisor_id` varchar(255) DEFAULT NULL,
  `fabricator_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`fabricator_ids`)),
  `pending_supervisors` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`pending_supervisors`)),
  `pending_assignments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`pending_assignments`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `spent` decimal(15,2) DEFAULT 0.00,
  `revenue` decimal(15,2) DEFAULT 0.00,
  `fabricator_budgets` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`fabricator_budgets`)),
  `fabricator_allocation` decimal(15,2) DEFAULT 0.00,
  `materials_allocation` decimal(15,2) DEFAULT 0.00,
  `supervisor_allocation` decimal(15,2) DEFAULT 0.00,
  `company_allocation` decimal(15,2) DEFAULT 0.00,
  `documentation_url` text DEFAULT NULL,
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `client_name` varchar(255) DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `project_feedback` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`project_feedback`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `projects`
--

INSERT INTO `projects` (`id`, `title`, `description`, `status`, `priority`, `progress`, `start_date`, `due_date`, `budget`, `client_id`, `supervisor_id`, `fabricator_ids`, `pending_supervisors`, `pending_assignments`, `created_at`, `updated_at`, `spent`, `revenue`, `fabricator_budgets`, `fabricator_allocation`, `materials_allocation`, `supervisor_allocation`, `company_allocation`, `documentation_url`, `attachments`, `client_name`, `created_by`, `project_feedback`) VALUES
('project-1768973722-2e7a72', 'Test Project', 'Test Description 123', 'in-progress', 'urgent', 28, '2026-01-21', '2026-02-21', 123.00, 'user-1768974134', 'supervisor-1', '[\"fabricator-1\"]', '[]', '[{\"id\":\"pa-1768976412-2182a\",\"projectId\":\"project-1768973722-2e7a72\",\"fabricatorId\":\"fabricator-1\",\"assignedBy\":\"supervisor-1\",\"assignedAt\":\"2026-01-21T06:20:12+00:00\",\"status\":\"accepted\",\"message\":\"\",\"respondedAt\":\"2026-01-21T06:20:17+00:00\"},{\"id\":\"pa-1768976412-212d5\",\"projectId\":\"project-1768973722-2e7a72\",\"fabricatorId\":\"user-1768974260\",\"assignedBy\":\"supervisor-1\",\"assignedAt\":\"2026-01-21T06:20:12+00:00\",\"status\":\"pending\",\"message\":\"\"}]', '2026-01-21 05:35:22', '2026-01-21 06:29:53', 100.00, 123.00, '[{\"fabricatorId\":\"fabricator-1\",\"allocatedAmount\":0,\"spentAmount\":0,\"allocatedRevenue\":100,\"description\":\"Revenue allocation for Mike Fabricator\"}]', 1.00, 1.00, 1.00, 1.00, 'https://test.com', '[{\"id\":\"att-1768976539768-mqtifr89b\",\"name\":\"activity-logs-2026-01-21.csv\",\"size\":5162,\"type\":\"text\\/csv\",\"uploadedBy\":\"supervisor-1\",\"uploadedAt\":\"2026-01-21T06:22:19.768Z\",\"url\":\"data:text\\/csv;base64,IlRpbWVzdGFtcCIsIlVzZXIiLCJSb2xlIiwiQWN0aW9uIiwiRGVzY3JpcHRpb24iLCJJUCBBZGRyZXNzIgoiSmFuIDIxLCAyMDI2IDI6MDkgUE0iLCJBZG1pbiIsImFkbWluIiwiRGVsZXRlIiwiRGVsZXRlZCByZXBvcnQ6IGRlbGV0ZSIsIjo6MSIKIkphbiAyMSwgMjAyNiAyOjA5IFBNIiwiQWRtaW4iLCJhZG1pbiIsIkFkZCIsIkNyZWF0ZWQgcmVwb3J0OiBkZWxldGUiLCI6OjEiCiJKYW4gMjEsIDIwMjYgMjowOCBQTSIsIkFkbWluIiwiYWRtaW4iLCJFZGl0IiwiRWRpdGVkIHJlcG9ydDogVGVzdCBVc2VyIFJlcG9ydCIsIjo6MSIKIkphbiAyMSwgMjAyNiAyOjA4IFBNIiwiQWRtaW4iLCJhZG1pbiIsIkVkaXQiLCJFZGl0ZWQgcmVwb3J0OiBUZXN0IFVzZXIgUmVwb3J0IDEyMyIsIjo6MSIKIkphbiAyMSwgMjAyNiAyOjA0IFBNIiwiQWRtaW4iLCJhZG1pbiIsIkVkaXQiLCJVcGRhdGVkIHByb2plY3Q6IFRlc3QgUHJvamVjdCIsIjo6MSIKIkphbiAyMSwgMjAyNiAyOjA0IFBNIiwiQWRtaW4iLCJhZG1pbiIsIkVkaXQiLCJVcGRhdGVkIHByb2plY3Q6IFRlc3QgUHJvamVjdCIsIjo6MSIKIkphbiAyMSwgMjAyNiAyOjAxIFBNIiwiQWRtaW4iLCJhZG1pbiIsIkFkZCIsIkNyZWF0ZWQgcmVwb3J0OiBUZXN0IFVzZXIgUmVwb3J0IiwiOjoxIgoiSmFuIDIxLCAyMDI2IDI6MDAgUE0iLCJBZG1pbiIsImFkbWluIiwiQWRkIiwiQ3JlYXRlZCByZXBvcnQ6IFRlc3QgRmluYW5jZSBSZXBvcnQiLCI6OjEiCiJKYW4gMjEsIDIwMjYgMjowMCBQTSIsIkFkbWluIiwiYWRtaW4iLCJFZGl0IiwiRWRpdGVkIHJlcG9ydDogVGVzdCBQcm9qZWN0IFJlcG9ydCIsIjo6MSIKIkphbiAyMSwgMjAyNiAyOjAwIFBNIiwiQWRtaW4iLCJhZG1pbiIsIkVkaXQiLCJFZGl0ZWQgcmVwb3J0OiBUZXN0IFByb2plY3QgUmVwb3J0IDEyMyIsIjo6MSIKIkphbiAyMSwgMjAyNiAxOjU5IFBNIiwiQWRtaW4iLCJhZG1pbiIsIkFkZCIsIkNyZWF0ZWQgcmVwb3J0OiBUZXN0IFRhc2sgUmVwb3J0IiwiOjoxIgoiSmFuIDIxLCAyMDI2IDE6NTkgUE0iLCJBZG1pbiIsImFkbWluIiwiQWRkIiwiQ3JlYXRlZCByZXBvcnQ6IHRlc3QgUHJvamVjdCBSZXBvcnQiLCI6OjEiCiJKYW4gMjEsIDIwMjYgMTo1OCBQTSIsIkFkbWluIiwiYWRtaW4iLCJFZGl0IiwiVXBkYXRlZCBwcm9qZWN0OiBUZXN0IFByb2plY3QiLCI6OjEiCiJKYW4gMjEsIDIwMjYgMTo1OCBQTSIsIkFkbWluIiwiYWRtaW4iLCJFZGl0IiwiVXBkYXRlZCBwcm9qZWN0OiBUZXN0IFByb2plY3QiLCI6OjEiCiJKYW4gMjEsIDIwMjYgMTo1NyBQTSIsIkFkbWluIiwiYWRtaW4iLCJFZGl0IiwiVXBkYXRlZCB1c2VyIGRldGFpbHMgZm9yOiBlZGl0IDEyMyIsIjo6MSIKIkphbiAyMSwgMjAyNiAxOjU2IFBNIiwiQWRtaW4iLCJhZG1pbiIsIlJlc3RvcmUgVXNlciIsIlJlc3RvcmVkIHVzZXI6IFRlc3QgQ2xpZW50IiwiOjoxIgoiSmFuIDIxLCAyMDI2IDE6NTYgUE0iLCJBZG1pbiIsImFkbWluIiwiUmVzdG9yZSBVc2VyIiwiUmVzdG9yZWQgdXNlcjogVGVzdCBGYWJyaWNhdG9yIiwiOjoxIgoiSmFuIDIxLCAyMDI2IDE6NTYgUE0iLCJBZG1pbiIsImFkbWluIiwiUmVzdG9yZSBVc2VyIiwiUmVzdG9yZWQgdXNlcjogcWR3c2EiLCI6OjEiCiJKYW4gMjEsIDIwMjYgMTo1NiBQTSIsIkFkbWluIiwiYWRtaW4iLCJEZWxldGUiLCJEZWFjdGl2YXRlZCB1c2VyOiBxZHdzYSIsIjo6MSIKIkphbiAyMSwgMjAyNiAxOjU2IFBNIiwiQWRtaW4iLCJhZG1pbiIsIkRlbGV0ZSIsIkRlYWN0aXZhdGVkIHVzZXI6IFRlc3QgRmFicmljYXRvciIsIjo6MSIKIkphbiAyMSwgMjAyNiAxOjU2IFBNIiwiQWRtaW4iLCJhZG1pbiIsIkRlbGV0ZSIsIkRlYWN0aXZhdGVkIHVzZXI6IFRlc3QgQ2xpZW50IiwiOjoxIgoiSmFuIDIxLCAyMDI2IDE6NTYgUE0iLCJBZG1pbiIsImFkbWluIiwiUmVzdG9yZSBVc2VyIiwiUmVzdG9yZWQgdXNlcjogcWR3c2EiLCI6OjEiCiJKYW4gMjEsIDIwMjYgMTo1NSBQTSIsIkFkbWluIiwiYWRtaW4iLCJEZWxldGUiLCJEZWFjdGl2YXRlZCB1c2VyOiBxZHdzYSIsIjo6MSIKIkphbiAyMSwgMjAyNiAxOjUyIFBNIiwiQWRtaW4iLCJhZG1pbiIsIkxvZ2luIiwiVXNlciBsb2dnZWQgaW4gc3VjY2Vzc2Z1bGx5IiwiOjoxIgoiSmFuIDIxLCAyMDI2IDE6NTEgUE0iLCJlZGl0IDEyMyIsImNsaWVudCIsIlNpZ251cCIsIk5ldyB1c2VyIHJlZ2lzdGVyZWQ6IHFkd3NhIChzdXBlcnZpc29yKSIsIjo6MSIKIkphbiAyMSwgMjAyNiAxOjUwIFBNIiwiQWRtaW4iLCJhZG1pbiIsIkRlbGV0ZSIsIkRlbGV0ZWQgdGFzazogRGVsZXRlIDEyMyIsIjo6MSIKIkphbiAyMSwgMjAyNiAxOjUwIFBNIiwiQWRtaW4iLCJhZG1pbiIsIkRlbGV0ZSIsIkRlbGV0ZWQgdGFzazogVW5rbm93biIsIjo6MSIKIkphbiAyMSwgMjAyNiAxOjUwIFBNIiwiQWRtaW4iLCJhZG1pbiIsIkVkaXQiLCJVcGRhdGVkIHRhc2s6IERlbGV0ZSAxMjMiLCI6OjEiCiJKYW4gMjEsIDIwMjYgMTo0OSBQTSIsIkFkbWluIiwiYWRtaW4iLCJBZGQiLCJDcmVhdGVkIHRhc2s6IERlbGV0ZSIsIjo6MSIKIkphbiAyMSwgMjAyNiAxOjQ5IFBNIiwiQWRtaW4iLCJhZG1pbiIsIkVkaXQiLCJVcGRhdGVkIHRhc2s6IFRlc3QgVGFzayIsIjo6MSIKIkphbiAyMSwgMjAyNiAxOjQ5IFBNIiwiQWRtaW4iLCJhZG1pbiIsIkVkaXQiLCJVcGRhdGVkIHRhc2s6IFRlc3QgVGFzayIsIjo6MSIKIkphbiAyMSwgMjAyNiAxOjQ4IFBNIiwiQWRtaW4iLCJhZG1pbiIsIkFkZCIsIkNyZWF0ZWQgdGFzazogTXVsdGkgVGFzayBUZXN0IiwiOjoxIgoiSmFuIDIxLCAyMDI2IDE6NDggUE0iLCJBZG1pbiIsImFkbWluIiwiRWRpdCIsIlVwZGF0ZWQgcHJvamVjdDogVGVzdCBQcm9qZWN0IiwiOjoxIgoiSmFuIDIxLCAyMDI2IDE6NDggUE0iLCJBZG1pbiIsImFkbWluIiwiQWRkIiwiQ3JlYXRlZCB0YXNrOiBUZXN0IFRhc2siLCI6OjEiCiJKYW4gMjEsIDIwMjYgMTo0NyBQTSIsIkFkbWluIiwiYWRtaW4iLCJEZWxldGUiLCJEZWxldGVkIHByb2plY3Q6IDJlIiwiOjoxIgoiSmFuIDIxLCAyMDI2IDE6NDYgUE0iLCJBZG1pbiIsImFkbWluIiwiRWRpdCIsIlVwZGF0ZWQgcHJvamVjdDogMmUiLCI6OjEiCiJKYW4gMjEsIDIwMjYgMTo0NiBQTSIsIkFkbWluIiwiYWRtaW4iLCJBZGQiLCJDcmVhdGVkIHByb2plY3Q6IDJlIiwiOjoxIgoiSmFuIDIxLCAyMDI2IDE6NDYgUE0iLCJBZG1pbiIsImFkbWluIiwiRWRpdCIsIlVwZGF0ZWQgcHJvamVjdDogVGVzdCBBcmNoaXZlIiwiOjoxIgoiSmFuIDIxLCAyMDI2IDE6NDYgUE0iLCJBZG1pbiIsImFkbWluIiwiRWRpdCIsIlVwZGF0ZWQgcHJvamVjdDogVGVzdCBBcmNoaXZlIDEyMyIsIjo6MSIKIkphbiAyMSwgMjAyNiAxOjQ1IFBNIiwiQWRtaW4iLCJhZG1pbiIsIkVkaXQiLCJVcGRhdGVkIHByb2plY3Q6IFRlc3QgQXJjaGl2ZSIsIjo6MSIKIkphbiAyMSwgMjAyNiAxOjQ1IFBNIiwiQWRtaW4iLCJhZG1pbiIsIkFkZCIsIkNyZWF0ZWQgcHJvamVjdDogVGVzdCBBcmNoaXZlIiwiOjoxIgoiSmFuIDIxLCAyMDI2IDE6NDQgUE0iLCJBZG1pbiIsImFkbWluIiwiRWRpdCIsIlVwZGF0ZWQgcHJvamVjdDogVGVzdCBQcm9qZWN0IDEyMyIsIjo6MSIKIkphbiAyMSwgMjAyNiAxOjQ0IFBNIiwiVGVzdCBGYWJyaWNhdG9yIiwiZmFicmljYXRvciIsIlNpZ251cCIsIk5ldyB1c2VyIHJlZ2lzdGVyZWQ6IFRlc3QgU3VwZXJ2aXNvciAoZmFicmljYXRvcikiLCI6OjEiCiJKYW4gMjEsIDIwMjYgMTo0MiBQTSIsIkFkbWluIiwiYWRtaW4iLCJFZGl0IiwiVXBkYXRlZCBwcm9qZWN0OiBUZXN0IFByb2plY3QgMTIzIiwiOjoxIgoiSmFuIDIxLCAyMDI2IDE6NDIgUE0iLCJBZG1pbiIsImFkbWluIiwiQWRkIiwiQ3JlYXRlZCBjbGllbnQ6IFRlc3QgQ2xpZW50IGZvciBwcm9qZWN0IHByb2plY3QtMTc2ODk3MzcyMi0yZTdhNzIiLCI6OjEiCiJKYW4gMjEsIDIwMjYgMTo0MSBQTSIsIkFkbWluIiwiYWRtaW4iLCJFZGl0IiwiVXBkYXRlZCBwcm9qZWN0OiBUZXN0IFByb2plY3QgMTIzIiwiOjoxIgoiSmFuIDIxLCAyMDI2IDE6NDAgUE0iLCJBZG1pbiIsImFkbWluIiwiQWRkIiwiQ3JlYXRlZCBwcm9qZWN0OiBkd3FheCIsIjo6MSIKIkphbiAyMSwgMjAyNiAxOjM4IFBNIiwiQWRtaW4iLCJhZG1pbiIsIkVkaXQiLCJVcGRhdGVkIHByb2plY3Q6IFRlc3QgUHJvamVjdCAxMjMiLCI6OjEiCiJKYW4gMjEsIDIwMjYgMTozOCBQTSIsIkFkbWluIiwiYWRtaW4iLCJBZGQiLCJDcmVhdGVkIGNsaWVudDogVGVzdCBDbGllbnQgZm9yIHByb2plY3QgcHJvamVjdC0xNzY4OTczNzIyLTJlN2E3MiIsIjo6MSIKIkphbiAyMSwgMjAyNiAxOjM3IFBNIiwiQWRtaW4iLCJhZG1pbiIsIkVkaXQiLCJVcGRhdGVkIHByb2plY3Q6IFRlc3QgUHJvamVjdCAxMjMiLCI6OjEiCiJKYW4gMjEsIDIwMjYgMTozNiBQTSIsIkFkbWluIiwiYWRtaW4iLCJFZGl0IiwiVXBkYXRlZCBwcm9qZWN0OiBUZXN0IFByb2plY3QgMTIzIiwiOjoxIgoiSmFuIDIxLCAyMDI2IDE6MzYgUE0iLCJBZG1pbiIsImFkbWluIiwiRWRpdCIsIlVwZGF0ZWQgcHJvamVjdDogVGVzdCBQcm9qZWN0IDEyMyIsIjo6MSIKIkphbiAyMSwgMjAyNiAxOjM2IFBNIiwiQWRtaW4iLCJhZG1pbiIsIkVkaXQiLCJVcGRhdGVkIHByb2plY3Q6IFRlc3QgUHJvamVjdCAxMjMiLCI6OjEiCiJKYW4gMjEsIDIwMjYgMTozNSBQTSIsIkFkbWluIiwiYWRtaW4iLCJFZGl0IiwiVXBkYXRlZCBwcm9qZWN0OiBUZXN0IFByb2plY3QgMTIzIiwiOjoxIgoiSmFuIDIxLCAyMDI2IDE6MzUgUE0iLCJBZG1pbiIsImFkbWluIiwiQWRkIiwiQ3JlYXRlZCBwcm9qZWN0OiBUZXN0IFByb2plY3QiLCI6OjEiCiJKYW4gMjEsIDIwMjYgMTozNCBQTSIsIkFkbWluIiwiYWRtaW4iLCJMb2dpbiIsIlVzZXIgbG9nZ2VkIGluIHN1Y2Nlc3NmdWxseSIsIjo6MSIKIkphbiAyMSwgMjAyNiAxOjM0IFBNIiwiQWRtaW4iLCJhZG1pbiIsIkxvZ2luIiwiVXNlciBsb2dnZWQgaW4gc3VjY2Vzc2Z1bGx5IiwiOjoxIgoiSmFuIDIxLCAyMDI2IDE6MzMgUE0iLCJKb2huIFN1cGVydmlzb3IiLCJzdXBlcnZpc29yIiwiTG9naW4iLCJVc2VyIGxvZ2dlZCBpbiBzdWNjZXNzZnVsbHkiLCI6OjEiCiJKYW4gMjEsIDIwMjYgMTozMiBQTSIsIk1pa2UgRmFicmljYXRvciIsImZhYnJpY2F0b3IiLCJMb2dpbiIsIlVzZXIgbG9nZ2VkIGluIHN1Y2Nlc3NmdWxseSIsIjo6MSI=\"},{\"id\":\"att-1768976886300-bu9lmujdc\",\"name\":\"download (3).csv\",\"size\":9763,\"type\":\"text\\/csv\",\"uploadedBy\":\"fabricator-1\",\"uploadedAt\":\"2026-01-21T06:28:06.300Z\",\"url\":\"data:text\\/csv;base64,IlRpbWVzdGFtcCIsIlVzZXIiLCJSb2xlIiwiQWN0aW9uIiwiRGVzY3JpcHRpb24iLCJJUCBBZGRyZXNzIgoiSmFuIDE3LCAyMDI2IDk6MDYgQU0iLCJBZG1pbiBBZG1pbmlzdHJhdG9yIiwiYWRtaW4iLCJBZGQiLCJDcmVhdGVkIHByb2plY3Q6IGFzc2lnbmFibGUgZmFicmljYXRvciBmb3Igc3VwZXJ2aXNvciIsIjo6MSIKIkphbiAxNywgMjAyNiA5OjA1IEFNIiwiQWRtaW4gQWRtaW5pc3RyYXRvciIsImFkbWluIiwiQWRkIiwiQ3JlYXRlZCBwcm9qZWN0OiB0ZXN0IiwiOjoxIgoiSmFuIDE3LCAyMDI2IDk6MDUgQU0iLCJKb2huIFN1cGVydmlzb3IiLCJzdXBlcnZpc29yIiwiTG9naW4iLCJVc2VyIGxvZ2dlZCBpbiBzdWNjZXNzZnVsbHkiLCI6OjEiCiJKYW4gMTcsIDIwMjYgOTowNCBBTSIsIkFkbWluIEFkbWluaXN0cmF0b3IiLCJhZG1pbiIsIkxvZ2luIiwiVXNlciBsb2dnZWQgaW4gc3VjY2Vzc2Z1bGx5IiwiOjoxIgoiSmFuIDE2LCAyMDI2IDEwOjA3IFBNIiwiQWRtaW4gQWRtaW5pc3RyYXRvciIsImFkbWluIiwiUG9zdCBBbm5vdW5jZW1lbnQiLCJQb3N0ZWQ6IHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZCIsIjo6MSIKIkphbiAxNiwgMjAyNiAxMDowNiBQTSIsIkFkbWluIEFkbWluaXN0cmF0b3IiLCJhZG1pbiIsIkVkaXQiLCJFZGl0ZWQgYW5ub3VuY2VtZW50IElEOiAxIiwiOjoxIgoiSmFuIDE2LCAyMDI2IDEwOjA2IFBNIiwiQWRtaW4gQWRtaW5pc3RyYXRvciIsImFkbWluIiwiRWRpdCIsIkVkaXRlZCBhbm5vdW5jZW1lbnQgSUQ6IDEiLCI6OjEiCiJKYW4gMTYsIDIwMjYgMTA6MDUgUE0iLCJBZG1pbiBBZG1pbmlzdHJhdG9yIiwiYWRtaW4iLCJMb2dpbiIsIlVzZXIgbG9nZ2VkIGluIHN1Y2Nlc3NmdWxseSIsIjo6MSIKIkphbiAxNiwgMjAyNiAxMDowMSBQTSIsIm51bGwiLCJudWxsIiwiRWRpdCIsIlVwZGF0ZWQgcHJvamVjdDogZGFzc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkIiwiOjoxIgoiSmFuIDE2LCAyMDI2IDk6NTkgUE0iLCJudWxsIiwibnVsbCIsIkFkZCIsIkNyZWF0ZWQgcHJvamVjdDogc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkIiwiOjoxIgoiSmFuIDE2LCAyMDI2IDk6NTcgUE0iLCJudWxsIiwibnVsbCIsIkVkaXQiLCJVcGRhdGVkIHVzZXIgZGV0YWlscyBmb3I6IHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZCIsIjo6MSIKIkphbiAxNiwgMjAyNiA5OjU2IFBNIiwibnVsbCIsIm51bGwiLCJTaWdudXAiLCJOZXcgdXNlciByZWdpc3RlcmVkOiAyMzEgKHN1cGVydmlzb3IpIiwiOjoxIgoiSmFuIDE2LCAyMDI2IDk6NTUgUE0iLCJudWxsIiwibnVsbCIsIlNpZ251cCIsIk5ldyB1c2VyIHJlZ2lzdGVyZWQ6IHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZCAoc3VwZXJ2aXNvcikiLCI6OjEiCiJKYW4gMTYsIDIwMjYgOTo1MyBQTSIsIkFkbWluIEFkbWluaXN0cmF0b3IiLCJhZG1pbiIsIkVkaXQiLCJVcGRhdGVkIHByb2plY3Q6IGRhcyIsIjo6MSIKIkphbiAxNiwgMjAyNiA5OjUzIFBNIiwiQWRtaW4gQWRtaW5pc3RyYXRvciIsImFkbWluIiwiRWRpdCIsIlVwZGF0ZWQgcHJvamVjdDogZGFzIiwiOjoxIgoiSmFuIDE2LCAyMDI2IDk6NTEgUE0iLCJBZG1pbiBBZG1pbmlzdHJhdG9yIiwiYWRtaW4iLCJFZGl0IiwiRWRpdGVkIHJlcG9ydDogc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkIiwiOjoxIgoiSmFuIDE2LCAyMDI2IDk6NTEgUE0iLCJBZG1pbiBBZG1pbmlzdHJhdG9yIiwiYWRtaW4iLCJBZGQiLCJDcmVhdGVkIHJlcG9ydDogMTIzIiwiOjoxIgoiSmFuIDE2LCAyMDI2IDk6NTAgUE0iLCJBZG1pbiBBZG1pbmlzdHJhdG9yIiwiYWRtaW4iLCJBZGQiLCJDcmVhdGVkIHJlcG9ydDogc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkc2NhZGRkZGRzY2FkZGRkZHNjYWRkZGRkIiwiOjoxIgoiSmFuIDE2LCAyMDI2IDk6NTAgUE0iLCJBZG1pbiBBZG1pbmlzdHJhdG9yIiwiYWRtaW4iLCJFZGl0IiwiVXBkYXRlZCB1c2VyIGRldGFpbHMgZm9yOiBBZG1pbiBBZG1pbmlzdHJhdG9yIiwiOjoxIgoiSmFuIDE2LCAyMDI2IDk6NTAgUE0iLCJBZG1pbiBBZG1pbmlzdHJhdG9yIiwiYWRtaW4iLCJMb2dpbiIsIlVzZXIgbG9nZ2VkIGluIHN1Y2Nlc3NmdWxseSIsIjo6MSIKIkphbiAxNiwgMjAyNiA5OjQ3IFBNIiwiQWRtaW4gQWRtaW5pc3RyYXRvciIsImFkbWluIiwiRWRpdCIsIlVwZGF0ZWQgdXNlciBkZXRhaWxzIGZvcjogQWRtaW5lZnd3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3dyBBZG1pbmlzdHJhdG9yZGZzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3NzcyIsIjo6MSIKIkphbiAxNiwgMjAyNiA5OjQ0IFBNIiwiTWlrZSBGYWJyaWNhdG9yIiwiZmFicmljYXRvciIsIkxvZ2luIiwiVXNlciBsb2dnZWQgaW4gc3VjY2Vzc2Z1bGx5IiwiOjoxIgoiSmFuIDE2LCAyMDI2IDk6MTggUE0iLCJUZXN0IENsaWVudCIsImNsaWVudCIsIkxvZ2luIiwiVXNlciBsb2dnZWQgaW4gc3VjY2Vzc2Z1bGx5IiwiOjoxIgoiSmFuIDE2LCAyMDI2IDk6MTYgUE0iLCJTYXJhaCBDbGllbnQiLCJjbGllbnQiLCJMb2dpbiIsIlVzZXIgbG9nZ2VkIGluIHN1Y2Nlc3NmdWxseSIsIjo6MSIKIkphbiAxNiwgMjAyNiA5OjA3IFBNIiwiQWRtaW4gQWRtaW5pc3RyYXRvciIsImFkbWluIiwiQWRkIiwiQ3JlYXRlZCBwcm9qZWN0OiBkYXMiLCI6OjEiCiJKYW4gMTYsIDIwMjYgOTowNyBQTSIsIkFkbWluIEFkbWluaXN0cmF0b3IiLCJhZG1pbiIsIkxvZ2luIiwiVXNlciBsb2dnZWQgaW4gc3VjY2Vzc2Z1bGx5IiwiOjoxIgoiSmFuIDE2LCAyMDI2IDk6MDMgUE0iLCJKb2huIFN1cGVydmlzb3IiLCJzdXBlcnZpc29yIiwiTG9naW4iLCJVc2VyIGxvZ2dlZCBpbiBzdWNjZXNzZnVsbHkiLCI6OjEiCiJKYW4gMTYsIDIwMjYgOTowMyBQTSIsIlNhcmFoIENsaWVudCIsImNsaWVudCIsIkxvZ2luIiwiVXNlciBsb2dnZWQgaW4gc3VjY2Vzc2Z1bGx5IiwiOjoxIgoiSmFuIDE2LCAyMDI2IDQ6NTQgUE0iLCJKb2huIFN1cGVydmlzb3IiLCJzdXBlcnZpc29yIiwiTG9naW4iLCJVc2VyIGxvZ2dlZCBpbiBzdWNjZXNzZnVsbHkiLCI6OjEiCiJKYW4gMTYsIDIwMjYgNDoyNiBQTSIsIkFkbWluIEFkbWluaXN0cmF0b3IiLCJhZG1pbiIsIkVkaXQiLCJVcGRhdGVkIHByb2plY3Q6IFRlc3QgUHJvamVjdCIsIjo6MSIKIkphbiAxNiwgMjAyNiA0OjI1IFBNIiwiQWRtaW4gQWRtaW5pc3RyYXRvciIsImFkbWluIiwiTG9naW4iLCJVc2VyIGxvZ2dlZCBpbiBzdWNjZXNzZnVsbHkiLCI6OjEiCiJKYW4gMTYsIDIwMjYgMzo0NSBQTSIsIk1pa2UgRmFicmljYXRvciIsImZhYnJpY2F0b3IiLCJMb2dpbiIsIlVzZXIgbG9nZ2VkIGluIHN1Y2Nlc3NmdWxseSIsIjo6MSIKIkphbiAxNiwgMjAyNiAzOjQ0IFBNIiwiQWRtaW4gQWRtaW5pc3RyYXRvciIsImFkbWluIiwiTG9naW4iLCJVc2VyIGxvZ2dlZCBpbiBzdWNjZXNzZnVsbHkiLCI6OjEiCiJKYW4gMTYsIDIwMjYgMzozNyBQTSIsIkFkbWluIEFkbWluaXN0cmF0b3IiLCJhZG1pbiIsIkxvZ2luIiwiVXNlciBsb2dnZWQgaW4gc3VjY2Vzc2Z1bGx5IiwiOjoxIgoiSmFuIDE2LCAyMDI2IDI6NTcgUE0iLCJBZG1pbiBBZG1pbmlzdHJhdG9yIiwiYWRtaW4iLCJFZGl0IiwiVXBkYXRlZCBwcm9qZWN0OiBUZXN0IFByb2plY3QiLCI6OjEiCiJKYW4gMTYsIDIwMjYgMjo1NiBQTSIsIkFkbWluIEFkbWluaXN0cmF0b3IiLCJhZG1pbiIsIkVkaXQiLCJVcGRhdGVkIHByb2plY3Q6IFRlc3QgUHJvamVjdCIsIjo6MSIKIkphbiAxNiwgMjAyNiAyOjMzIFBNIiwiQWRtaW4gQWRtaW5pc3RyYXRvciIsImFkbWluIiwiTG9naW4iLCJVc2VyIGxvZ2dlZCBpbiBzdWNjZXNzZnVsbHkiLCI6OjEiCiJKYW4gMTYsIDIwMjYgMToyMSBQTSIsIkFkbWluIEFkbWluaXN0cmF0b3IiLCJhZG1pbiIsIkxvZ2luIiwiVXNlciBsb2dnZWQgaW4gc3VjY2Vzc2Z1bGx5IiwiOjoxIgoiSmFuIDE2LCAyMDI2IDE6MTYgUE0iLCJBZG1pbiBBZG1pbmlzdHJhdG9yIiwiYWRtaW4iLCJFZGl0IiwiVXBkYXRlZCBwcm9qZWN0OiBUZXN0IFByb2plY3QiLCI6OjEiCiJKYW4gMTYsIDIwMjYgMToxMCBQTSIsIkFkbWluIEFkbWluaXN0cmF0b3IiLCJhZG1pbiIsIkVkaXQiLCJVcGRhdGVkIHByb2plY3Q6IFRlc3QgUHJvamVjdCIsIjo6MSIKIkphbiAxNiwgMjAyNiAxOjA0IFBNIiwiTWlrZSBGYWJyaWNhdG9yIiwiZmFicmljYXRvciIsIkxvZ2luIiwiVXNlciBsb2dnZWQgaW4gc3VjY2Vzc2Z1bGx5IiwiOjoxIgoiSmFuIDE2LCAyMDI2IDE6MDIgUE0iLCJBZG1pbiBBZG1pbmlzdHJhdG9yIiwiYWRtaW4iLCJFZGl0IiwiVXBkYXRlZCBwcm9qZWN0OiBUZXN0IFByb2plY3QiLCI6OjEiCiJKYW4gMTYsIDIwMjYgMTowMSBQTSIsIkFkbWluIEFkbWluaXN0cmF0b3IiLCJhZG1pbiIsIkVkaXQiLCJVcGRhdGVkIHByb2plY3Q6IFRlc3QgUHJvamVjdCAxMjMiLCI6OjEiCiJKYW4gMTYsIDIwMjYgMTowMSBQTSIsIkFkbWluIEFkbWluaXN0cmF0b3IiLCJhZG1pbiIsIkxvZ2luIiwiVXNlciBsb2dnZWQgaW4gc3VjY2Vzc2Z1bGx5IiwiOjoxIgoiSmFuIDE2LCAyMDI2IDEyOjAyIFBNIiwiQWRtaW4gQWRtaW5pc3RyYXRvciIsImFkbWluIiwiRWRpdCIsIlVwZGF0ZWQgcHJvamVjdDogVGVzdCBQcm9qZWN0IiwiOjoxIgoiSmFuIDE2LCAyMDI2IDEyOjAxIFBNIiwiQWRtaW4gQWRtaW5pc3RyYXRvciIsImFkbWluIiwiRWRpdCIsIlVwZGF0ZWQgcHJvamVjdDogVGVzdCBQcm9qZWN0IDEzMiIsIjo6MSIKIkphbiAxNiwgMjAyNiAxMjowMSBQTSIsIkFkbWluIEFkbWluaXN0cmF0b3IiLCJhZG1pbiIsIkxvZ2luIiwiVXNlciBsb2dnZWQgaW4gc3VjY2Vzc2Z1bGx5IiwiOjoxIgoiSmFuIDE2LCAyMDI2IDEwOjE2IEFNIiwiSm9obiBTdXBlcnZpc29yIiwic3VwZXJ2aXNvciIsIkxvZ2luIiwiVXNlciBsb2dnZWQgaW4gc3VjY2Vzc2Z1bGx5IiwiOjoxIgoiSmFuIDE2LCAyMDI2IDEwOjEzIEFNIiwiTWlrZSBGYWJyaWNhdG9yIiwiZmFicmljYXRvciIsIkFkZCIsIkFkZGVkIG1hdGVyaWFsOiBUZXN0IE1hdGVyaWFsIiwiOjoxIgoiSmFuIDE2LCAyMDI2IDEwOjA4IEFNIiwiTWlrZSBGYWJyaWNhdG9yIiwiZmFicmljYXRvciIsIkxvZ2luIiwiVXNlciBsb2dnZWQgaW4gc3VjY2Vzc2Z1bGx5IiwiOjoxIgoiSmFuIDE2LCAyMDI2IDEwOjAwIEFNIiwiQWRtaW4gQWRtaW5pc3RyYXRvciIsImFkbWluIiwiTG9naW4iLCJVc2VyIGxvZ2dlZCBpbiBzdWNjZXNzZnVsbHkiLCI6OjEiCiJKYW4gMTYsIDIwMjYgOTozNyBBTSIsIkFkbWluIEFkbWluaXN0cmF0b3IiLCJhZG1pbiIsIkVkaXQiLCJVcGRhdGVkIHRhc2s6IFRlc3QgVGFzayIsIjo6MSIKIkphbiAxNiwgMjAyNiA5OjM3IEFNIiwiQWRtaW4gQWRtaW5pc3RyYXRvciIsImFkbWluIiwiRWRpdCIsIlVwZGF0ZWQgdGFzazogVGVzdCBUYXNrIiwiOjoxIgoiSmFuIDE2LCAyMDI2IDk6MzcgQU0iLCJBZG1pbiBBZG1pbmlzdHJhdG9yIiwiYWRtaW4iLCJFZGl0IiwiVXBkYXRlZCB0YXNrOiBUZXN0IFRhc2siLCI6OjEiCiJKYW4gMTYsIDIwMjYgOTozNyBBTSIsIkFkbWluIEFkbWluaXN0cmF0b3IiLCJhZG1pbiIsIkVkaXQiLCJVcGRhdGVkIHRhc2s6IFRlc3QgVGFzayIsIjo6MSIKIkphbiAxNiwgMjAyNiA5OjM2IEFNIiwiQWRtaW4gQWRtaW5pc3RyYXRvciIsImFkbWluIiwiRGVsZXRlIiwiRGVsZXRlZCByZXBvcnQ6IDEyMyIsIjo6MSIKIkphbiAxNiwgMjAyNiA5OjM1IEFNIiwiQWRtaW4gQWRtaW5pc3RyYXRvciIsImFkbWluIiwiQWRkIiwiQ3JlYXRlZCByZXBvcnQ6IDEyMyIsIjo6MSIKIkphbiAxNiwgMjAyNiA5OjIzIEFNIiwiQWRtaW4gQWRtaW5pc3RyYXRvciIsImFkbWluIiwiRGVsZXRlIiwiRGVsZXRlZCBwcm9qZWN0OiB3ZWZzZHoiLCI6OjEiCiJKYW4gMTYsIDIwMjYgOToyMyBBTSIsIkFkbWluIEFkbWluaXN0cmF0b3IiLCJhZG1pbiIsIkVkaXQiLCJVcGRhdGVkIHByb2plY3Q6IHdlZnNkeiIsIjo6MSIKIkphbiAxNiwgMjAyNiA5OjIyIEFNIiwiQWRtaW4gQWRtaW5pc3RyYXRvciIsImFkbWluIiwiQWRkIiwiQ3JlYXRlZCBwcm9qZWN0OiB3ZWZzZHoiLCI6OjEiCiJKYW4gMTYsIDIwMjYgOToyMSBBTSIsIkFkbWluIEFkbWluaXN0cmF0b3IiLCJhZG1pbiIsIkRlbGV0ZSIsIkRlYWN0aXZhdGVkIHVzZXI6IGZxZXdzY2EiLCI6OjEiCiJKYW4gMTYsIDIwMjYgOToyMSBBTSIsIkFkbWluIEFkbWluaXN0cmF0b3IiLCJhZG1pbiIsIlJlc3RvcmUgVXNlciIsIlJlc3RvcmVkIHVzZXI6IGZxZXdzY2EiLCI6OjEiCiJKYW4gMTYsIDIwMjYgOToyMSBBTSIsIkFkbWluIEFkbWluaXN0cmF0b3IiLCJhZG1pbiIsIkVkaXQiLCJFZGl0ZWQgcmVwb3J0OiBEcmFmdCBSZXBvcnQiLCI6OjEiCiJKYW4gMTYsIDIwMjYgOToyMCBBTSIsIkFkbWluIEFkbWluaXN0cmF0b3IiLCJhZG1pbiIsIkVkaXQiLCJFZGl0ZWQgcmVwb3J0OiBUZXN0IERyYWZ0IiwiOjoxIgoiSmFuIDE2LCAyMDI2IDk6MTkgQU0iLCJBZG1pbiBBZG1pbmlzdHJhdG9yIiwiYWRtaW4iLCJBZGQiLCJDcmVhdGVkIHJlcG9ydDogYWRzIiwiOjoxIg==\"}]', 'Test Client', 'admin-1', '[{\"id\":\"feedback-project-1768973722-2e7a72-1768976561735\",\"projectId\":\"project-1768973722-2e7a72\",\"comment\":\"Test Feedback\",\"createdAt\":\"2026-01-21T06:22:41.735Z\",\"createdBy\":\"user-1768974134\",\"createdByName\":\"Test Client\",\"createdByRole\":\"client\",\"visibilityRoles\":[\"supervisor\",\"admin\"]}]'),
('project-1768974326-c916fe', 'Test Archive', 'Test Desc', 'pending-assignment', 'high', 100, '2026-01-21', '2026-02-21', 3.00, NULL, 'supervisor-1', '[\"fabricator-1\"]', '[]', '[{\"id\":\"pa-1768976668984\",\"projectId\":\"project-1768974326-c916fe\",\"fabricatorId\":\"user-1768974260\",\"assignedBy\":\"supervisor-1\",\"assignedAt\":\"2026-01-21T06:24:28.984Z\",\"status\":\"pending\"}]', '2026-01-21 05:45:26', '2026-01-21 06:24:29', 0.00, 4.00, '[]', 1.00, 1.00, 1.00, 1.00, 'https://archived.com', NULL, NULL, 'admin-1', '[]'),
('project-1769068885-6828d1', 'test test 123123', 'qwdas', 'planning', 'medium', 0, '2026-01-22', '2026-02-22', 3.00, NULL, 'supervisor-1', '[\"fabricator-1\"]', '[]', '[]', '2026-01-22 08:01:25', '2026-01-23 01:41:42', 0.00, 4.00, '[]', 1.00, 1.00, 1.00, 1.00, NULL, NULL, NULL, 'admin-1', '[]');

-- --------------------------------------------------------

--
-- Table structure for table `project_payments`
--

CREATE TABLE `project_payments` (
  `id` int(11) NOT NULL,
  `project_id` varchar(255) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `payment_date` date NOT NULL,
  `method` varchar(50) DEFAULT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `project_payments`
--

INSERT INTO `project_payments` (`id`, `project_id`, `amount`, `payment_date`, `method`, `reference`, `notes`, `created_by`, `created_at`) VALUES
(1, 'project-1768973722-2e7a72', 120.00, '2026-01-21', 'GCash', '#82369', NULL, 'admin-1', '2026-01-21 06:10:13'),
(3, 'project-1768973722-2e7a72', 3.00, '2026-01-21', 'Cash', '#742152', NULL, 'admin-1', '2026-01-21 06:10:54');

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('project','task','user','financial','custom') NOT NULL,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `project_id` varchar(50) DEFAULT NULL,
  `created_by` varchar(50) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `shared_with` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`shared_with`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`id`, `title`, `description`, `type`, `status`, `project_id`, `created_by`, `created_at`, `updated_at`, `shared_with`) VALUES
('report_1768975168_6b133787', 'Test Project Report', 'Test Desc', 'project', 'published', 'project-1768973722-2e7a72', 'admin-1', '2026-01-21 13:59:28', '2026-01-21 14:17:32', NULL),
('report_1768975192_fe1e4b5c', 'Test Task Report', 'Test Desc', 'task', 'published', NULL, 'admin-1', '2026-01-21 13:59:52', '2026-01-21 13:59:52', NULL),
('report_1768975248_00380323', 'Test Finance Report', 'Test desc', 'financial', 'draft', NULL, 'admin-1', '2026-01-21 14:00:48', '2026-01-21 14:00:48', NULL),
('report_1768975285_f02fb6a8', 'Test User Report', 'Test Desc', 'user', 'draft', NULL, 'admin-1', '2026-01-21 14:01:25', '2026-01-21 14:15:42', '[\"supervisor-1\"]');

-- --------------------------------------------------------

--
-- Table structure for table `tasks`
--

CREATE TABLE `tasks` (
  `id` varchar(255) NOT NULL,
  `project_id` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','in-progress','completed','cancelled') DEFAULT 'pending',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `assigned_to` varchar(255) DEFAULT NULL,
  `created_by` varchar(255) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `estimated_hours` decimal(5,2) DEFAULT NULL,
  `actual_hours` decimal(5,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tasks`
--

INSERT INTO `tasks` (`id`, `project_id`, `title`, `description`, `status`, `priority`, `assigned_to`, `created_by`, `due_date`, `estimated_hours`, `actual_hours`, `created_at`, `updated_at`) VALUES
('task-1768974486', 'project-1768973722-2e7a72', 'Test Task', 'Test Desc', 'in-progress', 'medium', '[\"user-1768974260\"]', 'admin-1', '2026-01-31', 0.00, 0.00, '2026-01-21 05:48:06', '2026-01-21 05:49:22'),
('task-1768974533', 'project-1768973722-2e7a72', 'Multi Task Test', 'Test Description', 'in-progress', 'medium', '[\"supervisor-1\",\"fabricator-1\",\"user-1768974260\"]', 'admin-1', '2026-01-30', 0.00, 0.00, '2026-01-21 05:48:53', '2026-01-21 06:13:03'),
('task-1769128082', 'project-1768973722-2e7a72', 'make task', 'make', 'pending', 'medium', '[\"user-1768974260\"]', 'admin-1', '2026-01-30', 0.00, 0.00, '2026-01-23 00:28:02', '2026-01-23 00:28:02');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','supervisor','fabricator','client') NOT NULL,
  `school` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `gcash_number` varchar(20) DEFAULT NULL,
  `secure_id` varchar(50) DEFAULT NULL,
  `employee_number` varchar(50) DEFAULT NULL,
  `client_project_id` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `gcash_qr_url` varchar(1000) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `school`, `phone`, `gcash_number`, `secure_id`, `employee_number`, `client_project_id`, `is_active`, `created_at`, `updated_at`, `gcash_qr_url`) VALUES
('admin-1', 'Admin 123 ADmin', 'admin@ehub.com', '$2y$10$4R8v0YVjUO021uPO5jEpzewFmpJCE1oZx9clMP9jVElCwM99JiXOG', 'admin', 'Araullo University', '09124971946', '09124919471', 'ADM001', 'EMP001', NULL, 1, '2026-01-13 00:42:15', '2026-01-22 05:11:59', '/uploads/gcash-qr/gcash-qr-admin-1-1769058719.png'),
('client-1', 'Sarah Client', 'client@ehub.com', '$2y$10$4R8v0YVjUO021uPO5jEpzewFmpJCE1oZx9clMP9jVElCwM99JiXOG', 'client', NULL, NULL, NULL, 'CLI001', NULL, NULL, 1, '2026-01-13 00:42:15', '2026-01-20 05:05:10', NULL),
('fabricator-1', 'Mike Fabricator', 'fabricator@ehub.com', '$2y$10$4R8v0YVjUO021uPO5jEpzewFmpJCE1oZx9clMP9jVElCwM99JiXOG', 'fabricator', NULL, NULL, NULL, 'FAB001', 'EMP003', NULL, 1, '2026-01-13 00:42:15', '2026-01-23 01:51:48', '/uploads/gcash-qr/gcash-qr-fabricator-1-1769133108.jpg'),
('supervisor-1', 'John Supervisor', 'supervisor@ehub.com', '$2y$10$eZ8YF4H2jz6xywtquWObQemHuvi1VGEBa7a8st7PzJd27UgB/tr1u', 'supervisor', NULL, NULL, NULL, 'SUP001', 'EMP002', NULL, 1, '2026-01-13 00:42:15', '2026-01-15 01:54:59', NULL),
('user-1768974134', 'Test Client', 'sde.gabriel.77@gmail.com', '$2y$10$tzM2MskkCuPOvhuIjai3v..b3wo3K346sVwOlZNcIgt6LdsojhJW2', 'client', 'Test Project 123', '+639287337984', NULL, 'CLIT9796E574', NULL, 'project-1768973722-2e7a72', 1, '2026-01-21 05:42:14', '2026-01-23 00:37:09', NULL),
('user-1768974260', 'Test Fabricator', 'test-fabricator@gmail.com', '$2y$10$YuvTLnY6nttC7LEwEddP/.viPY97ywK1maF.xWXqIZEMzuBXLhK3O', 'fabricator', 'Mapúa University', '+63 921 847 8124', '09124872471', 'FABT9799WA8C', 'EMP974260792', NULL, 1, '2026-01-21 05:44:20', '2026-01-21 06:43:36', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `work_logs`
--

CREATE TABLE `work_logs` (
  `id` varchar(255) NOT NULL,
  `project_id` varchar(255) NOT NULL,
  `user_id` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `hours_worked` decimal(5,2) NOT NULL,
  `description` text DEFAULT NULL,
  `progress_percentage` decimal(5,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `materials_used` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`materials_used`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `work_logs`
--

INSERT INTO `work_logs` (`id`, `project_id`, `user_id`, `date`, `hours_worked`, `description`, `progress_percentage`, `created_at`, `materials_used`) VALUES
('wl-1768976891-d741cf', 'project-1768973722-2e7a72', 'fabricator-1', '2026-01-21', 8.00, 'Test Description', 5.00, '2026-01-21 06:28:11', '[\"mat-1768976790\"]');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `materials`
--
ALTER TABLE `materials`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_project_id` (`project_id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_password_resets_token` (`token_hash`),
  ADD KEY `idx_password_resets_user` (`user_id`),
  ADD KEY `idx_password_resets_expires` (`expires_at`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_client_id` (`client_id`),
  ADD KEY `idx_supervisor_id` (`supervisor_id`),
  ADD KEY `idx_projects_created_at` (`created_at`);

--
-- Indexes for table `project_payments`
--
ALTER TABLE `project_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_id` (`project_id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_type` (`type`);

--
-- Indexes for table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_project_id` (`project_id`),
  ADD KEY `idx_assigned_to` (`assigned_to`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_tasks_due_date` (`due_date`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `secure_id` (`secure_id`),
  ADD UNIQUE KEY `employee_number` (`employee_number`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_secure_id` (`secure_id`),
  ADD KEY `idx_employee_number` (`employee_number`),
  ADD KEY `idx_users_role` (`role`);

--
-- Indexes for table `work_logs`
--
ALTER TABLE `work_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_project_id` (`project_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_work_logs_user_date` (`user_id`,`date`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `project_payments`
--
ALTER TABLE `project_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `announcements`
--
ALTER TABLE `announcements`
  ADD CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
