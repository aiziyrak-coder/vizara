-- Rich virtual tour hotspots: media, banners, scene descriptions
ALTER TABLE "VirtualTour" ADD COLUMN "settings" TEXT;

ALTER TABLE "TourScene" ADD COLUMN "description" TEXT;
ALTER TABLE "TourScene" ADD COLUMN "ambientAudioUrl" TEXT;

ALTER TABLE "TourHotspot" ADD COLUMN "title" TEXT;
ALTER TABLE "TourHotspot" ADD COLUMN "body" TEXT;
ALTER TABLE "TourHotspot" ADD COLUMN "mediaUrl" TEXT;
ALTER TABLE "TourHotspot" ADD COLUMN "mediaType" TEXT;
ALTER TABLE "TourHotspot" ADD COLUMN "linkUrl" TEXT;
ALTER TABLE "TourHotspot" ADD COLUMN "icon" TEXT;
ALTER TABLE "TourHotspot" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Default existing navigation hotspots
UPDATE "TourHotspot" SET "type" = 'scene' WHERE "type" = 'scene' AND "targetSceneId" IS NOT NULL;
UPDATE "TourHotspot" SET "type" = 'info' WHERE "type" = 'scene' AND "targetSceneId" IS NULL;
