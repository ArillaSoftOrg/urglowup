# Phase 5: Queue Infrastructure for Large Campaigns

## Current Limitation (Phase 1-4)

The current implementation in phases 1-4 uses Vercel's `after()` callback for fire-and-forget sends within a single request context. This works well for campaigns up to ~500 recipients, but has limitations:

- **Vercel timeout**: Functions have a 25-30 second timeout
- **Batch processing**: Current implementation processes 50 emails/WhatsApps per batch with rate limiting
- **Error resilience**: If the function times out mid-send, partial deliveries may not be logged

## Phase 5: Recommended Architecture

### Option A: Inngest (Recommended)

Inngest is a managed workflow platform ideal for this use case.

**Setup:**

1. Install Inngest:
```bash
npm install inngest
```

2. Create workflow at `src/lib/campaigns/send-campaign.inngest.ts`:

```typescript
import { inngest } from "@/lib/inngest/client";
import { db } from "@/lib/db";
import { sendMarketingEmailCampaign as sendEmailBatch } from "@/lib/campaigns/send-email-batch";
import { sendMarketingWhatsAppCampaign as sendWhatsAppBatch } from "@/lib/campaigns/send-whatsapp-batch";

export const sendCampaign = inngest.createFunction(
  { id: "send-campaign" },
  { event: "campaign/send.requested" },
  async ({ event }) => {
    const campaignId = event.data.campaignId;
    
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      include: { recipients: { where: { status: "PENDING" } } },
    });

    if (!campaign) throw new Error("Campaign not found");

    const batchSize = 100; // Larger batches with Inngest
    
    for (let i = 0; i < campaign.recipients.length; i += batchSize) {
      const batch = campaign.recipients.slice(i, i + batchSize);
      
      if (campaign.channel === "EMAIL") {
        await sendEmailBatch(campaignId, batch);
      } else {
        await sendWhatsAppBatch(campaignId, batch);
      }
    }

    // Mark campaign as complete
    await db.campaign.update({
      where: { id: campaignId },
      data: { completedAt: new Date() },
    });
  }
);
```

3. Trigger from server action:
```typescript
// In src/app/(admin)/admin/actions.ts
import { inngest } from "@/lib/inngest/client";

export async function sendMarketingEmailCampaign(campaignId: string) {
  // Validation...
  
  // Enqueue with Inngest
  await inngest.send({
    name: "campaign/send.requested",
    data: { campaignId },
  });

  return { success: true, message: "Campaign queued for sending" };
}
```

**Advantages:**
- Handles timeouts automatically
- Retries on failure
- Monitoring dashboard
- Scales to millions of sends
- Priority queues

**Cost:** Free tier includes 2,500/month function calls

### Option B: Vercel Cron

For simpler setup without external dependencies:

**Setup:**

1. Create cron endpoint at `src/app/api/cron/send-campaigns/route.ts`:

```typescript
import { db } from "@/lib/db";
import { sendMarketingEmailCampaign as sendEmailBatch } from "@/lib/campaigns/send-email-batch";

export async function GET(req: Request) {
  // Verify cron secret
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Find campaigns in SENDING status
  const campaigns = await db.campaign.findMany({
    where: { status: "SENDING" },
    include: {
      recipients: { where: { status: "PENDING" } },
    },
  });

  for (const campaign of campaigns) {
    if (campaign.channel === "EMAIL") {
      await sendEmailBatch(campaign.id, campaign.recipients);
    }
  }

  return Response.json({ processed: campaigns.length });
}
```

2. Set up cron in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/send-campaigns",
    "schedule": "*/5 * * * *"
  }]
}
```

**Advantages:**
- No external dependencies
- Built into Vercel
- Simple setup

**Disadvantages:**
- Limited to 5-minute intervals minimum
- No retry logic (must implement manually)
- Limited monitoring

## Implementation Checklist for Phase 5

- [ ] Choose Inngest or Vercel Cron
- [ ] Create queue infrastructure
- [ ] Update `sendMarketingEmailCampaign` action to enqueue instead of send directly
- [ ] Update `sendMarketingWhatsAppCampaign` action similarly
- [ ] Create batch send functions that respect rate limits
- [x] Add webhook handlers for delivery confirmations (Resend webhooks) — implemented at `/api/webhooks/resend`
- [x] Implement bounce/complaint suppression from Resend webhooks — marks CampaignRecipient as SKIPPED
- [ ] Add job status monitoring dashboard
- [ ] Test with 5,000+ recipient campaign
- [ ] Document suppression list model and behavior

## Suppression List Model

Add to `prisma/schema.prisma`:

```prisma
model CampaignSuppression {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type         SuppressionType // BOUNCE, COMPLAINT, UNSUBSCRIBE
  channel      NotificationChannel
  reason       String?
  providerData Json?
  createdAt    DateTime @default(now())

  @@unique([userId, type, channel])
  @@index([createdAt])
}

enum SuppressionType {
  BOUNCE
  COMPLAINT
  UNSUBSCRIBE
}
```

Webhook handler for Resend:

```typescript
// src/app/api/webhooks/resend/route.ts
export async function POST(req: Request) {
  const event = await req.json();

  if (event.type === "email.bounced") {
    await db.campaignSuppression.create({
      data: {
        userId: event.userId,
        type: "BOUNCE",
        channel: "EMAIL",
        providerData: event,
      },
    });
  }

  return Response.json({ success: true });
}
```

## Monitoring & Alerts

Consider adding:
- Campaign send status page in admin
- Email alerts on campaign failures
- Grafana dashboard for send metrics
- PagerDuty integration for critical failures

## Rate Limits Reference

**Resend:**
- Free/Pro: 100 emails/second
- Enterprise: Custom

**WhatsApp (Meta):**
- Tier 1: 1,000 msgs/day
- Tier 2: 10,000 msgs/day  
- Tier 3: 100,000+ msgs/day

Adjust batch sizes based on your Meta tier.
