CREATE TABLE `config` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date` text NOT NULL,
	`body_battery` integer,
	`sleep_notes` text,
	`mood` text,
	`priorities` text,
	`appointments` text,
	`generated_plan` text,
	`reflections` text,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`telegram_message_id` integer NOT NULL,
	`direction` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer NOT NULL
);
