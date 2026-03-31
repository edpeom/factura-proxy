import https from "https";

export default async function handler(req, res) {
  const target = req.query.url;

  if (!target) {
    return res.status(400).send("Missing url");
  }

  const agent = new https.Agent({
    rejectUnauthorized: false,
  });

  try {
    const response = await fetch(target, {
      agent,
    });

    if (!response.ok) {
      return res.status(response.status).send(`Upstream error: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader("Content-Type", response.headers.get("content-type") || "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="factura.pdf"');

    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(500).send(`Proxy error: ${error.message}`);
  }
}