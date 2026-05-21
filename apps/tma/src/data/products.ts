export type ProductImageSet = {
  main: string;
  gallery: string[];
  info: string;
};

export type ProductItem = {
  id: string;
  slug: string;
  nameKey: string;
  descriptionKey: string;
  benefits: string[];
  isSet: boolean;
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
    id: "bb-cream",
    slug: "bb-cream",
    nameKey: "products.bbCream.name",
    descriptionKey: "products.bbCream.description",
    benefits: [
      "products.bbCream.benefits.one",
      "products.bbCream.benefits.two",
      "products.bbCream.benefits.three",
    ],
    isSet: false,
    images: createProductImages("bb-cream"),
  },
  {
    id: "salmon-cream",
    slug: "salmon-cream",
    nameKey: "products.salmonCream.name",
    descriptionKey: "products.salmonCream.description",
    benefits: [
      "products.salmonCream.benefits.one",
      "products.salmonCream.benefits.two",
      "products.salmonCream.benefits.three",
    ],
    isSet: false,
    images: createProductImages("salmon-cream"),
  },
  {
    id: "multi-balm",
    slug: "multi-balm",
    nameKey: "products.multiBalm.name",
    descriptionKey: "products.multiBalm.description",
    benefits: [
      "products.multiBalm.benefits.one",
      "products.multiBalm.benefits.two",
      "products.multiBalm.benefits.three",
    ],
    isSet: false,
    images: createProductImages("multi-balm"),
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
    isSet: false,
    images: createProductImages("sleeping-mask"),
  },
  {
    id: "set",
    slug: "set",
    nameKey: "products.set.name",
    descriptionKey: "products.set.description",
    benefits: [
      "products.set.benefits.one",
      "products.set.benefits.two",
      "products.set.benefits.three",
    ],
    isSet: true,
    images: createProductImages("set", {
      includeImage2: true,
      infoType: "2",
    }),
  },
];

export const productMap = new Map(products.map((product) => [product.id, product]));
