-- Account deletion is anonymization (see User.deletedAt doc comment in
-- schema.prisma), not a row delete — several relations use onDelete:
-- Restrict and business-side historical records need to survive.
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
