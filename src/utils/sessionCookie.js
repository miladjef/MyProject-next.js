const isProduction = process.env.NODE_ENV === "production";

const getSessionCookieName = () => (isProduction ? "__Host-session" : "session");

const serializeSessionCookie = (token, maxAge = 7200) => {
  const parts = [
    `${getSessionCookieName()}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${Math.max(0, Number(maxAge) || 0)}`,
  ];
  if (isProduction) parts.push("Secure");
  return parts.join("; ");
};

const clearSessionCookie = () => {
  const parts = [
    `${getSessionCookieName()}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    "Max-Age=0",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
  ];
  if (isProduction) parts.push("Secure");
  return parts.join("; ");
};

export { getSessionCookieName, serializeSessionCookie, clearSessionCookie };
