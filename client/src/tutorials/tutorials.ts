import { createTutorials } from "./create";

/** All visible tutorials at `/tutorials`(in order) */
export const TUTORIALS = createTutorials({
  name: "Hello aelf",
  description: "Hello world program with Native aelf.",
  authors: [
    {
      name: "aelf",
    },
  ],
  level: "Beginner",
  framework: "Native",
  languages: ["CSharp", "Protobuf", "TypeScript"],
});
