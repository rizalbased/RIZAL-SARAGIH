-- ==============================================================================
-- MKVERSE Database Schema (MySQL / MariaDB)
-- Database Name: mkversem_mkverse
-- Target: cPanel MySQL / MariaDB (PHP REST API Backend)
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `mkversem_mkverse` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `mkversem_mkverse`;

-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) PRIMARY KEY,
  `full_name` VARCHAR(100) NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `username` VARCHAR(100) UNIQUE NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `membership_status` VARCHAR(50) DEFAULT 'Siswa',
  `user_type` VARCHAR(50) DEFAULT 'Siswa',
  `class_name` VARCHAR(50) DEFAULT NULL,
  `kelas` VARCHAR(50) DEFAULT NULL,
  `major` VARCHAR(100) DEFAULT NULL,
  `jurusan` VARCHAR(100) DEFAULT NULL,
  `mata_pelajaran` VARCHAR(100) DEFAULT NULL,
  `divisi` VARCHAR(100) DEFAULT NULL,
  `profile_photo` VARCHAR(255) DEFAULT NULL,
  `avatar` VARCHAR(255) DEFAULT NULL,
  `cover_image` VARCHAR(255) DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `role` VARCHAR(50) DEFAULT 'USER',
  `status` VARCHAR(20) DEFAULT 'Active',
  `email_verified` TINYINT(1) DEFAULT 0,
  `google_id` VARCHAR(255) UNIQUE DEFAULT NULL,
  `auth_provider` VARCHAR(50) DEFAULT 'local',
  `verification_token_hash` VARCHAR(255) DEFAULT NULL,
  `verification_expires_at` DATETIME DEFAULT NULL,
  `reset_token_hash` VARCHAR(255) DEFAULT NULL,
  `reset_expires_at` DATETIME DEFAULT NULL,
  `has_completed_profile` TINYINT(1) DEFAULT 1,
  `followers_count` INT DEFAULT 0,
  `following_count` INT DEFAULT 0,
  `posts_count` INT DEFAULT 0,
  `last_login` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_username` (`username`),
  INDEX `idx_users_google_id` (`google_id`),
  INDEX `idx_users_verify_token` (`verification_token_hash`),
  INDEX `idx_users_reset_token` (`reset_token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rate Limits / Brute Force Protection Table
CREATE TABLE IF NOT EXISTS `rate_limits` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `action` VARCHAR(50) NOT NULL,
  `identifier` VARCHAR(255) NOT NULL,
  `attempts` INT DEFAULT 1,
  `last_attempt_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_rate_limit` (`action`, `identifier`),
  INDEX `idx_rate_limit_lookup` (`action`, `identifier`, `last_attempt_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Posts Table
CREATE TABLE IF NOT EXISTS `posts` (
  `id` VARCHAR(50) PRIMARY KEY,
  `author_id` VARCHAR(50) NOT NULL,
  `type` VARCHAR(50) DEFAULT 'post',
  `content` TEXT NOT NULL,
  `media_url` VARCHAR(255) DEFAULT NULL,
  `media_type` VARCHAR(50) DEFAULT NULL,
  `mood_tag` VARCHAR(50) DEFAULT NULL,
  `is_anonymous` BOOLEAN DEFAULT FALSE,
  `likes_count` INT DEFAULT 0,
  `comments_count` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_posts_created` (`created_at`),
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Post Likes Table
CREATE TABLE IF NOT EXISTS `post_likes` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `post_id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_like` (`post_id`, `user_id`),
  FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Post Comments Table
CREATE TABLE IF NOT EXISTS `post_comments` (
  `id` VARCHAR(50) PRIMARY KEY,
  `post_id` VARCHAR(50) NOT NULL,
  `user_id` VARCHAR(50) NOT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Follows Table
CREATE TABLE IF NOT EXISTS `follows` (
  `follower_id` VARCHAR(50) NOT NULL,
  `target_id` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`follower_id`, `target_id`),
  FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`target_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Follow Requests Table
CREATE TABLE IF NOT EXISTS `follow_requests` (
  `follower_id` VARCHAR(50) NOT NULL,
  `target_id` VARCHAR(50) NOT NULL,
  `status` VARCHAR(20) DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`follower_id`, `target_id`),
  FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`target_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(50) PRIMARY KEY,
  `user_id` VARCHAR(50) NOT NULL,
  `actor_id` VARCHAR(50) DEFAULT NULL,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `is_read` BOOLEAN DEFAULT FALSE,
  `is_request` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stories Table
CREATE TABLE IF NOT EXISTS `stories` (
  `id` VARCHAR(50) PRIMARY KEY,
  `author_id` VARCHAR(50) NOT NULL,
  `media_url` VARCHAR(255) DEFAULT NULL,
  `text` TEXT,
  `bg_gradient` VARCHAR(100) DEFAULT NULL,
  `views_count` INT DEFAULT 0,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Default Admin User (Password: 1902)
-- Bcrypt Hash for '1902': $2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm
INSERT IGNORE INTO `users` (
  `id`, `full_name`, `display_name`, `username`, `email`, `password_hash`,
  `membership_status`, `user_type`, `class_name`, `kelas`, `major`, `jurusan`,
  `profile_photo`, `avatar`, `role`, `status`, `email_verified`, `auth_provider`, `has_completed_profile`
) VALUES (
  'usr_admin_001', 'Official Admin MKVERSE', 'Official Admin MKVERSE', 'admin_mkverse',
  'admin@smkmultikarya.sch.id', '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm',
  'Karyawan', 'Karyawan', 'Staff IT', 'Staff IT', 'Multi Karya Hub', 'Multi Karya Hub',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'ADMIN', 'Active', 1, 'local', 1
);
