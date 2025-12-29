// Import database configuration early to set up environment-specific database URLs
import { environment, databaseUrl, isProduction, isDevelopment, isTest } from "./config/database.js";

// Ensure Prisma client is generated at runtime (for Vercel serverless functions)
if (process.env.NODE_ENV === "production") {
  try {
    const { execSync } = await import("child_process");
    const { fileURLToPath } = await import("url");
    const { dirname, join } = await import("path");
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const projectRoot = join(__dirname, "../..");
    
    // Check if .prisma/client exists, if not generate it
    const { existsSync } = await import("fs");
    const prismaClientPath = join(projectRoot, "node_modules/.prisma/client");
    if (!existsSync(prismaClientPath)) {
      console.log("[entry.server] Prisma client not found, generating...");
      execSync("npx prisma generate --config prisma/config.js", {
        cwd: projectRoot,
        stdio: "inherit",
      });
    }
  } catch (error) {
    console.warn("[entry.server] Failed to ensure Prisma client generation:", error.message);
  }
}

import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";
import { addDocumentResponseHeaders } from "./shopify.server";
import { createReadableStreamFromReadable } from "@remix-run/node";

export const streamTimeout = 5000;

export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  remixContext,
) {
  addDocumentResponseHeaders(request, responseHeaders);

  const userAgent = request.headers.get("user-agent");
  const callbackName = isbot(userAgent ?? "") ? "onAllReady" : "onShellReady";

  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} />,
      {
        [callbackName]: () => {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          console.error(error);
        },
      },
    );

    // Automatically timeout the React renderer after 6 seconds, which ensures
    // React has enough time to flush down the rejected boundary contents
    setTimeout(abort, streamTimeout + 1000);
  });
}
