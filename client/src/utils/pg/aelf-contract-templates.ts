import { strFromU8, unzipSync } from "fflate";
import { PgExplorer, TupleFiles } from "./explorer";
import { PgFramework } from "./framework";

export class PgAElfContractTemplates {
  /**
   * Create a new workspace from the given template.
   *
   * @param template template name
   * @param projectName Project name
   */
  static async import(template: string, projectName: string) {
    // Check whether the repository already exists in user's workspaces
    const aelfWorkspaceName = `${template}-${projectName}`;

    if (PgExplorer.allWorkspaceNames?.includes(aelfWorkspaceName)) {
      // Switch to the existing workspace
      await PgExplorer.switchWorkspace(aelfWorkspaceName);
    } else {
      // Create a new workspace
      const convertedFiles = await this.getFiles(template, projectName);
      await PgExplorer.newWorkspace(aelfWorkspaceName, {
        files: convertedFiles,
        skipNameValidation: true,
      });
    }
  }

  /**
   * Get the files from the given template and map them to `TupleFiles`.
   *
   * @param template template name
   * @param projectName Project name
   * @returns explorer files
   */
  static async getFiles(template: string, projectName: string) {
    const files = await this._getTemplateData(template, projectName);
    const convertedFiles = await PgFramework.convertToPlaygroundLayout(files);
    return convertedFiles;
  }

  static async getTemplateNames() {
    const res = await fetch(`/playground/templates`);

    const data: string[] = await res.json();

    return data;
  }

  /**
   * Get Template data.
   *
   * @param template Template name
   * @param projectName Project name
   * @returns data
   */
  private static async _getTemplateData(template: string, projectName: string) {
    const res = await fetch(
      `/playground/template?template=${template}&projectName=${projectName}`
    );

    const data = await res.text();

    const bytes = Buffer.from(data, "base64");
    const unzipped = unzipSync(bytes);

    const files: TupleFiles = Object.entries(unzipped).map(([key, val]) => [
      key,
      strFromU8(val),
    ]);

    return files;
  }
}
