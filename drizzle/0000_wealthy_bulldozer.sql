CREATE TABLE "scraping_configs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "scraping_configs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"url" varchar(2048) NOT NULL,
	"selector" varchar(512) NOT NULL,
	"minutes" integer DEFAULT 5 NOT NULL,
	"last_run" timestamp,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "scraping_results" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "scraping_results_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"config_id" integer NOT NULL,
	"content" jsonb NOT NULL,
	"hash" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scraping_results" ADD CONSTRAINT "scraping_results_config_id_scraping_configs_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."scraping_configs"("id") ON DELETE cascade ON UPDATE no action;