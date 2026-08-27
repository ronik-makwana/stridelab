import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HiHeart, HiXMark, HiStar } from "react-icons/hi2";
import useWishlistStore from "../store/wishlistStore.js";
import useAuthStore from "../store/authStore.js";
import { getProducts } from "../services/productApi.js";
import { formatPrice, getDiscountPercent } from "../utils/productUtils.js";

const Wishlist = () => {
  const { wishlist, tempWishlist, removeFromWishlist, getAllWishlistIds } =
    useWishlistStore();
  const { user } = useAuthStore();
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch wishlist products
  useEffect(() => {
    const fetchWishlistProducts = async () => {
      const allIds = getAllWishlistIds();
      if (allIds.length === 0) {
        setWishlistProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getProducts();
        // Handle both array format and object format with products property
        const allProducts = Array.isArray(response.data)
          ? response.data
          : response.data?.products || [];
        const filtered = allProducts.filter((p) =>
          allIds.includes(p._id || p.slug)
        );
        setWishlistProducts(filtered);
      } catch (err) {
        console.error("Error fetching wishlist products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlist, tempWishlist]);

  const allIds = getAllWishlistIds();

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <HiStar key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
      );
    }
    if (hasHalfStar && fullStars < 5) {
      stars.push(
        <div key="half" className="relative h-4 w-4">
          <HiStar className="absolute h-4 w-4 fill-slate-200 text-slate-200" />
          <HiStar
            className="absolute h-4 w-4 fill-amber-400 text-amber-400"
            style={{ clipPath: "inset(0 50% 0 0)" }}
          />
        </div>
      );
    }
    for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
      stars.push(
        <HiStar key={i} className="h-4 w-4 fill-slate-200 text-slate-200" />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading wishlist...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white">
      <div className="mx-auto w-full px-4 py-12 sm:px-6 md:px-10 xl:px-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">My Wishlist</h1>
          <p className="mt-2 text-sm text-slate-600">
            {allIds.length === 0
              ? "Your wishlist is empty"
              : `${allIds.length} ${allIds.length === 1 ? "item" : "items"} in your wishlist`}
          </p>
        </div>

        {/* Wishlist Products */}
        {wishlistProducts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {wishlistProducts.map((product) => {
              const productId = product._id || product.slug;
              const productSlug = product.slug || product._id;
              const productImage =
                product.images && product.images.length > 0
                  ? product.images[0]
                  : "https://via.placeholder.com/400x400?text=No+Image";
              const discountPercent = getDiscountPercent(product);
              const rating = product.rating || 0;
              const reviewCount = product.reviewCount || 0;

              return (
                <article
                  key={productId}
                  className="group relative flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg"
                >
                  <div className="relative h-64 overflow-hidden bg-slate-100 sm:h-80">
                    <Link
                      to={`/products/${productSlug}`}
                      className="block h-full w-full"
                    >
                      <img
                        src={productImage}
                        alt={product.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    </Link>
                    {/* Discount Badge */}
                    {discountPercent && discountPercent > 0 && (
                      <span className="absolute left-3 top-3 z-20 inline-flex items-center justify-center rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-lg">
                        {discountPercent}% OFF
                      </span>
                    )}
                    {/* Remove from Wishlist Button */}
                    <button
                      onClick={() => removeFromWishlist(productId, user)}
                      className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur transition-colors hover:bg-white"
                      aria-label="Remove from wishlist"
                    >
                      <HiHeart className="h-5 w-5 fill-red-500 text-red-500" />
                    </button>
                  </div>
                  <Link
                    to={`/products/${productSlug}`}
                    className="flex flex-col flex-1"
                  >
                    <div className="space-y-3 p-4">
                      {/* Product Name */}
                      <h3 className="text-base font-semibold text-slate-900 line-clamp-2">
                        {product.title}
                      </h3>

                      {/* Rating */}
                      {rating > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {renderStars(rating)}
                          </div>
                          <span className="text-xs text-slate-600">
                            {rating > 0 ? rating.toFixed(1) : "0.0"} |{" "}
                            {reviewCount > 0
                              ? `${reviewCount} Review${reviewCount === 1 ? "" : "s"}`
                              : "No reviews"}
                          </span>
                        </div>
                      )}

                      {/* Pricing */}
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900">
                          {product.discountedPrice
                            ? formatPrice(product.discountedPrice)
                            : formatPrice(product.price)}
                        </span>
                        {product.discountedPrice && (
                          <>
                            <span className="text-sm text-slate-400 line-through">
                              {formatPrice(product.price)}
                            </span>
                            <span className="text-xs font-medium text-red-600">
                              Sale
                            </span>
                          </>
                        )}
                      </div>

                      {/* Size Options */}
                      {product.sizes && product.sizes.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          {product.sizes.slice(0, 4).map((size) => (
                            <span
                              key={size}
                              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
                            >
                              {size}
                            </span>
                          ))}
                          {product.sizes.length > 4 && (
                            <span className="text-xs text-slate-500">
                              +{product.sizes.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 py-16 text-center">
            <HiHeart className="mx-auto h-16 w-16 text-slate-300" />
            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              Your wishlist is empty
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Start adding products you love to your wishlist!
            </p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold !text-white transition-colors hover:bg-blue-700"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
