CREATE TABLE `saved_words` (
	`user_id` text NOT NULL,
	`word_id` text NOT NULL,
	`saved_at` integer NOT NULL,
	PRIMARY KEY(`user_id`, `word_id`)
);
