/*
  Warnings:

  - You are about to drop the column `malId` on the `Manga` table. All the data in the column will be lost.
  - Added the required column `anilistId` to the `Manga` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Manga" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anilistId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "titleEnglish" TEXT,
    "synopsis" TEXT,
    "coverImage" TEXT,
    "authors" TEXT,
    "genres" TEXT,
    "volumesCount" INTEGER,
    "chaptersCount" INTEGER,
    "publishStatus" TEXT,
    "score" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Manga" ("authors", "chaptersCount", "coverImage", "createdAt", "genres", "id", "publishStatus", "score", "synopsis", "title", "titleEnglish", "volumesCount") SELECT "authors", "chaptersCount", "coverImage", "createdAt", "genres", "id", "publishStatus", "score", "synopsis", "title", "titleEnglish", "volumesCount" FROM "Manga";
DROP TABLE "Manga";
ALTER TABLE "new_Manga" RENAME TO "Manga";
CREATE UNIQUE INDEX "Manga_anilistId_key" ON "Manga"("anilistId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
