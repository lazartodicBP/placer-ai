let sessionId: string | null = null;
let hppToken: string | null = null;

export const getSessionId = (): string | null => {
  if (sessionId) return sessionId;
  if (typeof window !== "undefined") {
    sessionId = localStorage.getItem("sessionId");
  }
  return sessionId;
};

export const setSessionId = (id: string) => {
  sessionId = id;
  if (typeof window !== "undefined") {
    localStorage.setItem("sessionId", id);
  }
};

export const login = async (): Promise<void> => {
  try {
    const response = await fetch(`${process.env.API_URL}/login`, {
      method: "POST",
      body: JSON.stringify({
        username: process.env.USER_LOGIN,
        password: process.env.USER_PASS,
      }),
    });

    const data = await response.json();

    if (data?.loginResponse?.[0]?.SessionID) {
      setSessionId(data.loginResponse[0].SessionID);
    }
  } catch (e) {
    console.error("Login failed:", e);
  }
};

export const fetchWithSession = async (url: string, options: any = {}): Promise<Response> => {
  const initialSessionId = getSessionId();

  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      sessionid: initialSessionId,
    },
  });

  if (response.status === 500) {
    try {
      const body = await response.clone().json();
      if (body?.errors?.[0]?.error_code === "INVALID_SESSION_ID") {
        await login();
        const newSessionId = getSessionId();
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            sessionid: newSessionId,
          },
        });
      }
    } catch (e) {
      console.error("Login failed:", e);
    }
  }

  return response;
};

export const getHppSecurityToken = async (): Promise<string | null> => {
  if (hppToken) {
    console.log("Returning cached HPP token");
    return hppToken;
  }

  let sessionId = getSessionId();

  if (!sessionId) {
    console.log("No sessionId found, calling login()");
    await login();
    sessionId = getSessionId();

    if (!sessionId) {
      console.error("Failed to obtain sessionId after login");
      return null;
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_HPP_URL;
  if (!baseUrl) {
    console.error("NEXT_PUBLIC_HPP_URL is not defined");
    return null;
  }

  const requestUrl = `${baseUrl}/authenticate-session`;

  // Debug block, needed in case of future changes of API call
  console.log("📤 Sending HPP token request:");
  console.log("🔸 URL:", requestUrl);
  console.log("🔸 sessionid (header):", sessionId);
  console.log("🔸 Body:", JSON.stringify({ sessionId }));

  try {
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        sessionid: sessionId, // Needs to be lowercase, api parameter, it's not a typo
      },
      body: JSON.stringify({ sessionId }),
    });

    const raw = await response.text();

    if (!response.ok) {
      console.error("HPP token fetch failed: ", response.status, raw);
      return null;
    }

    const data = JSON.parse(raw);
    hppToken = data?.accessToken?.content ?? null;
    console.log("✅ HPP token stored in memory: ", hppToken);

    return hppToken;
  } catch (e) {
    console.error("Error during HPP token fetch: ", e);
    return null;
  }
};
