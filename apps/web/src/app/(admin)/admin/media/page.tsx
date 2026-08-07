import { getAdminMedia } from "@/lib/queries/admin";
import { MediaModerationTable } from "@/components/admin/media-moderation-table";

export const metadata = { title: "Admin - Media" };

export default async function AdminMediaPage() {
  const media = await getAdminMedia();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Media Moderation</h1>
        <p className="text-muted-foreground">
          Review and moderate business media. Hidden and removed media will not
          appear on public business pages.
        </p>
      </div>
      <MediaModerationTable media={media} />
    </div>
  );
}
