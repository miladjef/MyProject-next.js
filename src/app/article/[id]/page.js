import Navbar from "@/components/modules/navbar/Navbar";
import Footer from "@/components/modules/footer/Footer";
import { authUser } from "@/utils/serverHelpers";
import ArticleModel from "@/models/Article";
import connectToDB from "@/configs/db";
import { notFound } from "next/navigation";
import { safeDecodeURIComponent } from "@/utils/url";

export async function generateMetadata({ params }) {
  const { id } = await params;
  await connectToDB();
  const article = await ArticleModel.findOne({ slug: safeDecodeURIComponent(id), status: "PUBLISHED" }).select("title slug excerpt img").lean();
  if (!article) return { title: "مقاله" };
  const siteUrl = (process.env.SITE_URL || "https://example.com").replace(/\/$/, "");
  const canonical = `${siteUrl}/article/${encodeURIComponent(article.slug)}`;
  return {
    title: article.title,
    description: article.excerpt || article.title,
    alternates: { canonical },
    openGraph: { title: article.title, description: article.excerpt || article.title, url: canonical, type: "article", images: article.img ? [{ url: article.img, alt: article.title }] : [] },
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const user = await authUser();
  await connectToDB();
  const article = await ArticleModel.findOne({ slug: safeDecodeURIComponent(id), status: "PUBLISHED" }).lean();
  if (!article) notFound();
  const siteUrl = (process.env.SITE_URL || "https://example.com").replace(/\/$/, "");
  const structuredData = {
    "@context": "https://schema.org", "@type": "Article", headline: article.title, description: article.excerpt || article.title,
    image: article.img ? [article.img] : undefined, author: { "@type": "Person", name: article.author },
    datePublished: article.publishedAt || article.createdAt, dateModified: article.updatedAt, mainEntityOfPage: `${siteUrl}/article/${encodeURIComponent(article.slug)}`,
  };
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><Navbar isLogin={Boolean(user)} /><article className="container" style={{ padding: "140px 20px 70px", direction: "rtl", lineHeight: 2 }}>{article.img && <img src={article.img} alt={article.title} style={{ maxWidth: "100%", marginBottom: 24 }} />}<h1>{article.title}</h1><p style={{ marginTop: 10 }}>{article.author}، {new Date(article.publishedAt || article.createdAt).toLocaleDateString("fa-IR")}</p><div style={{ marginTop: 24, whiteSpace: "pre-wrap" }}>{article.body}</div></article><Footer /></>;
}
