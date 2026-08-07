import { requireBusiness } from "@/lib/auth";
import { db } from "@/lib/db";
import { BusinessPageHeader } from "@/components/business/business-page-header";
import { CouponList } from "@/components/business/coupon-list";
import { CouponCreateForm } from "@/components/business/coupon-create-form";

export const metadata = { title: "Kuponlar" };

export default async function CouponsPage() {
  const { businessId } = await requireBusiness("MANAGER");

  const coupons = await db.coupon.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <BusinessPageHeader
        title="Kuponlar & İndirimler"
        description="Müşterileriniz için indirim kodu oluşturun ve yönetin."
      />
      <CouponCreateForm />
      <CouponList coupons={coupons} />
    </div>
  );
}
