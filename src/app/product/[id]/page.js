import { isValidObjectId } from "mongoose";
import { notFound } from "next/navigation";
import styles from "@/styles/product.module.css";
import Gallery from "@/components/templates/product/Gallery";
import Details from "@/components/templates/product/Details";
import Tabs from "@/components/templates/product/Tabs";
import MoreProducts from "@/components/templates/product/MoreProducts";
import Footer from "@/components/modules/footer/Footer";
import Navbar from "@/components/modules/navbar/Navbar";
import { authUser } from "@/utils/serverHelpers";
import ProductModel from "@/models/Product";
import connectToDB from "@/configs/db";
import { activeProductFilter } from "@/utils/productFilters";
import { safeDecodeURIComponent } from "@/utils/url";

const lookup = (id) => isValidObjectId(id) ? { _id: id } : { slug: safeDecodeURIComponent(id) };

export async function generateMetadata({ params }) {
  const { id } = await params;
  await connectToDB();
  const product = await ProductModel.findOne({ ...lookup(id), ...activeProductFilter })
    .select("name slug shortDescription img price stock inventoryTracked")
    .lean();
  if (!product) return { title: "محصول" };
  const siteUrl = process.env.SITE_URL || "https://example.com";
  const canonical = `${siteUrl.replace(/\/$/, "")}/product/${encodeURIComponent(product.slug || String(product._id))}`;
  return {
    title: product.name,
    description: product.shortDescription,
    alternates: { canonical },
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      url: canonical,
      type: "website",
      images: product.img ? [{ url: product.img, alt: product.name }] : [],
    },
  };
}

const ProductPage = async ({ params }) => {
  const { id } = await params;
  await connectToDB();
  const [user, product] = await Promise.all([
    authUser(),
    ProductModel.findOne({ ...lookup(id), ...activeProductFilter })
      .populate({ path: "comments", match: { isAccept: true }, select: "username body score date adminReply isAccept createdAt" })
      .populate("category", "name slug")
      .populate("brand", "name slug")
      .lean(),
  ]);
  if (!product) notFound();

  const relatedFilter = {
    _id: { $ne: product._id },
    ...activeProductFilter,
    ...(product.category?._id ? { category: product.category._id } : { smell: product.smell }),
  };
  const related = await ProductModel.find(relatedFilter).limit(8).lean();
  const plainProduct = JSON.parse(JSON.stringify(product));
  const siteUrl = (process.env.SITE_URL || "https://example.com").replace(/\/$/, "");
  const productUrl = `${siteUrl}/product/${encodeURIComponent(product.slug || String(product._id))}`;
  const priceCurrency = process.env.PRICE_CURRENCY || "IRR";
  const currencyMultiplier = Math.max(1, Number(process.env.PRICE_CURRENCY_MULTIPLIER || 10));
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [product.img, ...(product.gallery || []).map((entry) => entry.url)].filter(Boolean),
    description: product.shortDescription,
    sku: product.sku || undefined,
    brand: product.brand?.name ? { "@type": "Brand", name: product.brand.name } : undefined,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency,
      price: Number(product.price) * currencyMultiplier,
      availability: !product.inventoryTracked || Number(product.stock || 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className={styles.container}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <Navbar isLogin={Boolean(user)} />
      <div data-aos="fade-up" className={styles.contents}>
        <div className={styles.main}>
          <Details product={plainProduct} />
          <Gallery product={plainProduct} />
        </div>
        <Tabs product={plainProduct} />
        <MoreProducts relatedProducts={JSON.parse(JSON.stringify(related))} />
      </div>
      <Footer />
    </div>
  );
};
export default ProductPage;
