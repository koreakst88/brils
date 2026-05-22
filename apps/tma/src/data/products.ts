export type ProductImageSet = {
  main: string;
  gallery: string[];
  info: string;
};

export type ProductPrice = {
  currency: "USD";
  min: number;
  max: number;
};

export type ProductItem = {
  id: string;
  slug: string;
  nameKey: string;
  descriptionKey: string;
  benefits: string[];
  price: ProductPrice;
  images: ProductImageSet;
};

function createImagePath(slug: string, type: string) {
  return `/images/products/${slug}/${slug}-${type}.jpg`;
}

type CreateProductImagesOptions = {
  includeImage2?: boolean;
  infoType?: string;
};

function createProductImages(
  slug: string,
  options: CreateProductImagesOptions = {},
): ProductImageSet {
  const { includeImage2 = false, infoType = "info" } = options;
  const main = createImagePath(slug, "main");
  const image1 = createImagePath(slug, "1");
  const image2 = createImagePath(slug, "2");
  const info = createImagePath(slug, infoType);
  const gallery = [main, image1];

  if (includeImage2 && image2 !== info) {
    gallery.push(image2);
  }

  gallery.push(info);

  return {
    main,
    gallery,
    info,
  };
}

export const products: ProductItem[] = [
  {
    id: "bean-essence",
    slug: "bean-essence",
    nameKey: "products.beanEssence.name",
    descriptionKey: "products.beanEssence.description",
    benefits: [
      "products.beanEssence.benefits.one",
      "products.beanEssence.benefits.two",
      "products.beanEssence.benefits.three",
    ],
    price: {
      currency: "USD",
      min: 18,
      max: 24,
    },
    images: createProductImages("bean-essence"),
  },
  {
    id: "bb-cream",
    slug: "bb-cream",
    nameKey: "products.bbCream.name",
    descriptionKey: "products.bbCream.description",
    benefits: [
      "products.bbCream.benefits.one",
      "products.bbCream.benefits.two",
      "products.bbCream.benefits.three",
    ],
    price: {
      currency: "USD",
      min: 12,
      max: 18,
    },
    images: createProductImages("bb-cream"),
  },
  {
    id: "cushion",
    slug: "cushion",
    nameKey: "products.cushion.name",
    descriptionKey: "products.cushion.description",
    benefits: [
      "products.cushion.benefits.one",
      "products.cushion.benefits.two",
      "products.cushion.benefits.three",
    ],
    price: {
      currency: "USD",
      min: 16,
      max: 23,
    },
    images: createProductImages("cushion"),
  },
  {
    id: "sleeping-mask",
    slug: "sleeping-mask",
    nameKey: "products.sleepingMask.name",
    descriptionKey: "products.sleepingMask.description",
    benefits: [
      "products.sleepingMask.benefits.one",
      "products.sleepingMask.benefits.two",
      "products.sleepingMask.benefits.three",
    ],
    price: {
      currency: "USD",
      min: 15,
      max: 22,
    },
    images: createProductImages("sleeping-mask"),
  },
];

export const productMap = new Map(products.map((product) => [product.id, product]));
