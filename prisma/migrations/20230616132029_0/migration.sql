-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "trophies" INTEGER NOT NULL DEFAULT 0,
    "mass" INTEGER NOT NULL DEFAULT 0,
    "speedPowerUp" INTEGER NOT NULL DEFAULT 0,
    "sizePowerUp" INTEGER NOT NULL DEFAULT 0,
    "recombinePowerUp" INTEGER NOT NULL DEFAULT 0,
    "placeVirusPowerUp" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");
