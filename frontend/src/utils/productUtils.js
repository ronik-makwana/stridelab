export const formatPrice = (price) => `$${price.toFixed(2)}`;

export const getDiscountPercent = (product) => {
  if (!product.discountedPrice || !product.price || product.price <= 0) return null;

  return Math.round(
    ((product.price - product.discountedPrice) / product.price) * 100
  );
};

