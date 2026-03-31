import https from "https";
import { URL } from "url";

export default async function handler(req, res) {
  const target = req.query.url;

  if (!target) {
    return res.status(400).send("Missing url");
  }

  try {
    const fileBuffer = await downloadFile(target);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="factura.pdf"');
    return res.status(200).send(fileBuffer);
  } catch (error) {
    return res.status(500).send(`Proxy error: ${error.message}`);
  }
}

function downloadFile(targetUrl) {
  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: `${url.pathname}${url.search}`,
      method: "GET",
      rejectUnauthorized: false,
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/pdf,application/octet-stream,*/*",
      },
    };

    const request = https.request(options, (response) => {
      if (
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        return resolve(downloadFile(response.headers.location));
      }

      if (response.statusCode !== 200) {
        return reject(
          new Error(`Upstream error: ${response.statusCode}`)
        );
      }

      const chunks = [];

      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve(Buffer.concat(chunks)));
    });

    request.on("error", (error) => reject(error));
    request.end();
  });
}