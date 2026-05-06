CREATE TABLE `adminAuditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`targetUserId` int,
	`action` varchar(96) NOT NULL,
	`detailsJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adminAuditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `systemSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`profitRate` decimal(8,4) NOT NULL DEFAULT '0.82',
	`durationsJson` json NOT NULL,
	`contractsEnabled` boolean NOT NULL DEFAULT true,
	`depositsEnabled` boolean NOT NULL DEFAULT true,
	`withdrawalsEnabled` boolean NOT NULL DEFAULT true,
	`simulationModeEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `systemSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`symbol` varchar(24) NOT NULL DEFAULT 'BTCUSDT',
	`direction` enum('UP','FALL') NOT NULL,
	`durationSeconds` int NOT NULL,
	`amount` decimal(20,8) NOT NULL,
	`profitRate` decimal(8,4) NOT NULL DEFAULT '0.82',
	`entryPrice` decimal(24,8) NOT NULL,
	`closingPrice` decimal(24,8),
	`status` enum('open','won','lost','draw','cancelled') NOT NULL DEFAULT 'open',
	`resultSource` enum('price_engine','demo_override') NOT NULL DEFAULT 'price_engine',
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`settlesAt` timestamp NOT NULL,
	`settledAt` timestamp,
	CONSTRAINT `trades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`asset` enum('USDT','BTC','ETH') NOT NULL,
	`type` enum('deposit','withdraw','transfer','adjustment','trade_payout','trade_stake') NOT NULL,
	`status` enum('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending',
	`amount` decimal(20,8) NOT NULL,
	`note` text,
	`adminId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`asset` enum('USDT','BTC','ETH') NOT NULL,
	`balance` decimal(20,8) NOT NULL DEFAULT '0',
	`demoBalance` decimal(20,8) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` text;--> statement-breakpoint
ALTER TABLE `users` ADD `vipLevel` varchar(24) DEFAULT 'VIP 0' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `isFrozen` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `demoMode` boolean DEFAULT true NOT NULL;