import type { NextApiRequest, NextApiResponse } from "next";
import { login, getSessionId } from "@/services/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { name } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'name'" });
  }

  try {
    let sessionId = getSessionId();
    if (!sessionId) {
      await login();
      sessionId = getSessionId();
    }
    if (!sessionId) {
      return res.status(401).json({ error: "Session ID not available" });
    }

    const query = `
        SELECT a.Id, 
        bp.HostedPaymentPageExternalId, 
        bp.CurrencyCode FROM Account a 
            LEFT JOIN Billing_Profile bp 
                ON bp.AccountId = a.Id 
                        WHERE a.Name = '${name}'`;

    const url = `${process.env.API_URL}/query`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "bpKey": process.env.BP_KEY!,
      "client_id": process.env.CLIENT_ID!,
      "sessionid": sessionId,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ sql: query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("BillingPlatform error (by-name):", response.status, errorText);
      return res.status(response.status).json({ error: "Upstream error" });
    }

    const payload = (await response.json()) as { queryResponse?: any[] };
    const firstRecord = payload.queryResponse?.[0] ?? null;
    return res.status(200).json(firstRecord);
  } catch (error) {
    console.error("API /account/by-name error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
