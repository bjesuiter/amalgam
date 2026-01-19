CREATE TABLE `chats` (
	`id` text PRIMARY KEY NOT NULL,
	`workdir_id` text NOT NULL,
	`title` text,
	`created_at` integer NOT NULL,
	`last_active_at` integer NOT NULL,
	`status` text DEFAULT 'idle' NOT NULL,
	FOREIGN KEY (`workdir_id`) REFERENCES `workdirs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workdirs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`remote_path` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_synced_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
