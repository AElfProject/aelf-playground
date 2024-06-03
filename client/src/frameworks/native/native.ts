import { createFramework } from "../create";
import { Lang } from "../../utils/pg";

export const native = createFramework({
  name: "Native",
  language: Lang.CSHARP,
  icon: "/icons/platforms/aelf.png",
  githubExample: {
    name: "Hello World",
    // Only import the program for now since `fs` and `os` modules are not
    // implemented in Playground. We could solve it by converting the code
    // where it reads the user keypair and the program keypair but the goal
    // is to make everything that works in a local Node environment work in
    // Playground without any modifications.
    // TODO: Implement `fs` and `os` modules.
    // url: "https://github.com/solana-developers/program-examples/tree/main/basics/hello-solana/native",
    url: "https://github.com/AElfProject/aelf-developer-tools/tree/master/templates/HelloWorldContract",
  },
  getIsCurrent: (files) => {
    for (const [path, content] of files) {
      if (!path.endsWith(".csproj")) continue;
      const hasAElfContracts = content.includes("AElf.Contracts");
      if (hasAElfContracts) return true;
    }

    return false;
  },
});
