import { Tutorial } from "../../components/Tutorial";
import { PgExplorer, PgView } from "../../utils/pg";

const createMissingFiles = async (sourcePath: string, content?: string) => {
  const sourceExists = await PgExplorer.fs.exists(sourcePath);
  if (!sourceExists) {
    await PgExplorer.newItem(sourcePath, content);
  }

  await PgExplorer.openFile(sourcePath);
};

const HelloAElf = () => (
  <Tutorial
    // About section that will be shown under the description of the tutorial page
    about={require("./about.md")}
    // Actual tutorial pages to show next to the editor
    pages={[
      {
        content: require("./pages/1.md"),
        title: "Hello World",
        onMount: async () => {
          // Switch sidebar state to Explorer
          PgView.setSidebarPage("Explorer");

          await createMissingFiles(
            "src/interface.proto",
            require("./files/interface.proto")
          );
        },
      },
      {
        content: require("./pages/2.md"),
        title: "State",
        onMount: async () => {
          // Switch sidebar state to Explorer
          PgView.setSidebarPage("Explorer");

          await createMissingFiles("src/state.cs", require("./files/state.cs"));
        },
      },
      {
        content: require("./pages/3.md"),
        title: "Contract",
        onMount: async () => {
          // Switch sidebar state to Explorer
          PgView.setSidebarPage("Explorer");

          await createMissingFiles(
            "src/contract.cs",
            require("./files/contract.cs")
          );
        },
      },
      {
        content: require("./pages/4.md"),
        title: "Build",
        onMount: async () => {
          // Switch sidebar state to Build & Deploy
          PgView.setSidebarPage("Build & Deploy");
        },
      },
    ]}
    // Initial files to have at the beginning of the tutorial
    files={[["src/state.cs", require("./files/state.cs")]]}
  />
);

export default HelloAElf;
