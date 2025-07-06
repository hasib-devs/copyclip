CREATE TABLE IF NOT EXISTS `clips` (
    `id` TEXT PRIMARY KEY,
    `content_type` TEXT NOT NULL DEFAULT 'text',
    `content` TEXT NOT NULL,
    `is_pinned` BOOLEAN DEFAULT 0,
    `created_at` INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    `updated_at` INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);