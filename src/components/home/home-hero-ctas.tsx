import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export async function HomeHeroCTAs() {
  const { userId } = await auth();

  return (
    <div className="mt-8 flex flex-wrap justify-center gap-3">
      <Link
        href="/explore"
        className={cn(buttonVariants({ size: "lg" }), "px-8 shadow-sm")}
      >
        Uzmanları Keşfet
      </Link>
      {!userId && (
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
