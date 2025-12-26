-- CreateTable
CREATE TABLE "telegram_links" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "telegram_id" TEXT,
    "telegram_chat_id" TEXT,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "telegram_links_code_key" ON "telegram_links"("code");

-- CreateIndex
CREATE INDEX "telegram_links_code_idx" ON "telegram_links"("code");

-- CreateIndex
CREATE INDEX "telegram_links_user_id_idx" ON "telegram_links"("user_id");

-- CreateIndex
CREATE INDEX "telegram_links_telegram_id_idx" ON "telegram_links"("telegram_id");

-- AddForeignKey
ALTER TABLE "telegram_links" ADD CONSTRAINT "telegram_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
