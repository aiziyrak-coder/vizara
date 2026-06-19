-- CreateTable
CREATE TABLE "VirtualTour" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "startSceneId" TEXT,
    "coverUrl" TEXT,
    "qrCodeUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VirtualTour_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TourScene" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "panoramaUrl" TEXT NOT NULL,
    "pitch" REAL NOT NULL DEFAULT 0,
    "yaw" REAL NOT NULL DEFAULT 0,
    "hfov" REAL NOT NULL DEFAULT 100,
    "order" INTEGER NOT NULL DEFAULT 0,
    "tourId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TourScene_tourId_fkey" FOREIGN KEY ("tourId") REFERENCES "VirtualTour" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TourHotspot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sceneId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'scene',
    "pitch" REAL NOT NULL,
    "yaw" REAL NOT NULL,
    "text" TEXT,
    "targetSceneId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TourHotspot_sceneId_fkey" FOREIGN KEY ("sceneId") REFERENCES "TourScene" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "VirtualTour_organizationId_slug_key" ON "VirtualTour"("organizationId", "slug");
