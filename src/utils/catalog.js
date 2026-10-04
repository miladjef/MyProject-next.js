import ProductModel from "@/models/Product";
import ProductCategoryModel from "@/models/ProductCategory";
import BrandModel from "@/models/Brand";
import { slugify } from "@/utils/slug.mjs";

const uniqueProductSlug = async (value, excludeId = null) => {
  const base = slugify(value) || "product";
  let slug = base;
  let suffix = 1;
  while (await ProductModel.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    suffix += 1;
    slug = `${base}-${suffix}`.slice(0, 190);
  }
  return slug;
};

const ensureTaxonomy = async (Model, value) => {
  const name = String(value || "").trim();
  if (!name) return null;
  const slug = slugify(name);
  if (!slug) return null;
  return Model.findOneAndUpdate(
    { slug },
    { $setOnInsert: { name, slug, isActive: true } },
    { upsert: true, new: true }
  );
};

const ensureCategory = (value) => ensureTaxonomy(ProductCategoryModel, value);
const ensureBrand = (value) => ensureTaxonomy(BrandModel, value);

export { uniqueProductSlug, ensureCategory, ensureBrand };
