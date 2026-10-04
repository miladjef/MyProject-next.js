import AdminPanelLayout from "@/components/layouts/AdminPanelLayout";
import Manager from "@/components/templates/p-admin/articles/Manager";
import Pagination from "@/components/modules/pagination/Pagination";
import ArticleModel from "@/models/Article";
import { authAdmin } from "@/utils/serverHelpers";
import { redirect } from "next/navigation";

export default async function Page({ searchParams }) {
  const admin = await authAdmin();
  if (!admin) redirect("/login-register");
  const params = await searchParams;
  const page = Math.max(1, Number(params?.page) || 1);
  const limit = 30;
  const [articles, total] = await Promise.all([
    ArticleModel.find({}).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ArticleModel.countDocuments({}),
  ]);
  return (
    <AdminPanelLayout>
      <Manager articles={JSON.parse(JSON.stringify(articles))} />
      <Pagination page={page} pages={Math.max(1, Math.ceil(total / limit))} basePath="/p-admin/articles" />
    </AdminPanelLayout>
  );
}
