import { createTutorials } from "./create";

/** All visible tutorials at `/tutorials`(in order) */
export const TUTORIALS = createTutorials({
  name: "Hello AElf",
  description: "Hello world program with Native AElf.",
  authors: [
    {
      name: "aelf",
    },
  ],
  level: "Beginner",
  framework: "Native",
  languages: ["CSharp", "Protobuf", "TypeScript"],
});
