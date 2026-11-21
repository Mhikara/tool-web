export type SimpleTool = {
  slug: string;
  title: string;
  description: string;
  tag: string;
  icon: string;
  href: string;
};

export const toolsList: SimpleTool[] = [
  {
    slug: "premium-bypasser",
    title: "Premium Bypasser",
    description: "Bypass Linkvertise, Workink, & SC Key",
    href: "/bypasser",
    icon: "🔓",
    tag: "Tools",
  },
];
