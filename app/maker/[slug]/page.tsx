import { makerTools } from "@/lib/makerTools";
import MakerCanvas from "@/components/MakerCanvas";

export function generateStaticParams() {
  return makerTools.map((t) => ({ slug: t.slug }));
}

export default async function MakerToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <MakerCanvas slug={slug} />;
}
