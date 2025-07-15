import type { NextApiRequest, NextApiResponse } from "next";
import { getSessionId, login } from "@/services/auth";

export default async function handler( req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const products = await listProducts();
    return res.status(200).json(products);
  } catch (err: any) {
    console.error("API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function listProducts() {
  let sessionId = getSessionId();
  if (!sessionId) {
    await login();
    sessionId = getSessionId();
  }

  const sql = "SELECT Id, Name, Status, Rate FROM Product WHERE Id = '14197'";
  const url = `${process.env.API_URL}/query`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "bpKey": process.env.BP_KEY!,
    "client_id": process.env.CLIENT_ID!,
  };

  if (sessionId) {
    headers["sessionid"] = sessionId;
  }

  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ sql }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Upstream error: ${resp.status} ${resp.statusText} – ${text}`);
  }

  const { queryResponse } = (await resp.json()) as { queryResponse: any[] };
  return (queryResponse || []).map((row: any) => {
    const rawRate: string = row.Rate || "";
    const [firstRate] = rawRate.split(/<br\s*\/?>/i);
    const trimRate = firstRate.trim();
    const CurrencySign = trimRate.match(/^\D+/)?.[0] || "";
    const Amount = trimRate.match(/\d+(\.\d+)?/)?.[0] || "";

    return {
      ...row,
      Rate: trimRate,
      CurrencySign,
      Amount,
    };
  });
}
