import type { NextApiRequest, NextApiResponse } from "next";
import { login, getSessionId } from "@/services/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { name } = req.body;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Missing or invalid 'Role name'" });
  }

  try {

    if (!getSessionId()) {
      await login();
    }

    const sessionId = getSessionId()!;

    if (!sessionId) {
      return res.status(401).json({ error: "Session ID not available" });
    }

    const query = `
      SELECT r.Id
      FROM Role r
      WHERE r.Name = '${name}'
    `;

    const requestURL = `${process.env.API_URL}/query?sql=${query}`;
    console.log("Sending request to:", requestURL);
    console.log("SessionID:", sessionId);

    const response = await fetch(requestURL, {
      method: "GET",
      headers: {
        sessionid: sessionId,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("BillingPlatform error:", response.status, errorText);
      return res.status(response.status).json({ error: "Upstream error" });
    }

    const data = await response.json();
    return res.status(200).json(data?.queryResponse?.[0] ?? null);
  } catch (error) {
    console.error("API /account/role error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
