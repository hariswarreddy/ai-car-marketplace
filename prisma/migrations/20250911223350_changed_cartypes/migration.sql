/*
  Warnings:

  - The values [TRUCK] on the enum `CarType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."CarType_new" AS ENUM ('SEDAN', 'SUV', 'HATCHBACK', 'COUPE', 'CONVERTIBLE', 'PICKUP', 'VAN', 'WAGON', 'CROSSOVER', 'SPORTS', 'OTHER');
ALTER TABLE "public"."Car" ALTER COLUMN "type" TYPE "public"."CarType_new" USING ("type"::text::"public"."CarType_new");
ALTER TYPE "public"."CarType" RENAME TO "CarType_old";
ALTER TYPE "public"."CarType_new" RENAME TO "CarType";
DROP TYPE "public"."CarType_old";
COMMIT;
