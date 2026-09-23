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

const ProductPage = async ({ params }) => {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  await connectToDB();
  const [user, product] = await Promise.all([
    authUser(),
    ProductModel.findById(id)
      .populate({ path: "comments", match: { isAccept: true } })
      .lean(),
  ]);

  if (!product) notFound();

  const related = await ProductModel.find({
    _id: { $ne: product._id },
    smell: product.smell,
  })
    .limit(8)
    .lean();

  return (
    <div className={styles.container}>
      <Navbar isLogin={Boolean(user)} />
      <div data-aos="fade-up" className={styles.contents}>
        <div className={styles.main}>
          <Details product={JSON.parse(JSON.stringify(product))} />
          <Gallery />
        </div>
        <Tabs product={JSON.parse(JSON.stringify(product))} />
        <MoreProducts relatedProducts={JSON.parse(JSON.stringify(related))} />
      </div>
      <Footer />
    </div>
  );
};

export default ProductPage;
