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
    slug: "auto-clip",
    title: "Auto Clip",
    description: "Potong video jadi beberapa klip otomatis",
    tag: "VIDEO",
    icon: "✂️",
    href: "/tools/auto-clip",
  },
];
