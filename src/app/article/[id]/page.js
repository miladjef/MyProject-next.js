import Navbar from "@/components/modules/navbar/Navbar";
import Footer from "@/components/modules/footer/Footer";
import { authUser } from "@/utils/serverHelpers";
import ArticleModel from "@/models/Article";
import connectToDB from "@/configs/db";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const { id } = await params;
  await connectToDB();
  const article = await ArticleModel.findOne({ slug: decodeURIComponent(id), status: "PUBLISHED" }).select("title excerpt").lean();
  return article ? { title: article.title, description: article.excerpt || article.title } : { title: "مقاله" };
}

export default async function Page({ params }) {
  const { id } = await params;
  const user = await authUser();
  await connectToDB();
  const article = await ArticleModel.findOne({ slug: decodeURIComponent(id), status: "PUBLISHED" }).lean();
  if (!article) notFound();
  return <><Navbar isLogin={Boolean(user)} /><article className="container" style={{ padding: "140px 20px 70px", direction: "rtl", lineHeight: 2 }}>{article.img && <img src={article.img} alt={article.title} style={{ maxWidth: "100%", marginBottom: 24 }} />}<h1>{article.title}</h1><p style={{ marginTop: 10 }}>{article.author}، {new Date(article.publishedAt || article.createdAt).toLocaleDateString("fa-IR")}</p><div style={{ marginTop: 24, whiteSpace: "pre-wrap" }}>{article.body}</div></article><Footer /></>;
}
