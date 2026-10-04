import Link from "next/link";

export default function Pagination({ page = 1, pages = 1, basePath, query = {} }) {
  if (pages <= 1) return null;
  const hrefFor = (targetPage) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query || {})) {
      if (value !== undefined && value !== null && String(value) !== "") params.set(key, String(value));
    }
    params.set("page", String(targetPage));
    return `${basePath}?${params.toString()}`;
  };
  return (
    <nav style={{ display: "flex", gap: 12, justifyContent: "center", margin: "28px 0", direction: "rtl" }} aria-label="صفحه بندی">
      {page > 1 && <Link href={hrefFor(page - 1)}>صفحه قبل</Link>}
      <span>صفحه {page} از {pages}</span>
      {page < pages && <Link href={hrefFor(page + 1)}>صفحه بعد</Link>}
    </nav>
  );
}
