import type { NextApiRequest, NextApiResponse } from "next";
import { login, getSessionId } from "@/services/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    if (!getSessionId()) {
      await login();
    }

    const sessionId = getSessionId()!;

    if (!sessionId) {
      return res.status(401).json({ error: "Session ID not available" });
    }

    const sql = `SELECT Id FROM Invoice_Template WHERE Name = 'Default Invoice Template'`;
    const url = `${process.env.API_URL}/query?sql=${encodeURIComponent(sql)}`;

    const response = await fetch(url, {
      headers: { sessionid: sessionId! },
    });

    const data = await response.json();
    const result = data?.queryResponse?.[0];

    return res.status(200).json(result ?? null);
  } catch (error) {
    console.error("API /account/invoice-template error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
