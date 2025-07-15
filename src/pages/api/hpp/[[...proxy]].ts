import type { NextApiRequest, NextApiResponse } from 'next';
import { getHppSecurityToken } from '@/services/auth'; // Assuming this path is correct

import { Logger } from '@/utils/logger';

/**
 * Optional catch-all proxy for Hosted Payments UI endpoints.
 * Handles both `/api/hpp` and `/api/hpp/*`, forwarding
 * requests to the real HPP server with authentication and CORS.
 *
 * IMPORTANT: Ensure NEXT_PUBLIC_HPP_URL in your .env file is set to the *full base path*
 * of the HPP API, including the /api segment if required by the HPP server.
 * Example: NEXT_PUBLIC_HPP_URL=https://my.billingplatform.com/analyst_demo/hostedPayments/1.0/api
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) CORS preflight handling
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Consider restricting this in production
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    // Ensure all headers your frontend might send in the actual request are listed here
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,sessionid,environmentid');
    return res.status(204).end();
  }

  // 2) Obtain HPP security token (which acts as the sessionid for HPP)
  const token = await getHppSecurityToken();
  if (!token) {
    Logger.warn('HPP proxy: Missing HPP security token (expected for sessionid header).');
    res.setHeader('Access-Control-Allow-Origin', '*'); // Also for error responses
    return res.status(401).json({ error: 'Authentication required: Missing HPP security token.' });
  }

  // 3) Determine the sub-path requested after /api/hpp/
  // e.g., for /api/hpp/paymentMethods, proxySegments = ['paymentMethods'], subPath = "paymentMethods"
  // e.g., for /api/hpp/foo/bar, proxySegments = ['foo', 'bar'], subPath = "foo/bar"
  // e.g., for /api/hpp (no further path), proxySegments = [], subPath = ""
  const proxySegments = Array.isArray(req.query.proxy) ? req.query.proxy : [];
  const subPath = proxySegments.join('/');

  // Reconstruct query string from the original request URL
  const queryString = req.url?.split('?')[1] || '';

  // 4) Get the HPP base API URL from environment variables
  // CRITICAL: This should be the full base path,
  // e.g., https://my.billingplatform.com/analyst_demo/hostedPayments/1.0/api
  const hppBaseUrl = (process.env.NEXT_PUBLIC_HPP_URL || '').replace(/\/+$/, ''); // Remove any trailing slashes
  if (!hppBaseUrl) {
    Logger.error('HPP proxy: NEXT_PUBLIC_HPP_URL is not configured.');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'Proxy configuration error: NEXT_PUBLIC_HPP_URL is missing.' });
  }

  // 5) Construct the target upstream URL
  // If subPath is empty (request was to /api/hpp), target is hppBaseUrl.
  // If subPath is "paymentMethods", target is hppBaseUrl/paymentMethods.
  // No extra slash if subPath is empty, one slash if subPath is present.
  const upstreamUrl = `${hppBaseUrl}${subPath ? `/${subPath}` : ''}${queryString ? `?${queryString}` : ''}`;

  Logger.info(`HPP proxy: Forwarding ${req.method} request to: ${upstreamUrl}`);

  // 6) Determine environmentid:
  // Prefer 'environmentid' header from incoming request (like cURL).
  // Fallback to NEXT_PUBLIC_BP_ENV_ID for requests from HPP SDK (which configures it but might not send as header through proxy).
  const environmentIdFromHeader = req.headers['environmentid'] as string;
  const environmentIdFromEnv = process.env.NEXT_PUBLIC_BP_ENV_ID;
  const environmentId = environmentIdFromHeader || environmentIdFromEnv;

  if (!environmentId) {
    Logger.error('HPP proxy: environmentId is missing. It was not found in request headers (environmentid) or .env (NEXT_PUBLIC_BP_ENV_ID).');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(400).json({ error: 'Configuration error: environmentId is missing.' });
  }

  // 7) Forward the request to HPP
  try {
    const requestHeaders: HeadersInit = {
      // Forward Content-Type from original request for POST/PUT/PATCH, otherwise HPP might not understand the body
      ...( (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') && req.headers['content-type']
          ? { 'Content-Type': req.headers['content-type'] }
          : (req.method !== 'GET' && req.method !== 'HEAD' ? { 'Content-Type': 'application/json' } : {}) // Default for POST etc. if not present
      ),
      'sessionid': token, // HPP expects this as the security token
      'environmentid': environmentId, // Crucial for HPP
    };

    const upstreamRes = await fetch(upstreamUrl, {
      method: req.method,
      headers: requestHeaders,
      // Only include body for relevant methods.
      // req.body is already parsed by Next.js for JSON, so stringify it. For other types, handle accordingly.
      body: (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') ?
        (typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
        : undefined,
    });

    // 8) Mirror status code from HPP response
    res.status(upstreamRes.status);

    // 9) Set CORS headers for the response to the client
    res.setHeader('Access-Control-Allow-Origin', '*'); // Consider restricting this in production
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // 10) Mirror relevant headers from HPP response back to client (e.g., Content-Type)
    upstreamRes.headers.forEach((value, name) => {
      const lowerName = name.toLowerCase();
      if (lowerName === 'content-type' || lowerName === 'content-disposition') {
        res.setHeader(name, value);
      }
    });

    // 11) Relay response body back to client
    const responseBodyText = await upstreamRes.text();

    if (upstreamRes.ok) {
      Logger.info(`HPP proxy: Response OK (${upstreamRes.status}) from ${upstreamUrl}`);
    } else {
      Logger.error(`HPP proxy: Response ERROR (${upstreamRes.status}) from ${upstreamUrl}. Body: ${responseBodyText}`);
    }

    // If the upstream response indicates JSON, parse and send as JSON. Otherwise, send as text.
    if (upstreamRes.headers.get('content-type')?.includes('application/json')) {
      try {
        res.json(JSON.parse(responseBodyText));
      } catch (e) {
        Logger.warn(`HPP proxy: Failed to parse HPP JSON response from ${upstreamUrl}, sending as text. Error: ${(e as Error).message}`);
        res.send(responseBodyText); // Send as text if parsing failed
      }
    } else {
      res.send(responseBodyText); // Send as text for non-JSON responses
    }

  } catch (error) {
    const err = error as Error;
    Logger.error(`HPP proxy: Exception during fetch to ${upstreamUrl}. Error: ${err.message}`, err);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(502).json({ error: 'Bad Gateway', details: `Failed to connect to upstream HPP server: ${err.message}` });
  }
}
