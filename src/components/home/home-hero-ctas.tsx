import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export async function HomeHeroCTAs() {
  const user = await getCurrentUser();

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <Link
        href="/explore"
        className={cn(buttonVariants({ size: "lg" }), "px-8 shadow-sm")}
      >
        Uzmanları Keşfet
      </Link>
      {!user && (
        <Link
          href="/for-business"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "px-8"
          )}
        >
          İşletmeler İçin
        </Link>
      )}
    </div>
  );
}
