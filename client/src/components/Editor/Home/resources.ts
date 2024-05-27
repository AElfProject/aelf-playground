export interface ResourceProps {
  title: string;
  text: string;
  url: string;
  src: string;
  circleImage?: boolean;
}

export const RESOURCES: ResourceProps[] = [
  {
    title: "Learn",
    text: "Detailed explanations and guides for building applications on AElf.",
    url: "https://learn.aelf.dev/",
    src: "/icons/platforms/aelf.png",
  },
];
