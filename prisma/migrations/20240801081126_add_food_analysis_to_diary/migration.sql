-- AlterTable
ALTER TABLE "Diary" ADD COLUMN     "calorieBreakdown" JSONB,
ADD COLUMN     "ingredients" TEXT[],
ADD COLUMN     "totalCalories" DOUBLE PRECISION;
