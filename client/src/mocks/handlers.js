// src/mocks/handlers.js
import { http, HttpResponse } from "msw";

export const handlers = [
  http.post("/api/build", async ({ request }) => {
    return HttpResponse.json({
      /** Build output */
      stderr: "Build completed.",
      /** UUID of the program */
      uuid: "056898f7-ada8-48b8-b379-e6faccf1669d",
      /** Anchor IDL */
      idl: null,
    });
  }),
];
