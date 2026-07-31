import { notFound } from "next/navigation";
import { getToolBySlug, makerTools } from "@/lib/makerTools";
import MakerCanvas from "@/components/MakerCanvas";

export function generateStaticParams() {
  return makerTools.map((t) => ({ slug: t.slug }));
}

export default function MakerToolPage({ params }: { params: { slug: string } }) {
  const tool = getToolBySlug(params.slug);
  if (!tool) return notFound();
  return <MakerCanvas tool={tool} />;
}
