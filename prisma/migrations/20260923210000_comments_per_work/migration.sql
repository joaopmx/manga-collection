-- CreateTable
CREATE TABLE "MangaComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "mangaId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "spoiler" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MangaComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MangaComment_mangaId_fkey" FOREIGN KEY ("mangaId") REFERENCES "Manga" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MangaComment_mangaId_createdAt_idx" ON "MangaComment"("mangaId", "createdAt");

-- Keep existing per-volume comments, now attached to the work itself.
INSERT INTO "MangaComment" ("id", "userId", "mangaId", "content", "createdAt", "updatedAt")
SELECT "id", "userId", "mangaId", '[Vol. ' || "volumeNumber" || '] ' || "comment", "createdAt", "updatedAt"
FROM "VolumeComment";

-- DropTable
DROP TABLE "VolumeComment";
