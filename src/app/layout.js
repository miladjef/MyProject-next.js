import "./globals.css";
import AosInit from "@/utils/aos";

const siteName = process.env.SITE_NAME || "فروشگاه";
const siteUrl = process.env.SITE_URL || "https://example.com";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteName, template: `%s | ${siteName}` },
  description: `${siteName}، فروشگاه اینترنتی. Programmer: Milad Jafari Gavzan`,
  authors: [{ name: "Milad Jafari Gavzan" }],
  icons: { icon: "/images/logo.png" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: new URL("/images/logo.png", siteUrl).toString(),
    email: process.env.SITE_EMAIL || undefined,
    telephone: process.env.SITE_PHONE || undefined,
  };
  return (
    <html lang="fa" dir="rtl">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization).replace(/</g, "\\u003c") }} />
        <AosInit />
        {children}
      </body>
    </html>
  );
}
