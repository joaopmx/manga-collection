/*
  Warnings:

  - You are about to alter the column `rating` on the `LibraryEntry` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LibraryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rating" REAL,
    "currentVolume" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LibraryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LibraryEntry_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LibraryEntry" ("createdAt", "currentVolume", "id", "mangaId", "rating", "status", "updatedAt", "userId") SELECT "createdAt", "currentVolume", "id", "mangaId", "rating", "status", "updatedAt", "userId" FROM "LibraryEntry";
DROP TABLE "LibraryEntry";
ALTER TABLE "new_LibraryEntry" RENAME TO "LibraryEntry";
CREATE UNIQUE INDEX "LibraryEntry_userId_mangaId_key" ON "LibraryEntry"("userId", "mangaId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
