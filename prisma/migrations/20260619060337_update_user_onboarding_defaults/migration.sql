/*
  Warnings:

  - You are about to alter the column `socialLink` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(500)`.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "socialLink" SET DATA TYPE VARCHAR(500),
ALTER COLUMN "isPublic" SET DEFAULT false;
