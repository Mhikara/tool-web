import { Suspense } from "react";
import KatalogClient from "./KatalogClient";
import CatalogSkeleton from "@/components/baca-komik/CatalogSkeleton";

export default function KatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0c] p-4">
          <CatalogSkeleton />
        </div>
      }
    >
      <KatalogClient />
    </Suspense>
  );
}
