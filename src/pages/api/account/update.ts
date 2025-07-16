import type { NextApiRequest, NextApiResponse } from "next";
import { login, getSessionId } from "@/services/auth";
import * as process from "node:process";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Ensure sessionId exists by logging in if necessary
    if (!getSessionId()) {
      await login();
    }
    const sessionId = getSessionId();

    if (!sessionId) {
      return res.status(401).json({ error: "Session ID not available" });
    }

    // Extract the body from the request
    const accountData = req.body;

    const url = `${process.env.API_URL}`;

    // Send the request to the external API
    const response = await fetch(
      `${url}/ACCOUNT`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          sessionId,
        },
        body: JSON.stringify({
          brmObjects: accountData,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error updating account:", response.status, errorText);
      return res
        .status(response.status)
        .json({ error: "Failed to update account" });
    }

    const result = await response.json();
    console.log("Account updated successfully:", result);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Internal API /account/update error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}