export default function robots() {
  const base = (process.env.SITE_URL || "https://example.com").replace(/\/$/, "");
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/p-admin/", "/p-user/", "/checkout", "/cart"] },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
