import type { NextApiRequest, NextApiResponse } from "next";
import { login, getSessionId } from "@/services/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    await login();
    const sessionId = getSessionId();

    const response = await fetch(`${process.env.API_URL}/ACCOUNT_PRODUCT`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        sessionid: sessionId!,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    const productRecordId = data?.createResponse?.[0]?.Id;

    if (!productRecordId) {
      return res.status(400).json({ error: "Failed to create ACCOUNT_PRODUCT" });
    }

    const query = `
      SELECT bp.HostedPaymentPageExternalId
      FROM Billing_Profile bp
      WHERE bp.Id = ${productRecordId}
    `;

    const hostedResponse = await fetch(
      `${process.env.API_URL}/query?sql=${encodeURIComponent(query)}`,
      {
        headers: { sessionid: sessionId! },
      }
    );

    const result = await hostedResponse.json();
    const hostedId = result?.queryResponse?.[0]?.HostedPaymentPageExternalId;

    return res.status(200).json({ HostedPaymentPageExternalId: hostedId ?? null });
  } catch (error) {
    console.error("API /account-product error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
