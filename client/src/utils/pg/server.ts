import type { TupleFiles } from "./explorer";
import { ZipFiles } from "./zip-files";
import { v4 as uuidv4 } from "uuid";

/** Rust `Option` type */
type Option<T> = T | null | undefined;

/** `/build` request */
interface BuildRequest {
  /** Program files */
  files: TupleFiles;
  /** UUID of the program */
  uuid?: Option<string>;
  /** Build flags */
  flags?: Option<{
    /** Whether to enable Anchor `seeds` feature */
    seedsFeature?: Option<boolean>;
    /** Whether to remove docs from the Anchor IDL */
    noDocs?: Option<boolean>;
    /** Whether to enable Anchor safety checks */
    safetyChecks?: Option<boolean>;
  }>;
}

export class PgServer {
  /**
   * Build the program files.
   *
   * @param req build request
   * @returns the build response
   */
  static async build(req: BuildRequest) {
    const zip = ZipFiles(req.files);
    return await this._build(zip);
  }

  /**
   * Send a build request to the Playground server.
   *
   * @throws when the response is not OK with the decoded response
   * @returns the HTTP response
   */
  private static async _build(data: Uint8Array) {
    const path = "/playground/build";

    const formData = new FormData();
    const filePath = uuidv4() + ".zip";
    formData.append(
      "contractFiles",
      new File([data], filePath, { type: "application/zip" }),
      filePath
    );

    const requestInit: RequestInit = {
      method: "POST",
      body: formData,
      redirect: "follow",
    };

    const response = await fetch(`${path}`, requestInit);
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message);
    }

    const blob = await response.blob();

    if (blob.size === 0) {
      throw new Error("No response from build server.");
    }

    const buffer = await blob.arrayBuffer();
    return Buffer.from(buffer).toString("hex");
  }
}
