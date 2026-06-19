-- AlterTable
ALTER TABLE "DiaryEntry" ADD COLUMN     "reviewIsPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "DiaryEntry_userId_reviewIsPublic_watchedAt_idx" ON "DiaryEntry"("userId", "reviewIsPublic", "watchedAt");
