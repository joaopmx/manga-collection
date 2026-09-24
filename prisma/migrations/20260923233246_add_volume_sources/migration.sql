-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Manga" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "anilistId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "titleEnglish" TEXT,
    "synopsis" TEXT,
    "synopsisPt" TEXT,
    "coverImage" TEXT,
    "authors" TEXT,
    "genres" TEXT,
    "volumesCount" INTEGER,
    "volumesEstimated" BOOLEAN NOT NULL DEFAULT false,
    "volumesCheckedAt" DATETIME,
    "mangaUpdatesId" TEXT,
    "startYear" INTEGER,
    "chaptersCount" INTEGER,
    "publishStatus" TEXT,
    "score" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Manga" ("anilistId", "authors", "chaptersCount", "coverImage", "createdAt", "genres", "id", "publishStatus", "score", "synopsis", "synopsisPt", "title", "titleEnglish", "volumesCount") SELECT "anilistId", "authors", "chaptersCount", "coverImage", "createdAt", "genres", "id", "publishStatus", "score", "synopsis", "synopsisPt", "title", "titleEnglish", "volumesCount" FROM "Manga";
DROP TABLE "Manga";
ALTER TABLE "new_Manga" RENAME TO "Manga";
CREATE UNIQUE INDEX "Manga_anilistId_key" ON "Manga"("anilistId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
