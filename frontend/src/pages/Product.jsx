import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HiHeart,
  HiStar,
  HiChevronLeft,
  HiChevronRight,
  HiCheck,
} from "react-icons/hi2";
import {
  getProduct,
  getProducts,
  getReviews,
  addReview,
} from "../services/productApi.js";
import { formatPrice, getDiscountPercent } from "../utils/productUtils.js";
import { getColorHex } from "../utils/colorUtils.js";
import useAuth from "../hooks/useAuth.js";
import useWishlistStore from "../store/wishlistStore.js";
import useAuthStore from "../store/authStore.js";
import useCartStore from "../store/cartStore.js";

const Product = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewSort, setReviewSort] = useState("recent");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoveredRating, setReviewHoveredRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const { user } = useAuth();
  const { user: authUser } = useAuthStore();
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const { addToCart } = useCartStore();
  const writeReviewRef = useRef(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getProduct(slug);
        setProduct(response.data);

        // Set default selections
        if (response.data.sizes && response.data.sizes.length > 0) {
          setSelectedSize(response.data.sizes[0]);
        }
        if (response.data.colors && response.data.colors.length > 0) {
          setSelectedColor(response.data.colors[0]);
        }
      } catch (err) {
        setError(err.message || "Failed to load product");
        toast.error(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  // Fetch reviews
  useEffect(() => {
    const fetchProductReviews = async () => {
      if (!product) return;

      try {
        setLoadingReviews(true);
        const response = await getReviews(product._id, reviewSort);
        setReviews(response.data.reviews);
        setReviewStats({
          averageRating: response.data.averageRating,
          totalReviews: response.data.totalReviews,
          ratingDistribution: response.data.ratingDistribution,
        });
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoadingReviews(false);
      }
    };

    if (product) {
      fetchProductReviews();
    }
  }, [product, reviewSort]);

  // Fetch related products
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!product) return;

      try {
        setLoadingRelated(true);
        const response = await getProducts();
        // Handle both array format and object format with products property
        const allProducts = Array.isArray(response.data)
          ? response.data
          : response.data?.products || [];

        // Filter related products
        const related = allProducts
          .filter((p) => {
            // Exclude current product
            if (p._id === product._id || p.slug === product.slug) {
              return false;
            }

            // Match by collection (if product has collections)
            if (product.collections && product.collections.length > 0) {
              const productCollectionIds = product.collections.map((c) =>
                typeof c === "object" ? c._id : c
              );
              const hasMatchingCollection =
                p.collections &&
                p.collections.some((c) => {
                  const collectionId = typeof c === "object" ? c._id : c;
                  return productCollectionIds.includes(collectionId);
                });
              if (hasMatchingCollection) return true;
            }

            // Match by category
            if (product.category && p.category === product.category) {
              return true;
            }

            // Match by brand (if both have brands)
            if (product.brand && p.brand && p.brand === product.brand) {
              return true;
            }

            return false;
          })
          .slice(0, 8); // Limit to 8 products

        setRelatedProducts(related);
      } catch (err) {
        console.error("Error fetching related products:", err);
      } finally {
        setLoadingRelated(false);
      }
    };

    if (product) {
      fetchRelatedProducts();
    }
  }, [product]);

  const handlePreviousImage = () => {
    if (product?.images && product.images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = () => {
    if (product?.images && product.images.length > 0) {
      setSelectedImageIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      toast.error("Please select a size");
      return;
    }
    if (!selectedColor && product.colors && product.colors.length > 0) {
      toast.error("Please select a color");
      return;
    }

    const productId = product._id || product.slug;
    await addToCart(
      productId,
      quantity,
      selectedSize || null,
      selectedColor || null,
      authUser,
      product // Pass the full product object so cart has title, image, etc.
    );
  };

  const handleToggleWishlist = async () => {
    if (product) {
      const productId = product._id || product.slug;
      await toggleWishlist(productId, authUser);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <HiStar key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
      );
    }
    if (hasHalfStar && fullStars < 5) {
      stars.push(
        <div key="half" className="relative h-5 w-5">
          <HiStar className="absolute h-5 w-5 fill-slate-200 text-slate-200" />
          <HiStar
            className="absolute h-5 w-5 fill-amber-400 text-amber-400"
            style={{ clipPath: "inset(0 50% 0 0)" }}
          />
        </div>
      );
    }
    for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
      stars.push(
        <HiStar key={i} className="h-5 w-5 fill-slate-200 text-slate-200" />
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
            Loading product...
          </p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 py-24 text-center sm:px-10 xl:px-16">
        <h1 className="text-2xl font-semibold text-slate-900">
          Product not found
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          {error || "The product you're looking for doesn't exist."}
        </p>
        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="inline-block rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-600 transition-colors hover:border-blue-500 hover:text-blue-600"
          >
            Go Back
          </button>
          <Link
            to="/"
            className="inline-block rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-600 transition-colors hover:border-blue-500 hover:text-blue-600"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const discountPercent = product.discountedPrice
    ? Math.round(
        ((product.price - product.discountedPrice) / product.price) * 100
      )
    : null;
  const rating = reviewStats.averageRating || product.rating || 0;
  const reviewCount = reviewStats.totalReviews || product.reviewCount || 0;

  const handleReviewAdded = () => {
    // Refresh reviews after adding
    const fetchProductReviews = async () => {
      try {
        const response = await getReviews(product._id, reviewSort);
        setReviews(response.data.reviews);
        setReviewStats({
          averageRating: response.data.averageRating,
          totalReviews: response.data.totalReviews,
          ratingDistribution: response.data.ratingDistribution,
        });
        // Also refresh product to get updated rating
        const productResponse = await getProduct(slug);
        setProduct(productResponse.data);
      } catch (err) {
        console.error("Error refreshing reviews:", err);
      }
    };
    fetchProductReviews();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };
  const productImages =
    product.images && product.images.length > 0
      ? product.images
      : ["https://via.placeholder.com/800x800?text=No+Image"];

  return (
    <div className="w-full bg-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-10 xl:px-16">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
        >
          <HiChevronLeft className="h-5 w-5" />
          Back
        </button>

        {/* Main Product Content */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Side - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <img
                src={productImages[selectedImageIndex]}
                alt={product.title}
                className="h-full w-full object-cover"
              />
              {/* Image Navigation Arrows */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur transition-all hover:bg-white"
                    aria-label="Previous image"
                  >
                    <HiChevronLeft className="h-5 w-5 text-slate-900" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur transition-all hover:bg-white"
                    aria-label="Next image"
                  >
                    <HiChevronRight className="h-5 w-5 text-slate-900" />
                  </button>
                </>
              )}
              {/* Discount Badge */}
              {discountPercent && (
                <span className="absolute left-4 top-4 inline-flex items-center justify-center rounded bg-red-600 px-3 py-1.5 text-sm font-semibold text-white">
                  {discountPercent}% off
                </span>
              )}
              {/* Wishlist Button */}
              {product && (
                <button
                  onClick={handleToggleWishlist}
                  className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur transition-colors hover:bg-white"
                  aria-label="Add to wishlist"
                >
                  <HiHeart
                    className={`h-6 w-6 ${
                      isInWishlist(product._id || product.slug)
                        ? "fill-red-500 text-red-500"
                        : "text-slate-600"
                    }`}
                  />
                </button>
              )}
            </div>

            {/* Thumbnail Images */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                      selectedImageIndex === index
                        ? "border-blue-600 ring-2 ring-blue-200"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} view ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Product Info */}
          <div className="flex flex-col space-y-6">
            {/* Title and Brand */}
            <div>
              {product.brand && (
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 mb-2">
                  {product.brand}
                </p>
              )}
              <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                {product.title}
              </h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-0.5">
                {renderStars(rating)}
              </div>
              <span className="text-sm text-slate-600">
                {rating} ({reviewCount} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-slate-900">
                {product.discountedPrice
                  ? formatPrice(product.discountedPrice)
                  : formatPrice(product.price)}
              </span>
              {product.discountedPrice && (
                <>
                  <span className="text-xl text-slate-400 line-through">
                    {formatPrice(product.price)}
                  </span>
                  <span className="rounded bg-red-100 px-2 py-1 text-sm font-semibold text-red-600">
                    Sale
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <h2 className="mb-2 text-lg font-semibold text-slate-900">
                  Description
                </h2>
                <p className="text-sm leading-relaxed text-slate-600">
                  {product.description}
                </p>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Size <span className="text-red-600">*</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all ${
                        selectedSize === size
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-900">
                  Color <span className="text-red-600">*</span>
                </h3>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => {
                    const isSelected = selectedColor === color;
                    const colorHex = getColorHex(color);

                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className="group relative flex flex-col items-center gap-2"
                        title={color}
                      >
                        <div
                          className={`h-12 w-12 rounded-full border-2 transition-all ${
                            isSelected
                              ? "border-blue-600 ring-2 ring-blue-200 ring-offset-2"
                              : "border-slate-300 hover:border-slate-400"
                          }`}
                          style={{ backgroundColor: colorHex }}
                        >
                          {isSelected && (
                            <div className="flex h-full w-full items-center justify-center">
                              <HiCheck className="h-6 w-6 text-white drop-shadow-md" />
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium text-slate-600 capitalize">
                          {color}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="space-y-4 border-t border-slate-200 pt-6">
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-slate-900">
                  Quantity:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    −
                  </button>
                  <span className="flex h-10 w-16 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full rounded-lg bg-blue-600 px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Add to Cart
              </button>
            </div>

            {/* Product Details */}
            <div className="space-y-2 pt-6">
              {product.brand && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Brand:</span>
                  <span className="font-medium text-slate-900">
                    {product.brand}
                  </span>
                </div>
              )}
              {product.tags && product.tags.length > 0 && (
                <div className="flex items-start justify-between text-sm">
                  <span className="text-slate-600">Tags:</span>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* You May Also Like Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-8 text-center text-2xl font-bold text-slate-900">
              You May Also Like
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((relatedProduct) => {
                const discountPercent = getDiscountPercent(relatedProduct);
                const productImage =
                  relatedProduct.images && relatedProduct.images.length > 0
                    ? relatedProduct.images[0]
                    : "https://via.placeholder.com/400x400?text=No+Image";
                const rating = relatedProduct.rating || 4.7;
                const reviewCount = relatedProduct.reviews || 22;
                const productSlug = relatedProduct.slug || relatedProduct._id;

                // Render stars
                const renderStars = (rating) => {
                  const stars = [];
                  const fullStars = Math.floor(rating);
                  const hasHalfStar = rating % 1 >= 0.5;

                  for (let i = 0; i < fullStars; i++) {
                    stars.push(
                      <HiStar
                        key={i}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
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
                      <HiStar
                        key={i}
                        className="h-4 w-4 fill-slate-200 text-slate-200"
                      />
                    );
                  }
                  return stars;
                };

                return (
                  <article
                    key={relatedProduct._id || relatedProduct.slug}
                    className="group relative flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg"
                  >
                    <div className="relative h-64 overflow-hidden bg-slate-100 sm:h-80">
                      <Link
                        to={`/products/${productSlug}`}
                        className="block h-full w-full"
                      >
                        <img
                          src={productImage}
                          alt={relatedProduct.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      </Link>
                      {/* Discount Badge */}
                      {discountPercent && (
                        <span className="absolute left-3 top-3 inline-flex items-center justify-center rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white">
                          {discountPercent}% off
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/products/${productSlug}`}
                      className="flex flex-col flex-1"
                    >
                      <div className="space-y-3 p-4">
                        {/* Product Name */}
                        <h3 className="text-base font-semibold text-slate-900 line-clamp-1">
                          {relatedProduct.title}
                        </h3>

                        {/* Rating */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {renderStars(rating)}
                          </div>
                          <span className="text-xs text-slate-600">
                            {rating} | {reviewCount}
                          </span>
                        </div>

                        {/* Pricing */}
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-slate-900">
                            {relatedProduct.discountedPrice
                              ? formatPrice(relatedProduct.discountedPrice)
                              : formatPrice(relatedProduct.price)}
                          </span>
                          {relatedProduct.discountedPrice && (
                            <>
                              <span className="text-sm text-slate-400 line-through">
                                {formatPrice(relatedProduct.price)}
                              </span>
                              <span className="text-xs font-medium text-red-600">
                                Sale
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* Customer Reviews Section */}
        <div className="mt-16 pt-12">
          <h2 className="mb-8 text-center text-2xl font-bold text-slate-900">
            Customer Reviews
          </h2>

          {/* Review Summary */}
          <div className="mb-8 grid gap-8 md:grid-cols-3">
            {/* Overall Rating */}
            <div className="flex flex-col items-center justify-center">
              <div className="mb-2 flex items-center gap-1">
                {renderStars(rating)}
              </div>
              <p className="mb-1 text-2xl font-bold text-slate-900">
                {rating.toFixed(2)} out of 5
              </p>
              <p className="flex items-center gap-1 text-sm text-slate-600">
                Based on {reviewCount} reviews
                {reviewCount > 0 && (
                  <HiCheck className="h-4 w-4 text-green-600" />
                )}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="flex flex-col justify-center gap-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviewStats.ratingDistribution[star] || 0;
                const percentage =
                  reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <HiStar
                          key={s}
                          className={`h-4 w-4 ${
                            s <= star
                              ? "fill-amber-400 text-amber-400"
                              : "fill-slate-200 text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full bg-amber-400 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-12 text-right text-sm text-slate-600">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center">
              <button
                onClick={() => {
                  if (!showWriteReview) {
                    setShowWriteReview(true);
                    setTimeout(() => {
                      writeReviewRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }, 100);
                  } else {
                    setShowWriteReview(false);
                  }
                }}
                className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                {showWriteReview ? "Cancel review" : "Write a review"}
              </button>
            </div>
          </div>

          {/* Reviews List */}
          {loadingReviews ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
                <p className="mt-4 text-sm font-medium text-slate-500">
                  Loading reviews...
                </p>
              </div>
            </div>
          ) : reviews.length > 0 ? (
            <>
              {/* Sort Dropdown */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-700">
                    Sort by:
                  </label>
                  <select
                    value={reviewSort}
                    onChange={(e) => setReviewSort(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="oldest">Oldest</option>
                    <option value="highest">Highest Rating</option>
                    <option value="lowest">Lowest Rating</option>
                  </select>
                </div>
              </div>

              {/* Reviews */}
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review._id}
                    className="rounded-lg border border-slate-200 bg-white p-6"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                          <span className="text-sm font-semibold text-slate-600">
                            {review.user?.firstName?.[0] || "A"}
                            {review.user?.lastName?.[0] || ""}
                          </span>
                        </div>
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-semibold text-slate-900">
                              {review.user?.firstName && review.user?.lastName
                                ? `${review.user.firstName} ${review.user.lastName}`
                                : "Anonymous"}
                            </span>
                            {review.verified && (
                              <span className="flex items-center gap-1 rounded bg-slate-900 px-2 py-0.5 text-xs font-medium text-white">
                                <HiCheck className="h-3 w-3" />
                                Verified
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                      </div>
                      <span className="text-sm text-slate-500">
                        {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-slate-600">
                No reviews yet. Be the first to review!
              </p>
            </div>
          )}
        </div>

        {/* Write Review Section */}
        {showWriteReview && (
          <div ref={writeReviewRef} className="mt-8 pt-8">
            <div className="mx-auto max-w-2xl">
              <h2 className="mb-6 text-center text-2xl font-bold text-slate-900">
                Write a Review
              </h2>

              {user ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();

                    if (reviewRating === 0) {
                      toast.error("Please select a rating");
                      return;
                    }

                    if (!reviewComment.trim()) {
                      toast.error("Please write a comment");
                      return;
                    }

                    try {
                      setSubmittingReview(true);
                      await addReview(product._id, {
                        rating: reviewRating,
                        comment: reviewComment.trim(),
                      });
                      toast.success("Review submitted successfully!");
                      setReviewRating(0);
                      setReviewComment("");
                      handleReviewAdded();
                    } catch (error) {
                      toast.error(error.message || "Failed to submit review");
                    } finally {
                      setSubmittingReview(false);
                    }
                  }}
                  className="space-y-6"
                >
                  {/* Rating Selection */}
                  <div>
                    <label className="mb-3 block text-center text-sm font-semibold text-slate-900">
                      Rating <span className="text-red-600">*</span>
                    </label>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setReviewHoveredRating(star)}
                          onMouseLeave={() => setReviewHoveredRating(0)}
                          className="transition-transform hover:scale-110"
                        >
                          <HiStar
                            className={`h-8 w-8 ${
                              star <= (reviewHoveredRating || reviewRating)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-slate-200 text-slate-200"
                            }`}
                          />
                        </button>
                      ))}
                      {reviewRating > 0 && (
                        <span className="ml-2 text-sm text-slate-600">
                          {reviewRating} out of 5
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label
                      htmlFor="review-comment"
                      className="mb-3 block text-center text-sm font-semibold text-slate-900"
                    >
                      Your Review <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      id="review-comment"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={6}
                      className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      placeholder="Share your experience with this product..."
                      maxLength={1000}
                    />
                    <p className="mt-2 text-center text-xs text-slate-500">
                      {reviewComment.length}/1000 characters
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => setShowWriteReview(false)}
                      className="rounded-lg border border-slate-300 bg-white px-8 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Cancel review
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
                      disabled={submittingReview}
                    >
                      {submittingReview ? "Submitting..." : "Submit Review"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                  <p className="mb-4 text-slate-600">
                    Please log in to write a review
                  </p>
                  <Link
                    to="/login"
                    className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Log In
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Product;
