import type { NextApiRequest, NextApiResponse } from 'next';
import {getSessionId, login} from '@/services/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
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

    console.log("Body parameters sent:", req.body);

    const billingProfileResponse = await fetch(`${process.env.API_URL}/BILLING_PROFILE`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        sessionid: sessionId!,
      },
      body: JSON.stringify(req.body),
    });

    const result = await billingProfileResponse.json();
    return res.status(200).json(result);
  } catch (error) {
    console.error('Billing profile API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}