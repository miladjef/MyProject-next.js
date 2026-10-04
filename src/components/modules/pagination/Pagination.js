import Link from "next/link";

export default function Pagination({ page = 1, pages = 1, basePath }) {
  if (pages <= 1) return null;
  return (
    <nav style={{ display: "flex", gap: 12, justifyContent: "center", margin: "28px 0", direction: "rtl" }} aria-label="صفحه بندی">
      {page > 1 && <Link href={`${basePath}?page=${page - 1}`}>صفحه قبل</Link>}
      <span>صفحه {page} از {pages}</span>
      {page < pages && <Link href={`${basePath}?page=${page + 1}`}>صفحه بعد</Link>}
    </nav>
  );
}
