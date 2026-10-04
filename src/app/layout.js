import "./globals.css";
import AosInit from "@/utils/aos";

const siteName = process.env.SITE_NAME || "فروشگاه";
const siteUrl = process.env.SITE_URL || "https://example.com";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: `${siteName}، فروشگاه اینترنتی. Programmer: Milad Jafari Gavzan`,
  authors: [{ name: "Milad Jafari Gavzan" }],
  icons: { icon: "/images/logo.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <AosInit />
        {children}
      </body>
    </html>
  );
}
