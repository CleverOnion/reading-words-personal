CREATE TABLE `attempts` (
	`session_id` text NOT NULL,
	`position` integer NOT NULL,
	`word_id` text NOT NULL,
	`choice` text,
	`correct` integer NOT NULL,
	`answered_at` integer NOT NULL,
	`duration` integer NOT NULL,
	PRIMARY KEY(`session_id`, `position`),
	FOREIGN KEY (`session_id`) REFERENCES `sessions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`mode` text NOT NULL,
	`queue` text NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`status` text DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_user_started` ON `sessions` (`user_id`,`started_at`);