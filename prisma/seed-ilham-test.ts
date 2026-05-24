/**
 * Dev-only seed: creates 4 İlham feed test posts for UI verification.
 *
 * Create:  npx dotenv-cli -e .env -- npx tsx prisma/seed-ilham-test.ts
 * Cleanup: npx dotenv-cli -e .env -- npx tsx prisma/seed-ilham-test.ts --cleanup
 *
 * Posts are identified by description prefix "[ILHAM_TEST]" or media publicId
 * prefix "ILHAM_TEST/" and can be fully removed without affecting real data.
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ─── Real Cloudinary assets already in the DB ────────────────────────────────
const VIDEO_PORTRAIT =
  "https://res.cloudinary.com/darxavbif/video/upload/v1779584933/urglowup/cmp3j3gp9000104lh1xmjnxeb/posts/tftekhdxscpe6ugncbrw.mov";
const IMG_A =
  "https://res.cloudinary.com/darxavbif/image/upload/v1779584939/urglowup/cmp3j3gp9000104lh1xmjnxeb/posts/kvcsuocttkjj5utpxbt7.jpg";
const IMG_B =
  "https://res.cloudinary.com/darxavbif/image/upload/v1779584941/urglowup/cmp3j3gp9000104lh1xmjnxeb/posts/ivdfpjwoxarwyxojtjxc.jpg";

const BUSINESS_ID = "cmp6dwc08000104la9d0mm2oq"; // CHARM BEAUTY NAİL

async function create() {
  // Verify business still exists
  const biz = await prisma.business.findUnique({
    where: { id: BUSINESS_ID },
    select: { id: true, name: true },
  });
  if (!biz) throw new Error(`Business ${BUSINESS_ID} not found — update BUSINESS_ID.`);
  console.log(`Attaching to: ${biz.name}`);

  // 1. Text-only — no media block should appear in the feed
  await prisma.post.create({
    data: {
      businessId: BUSINESS_ID,
      description:
        "[ILHAM_TEST] Saç bakımında doğal yöntemler her zaman en iyisidir. " +
        "Haftada iki kez protein maskesi uygulamanızı tavsiye ediyoruz. " +
        "Detaylı bilgi için bizi ziyaret edin.",
      status: "ACTIVE",
    },
  });
  console.log("✓ text-only post");

  // 2. Image-only — natural portrait ratio, no description
  await prisma.post.create({
    data: {
      businessId: BUSINESS_ID,
      description: null,
      status: "ACTIVE",
      media: {
        create: [
          {
            url: IMG_A,
            publicId: "ILHAM_TEST/image-only",
            type: "IMAGE",
            sortOrder: 0,
            width: 2268,
            height: 4032,
          },
        ],
      },
    },
  });
  console.log("✓ image-only post");

  // 3. Video-only — portrait video (2160×3840), mute/loading UX
  await prisma.post.create({
    data: {
      businessId: BUSINESS_ID,
      description: "[ILHAM_TEST] Boyama işlemi canlı çekim — dikey format.",
      status: "ACTIVE",
      media: {
        create: [
          {
            url: VIDEO_PORTRAIT,
            publicId: "ILHAM_TEST/video-only",
            type: "VIDEO",
            sortOrder: 0,
            width: 2160,
            height: 3840,
            duration: 15,
          },
        ],
      },
    },
  });
  console.log("✓ video-only post");

  // 4. Mixed multi-media — image A + image B + video (tests swipe/dots/arrows)
  await prisma.post.create({
    data: {
      businessId: BUSINESS_ID,
      description: "[ILHAM_TEST] Karma medya — 3 öğe: iki fotoğraf ve bir video.",
      status: "ACTIVE",
      media: {
        create: [
          {
            url: IMG_A,
            publicId: "ILHAM_TEST/mixed-img-a",
            type: "IMAGE",
            sortOrder: 0,
            width: 2268,
            height: 4032,
          },
          {
            url: IMG_B,
            publicId: "ILHAM_TEST/mixed-img-b",
            type: "IMAGE",
            sortOrder: 1,
            width: 2268,
            height: 4032,
          },
          {
            url: VIDEO_PORTRAIT,
            publicId: "ILHAM_TEST/mixed-video",
            type: "VIDEO",
            sortOrder: 2,
            width: 2160,
            height: 3840,
            duration: 15,
          },
        ],
      },
    },
  });
  console.log("✓ mixed multi-media post");

  console.log("\nDone. Remove with: npx dotenv-cli -e .env -- npx tsx prisma/seed-ilham-test.ts --cleanup");
}

async function cleanup() {
  const { count } = await prisma.post.deleteMany({
    where: {
      OR: [
        { description: { startsWith: "[ILHAM_TEST]" } },
        { media: { some: { publicId: { startsWith: "ILHAM_TEST/" } } } },
      ],
    },
  });
  console.log(`Removed ${count} test post(s).`);
}

async function main() {
  if (process.argv.includes("--cleanup")) {
    await cleanup();
  } else {
    await create();
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
