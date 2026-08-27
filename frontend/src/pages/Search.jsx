import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HiHeart,
  HiStar,
  HiOutlineMagnifyingGlass,
  HiCheck,
  HiChevronDown,
  HiChevronUp,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi2";
import { searchProducts } from "../services/productApi.js";
import { formatPrice, getDiscountPercent } from "../utils/productUtils.js";
import { getColorHex } from "../utils/colorUtils.js";
import useWishlistStore from "../store/wishlistStore.js";
import useAuthStore from "../store/authStore.js";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchData, setSearchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuthStore();
  const { isInWishlist, toggleWishlist } = useWishlistStore();

  // Filter states
  const [selectedPriceRanges, setSelectedPriceRanges] = useState([]);
  const [selectedDiscountRanges, setSelectedDiscountRanges] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [sortBy, setSortBy] = useState("default");

  // Collapsible filter sections
  const [expandedFilters, setExpandedFilters] = useState({
    price: false,
    discount: false,
    size: false,
    color: false,
  });

  // Reset to page 1 when query or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    query,
    selectedPriceRanges,
    selectedDiscountRanges,
    selectedSizes,
    selectedColors,
    sortBy,
  ]);

  // Reset filters when query changes
  useEffect(() => {
    setSelectedPriceRanges([]);
    setSelectedDiscountRanges([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSortBy("default");
  }, [query]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setSearchData(null);
        setLoading(false);
        return;
      }

      try {
        // Only show full loading on initial load or query change
        // Use filtering state for filter changes to prevent blinking
        const isInitialLoad = !searchData || searchData.query !== query;
        if (isInitialLoad) {
          setLoading(true);
        } else {
          setFiltering(true);
        }
        setError(null);
        const filters = {
          priceRanges: selectedPriceRanges,
          discountRanges: selectedDiscountRanges,
          sizes: selectedSizes,
          colors: selectedColors,
          sortBy: sortBy,
        };
        const response = await searchProducts(query, currentPage, filters);
        setSearchData({
          products: response.data.products || [],
          pagination: response.data.pagination,
          query: query,
        });
      } catch (err) {
        setError(err.message || "Failed to search products");
        toast.error(err.message || "Failed to search products");
        setSearchData(null);
      } finally {
        setLoading(false);
        setFiltering(false);
      }
    };

    fetchSearchResults();
  }, [
    query,
    currentPage,
    selectedPriceRanges,
    selectedDiscountRanges,
    selectedSizes,
    selectedColors,
    sortBy,
  ]);

  // Get products safely
  const products = searchData?.products || [];

  // Static price ranges
  const priceRanges = [
    { key: "50-100", start: 50, end: 100, label: "Rs. 50 - Rs. 100" },
    { key: "101-150", start: 101, end: 150, label: "Rs. 101 - Rs. 150" },
    { key: "151-200", start: 151, end: 200, label: "Rs. 151 - Rs. 200" },
    { key: "201-250", start: 201, end: 250, label: "Rs. 201 - Rs. 250" },
    { key: "251-300", start: 251, end: 300, label: "Rs. 251 - Rs. 300" },
    { key: "300+", start: 300, end: null, label: "Rs. 300 & Above" },
  ];

  // Extract unique filter options from all products (for display purposes)
  const filterOptions = useMemo(() => {
    if (!products || products.length === 0) {
      return {
        sizes: [],
        colors: [],
      };
    }

    const sizes = new Set();
    const colors = new Set();

    products.forEach((product) => {
      if (product.sizes && Array.isArray(product.sizes)) {
        product.sizes.forEach((size) => sizes.add(size));
      }
      if (product.colors && Array.isArray(product.colors)) {
        product.colors.forEach((color) => colors.add(color));
      }
    });

    return {
      sizes: Array.from(sizes).sort((a, b) => {
        const numA = parseFloat(a);
        const numB = parseFloat(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      }),
      colors: Array.from(colors).sort(),
    };
  }, [products]);

  // Toggle filter functions
  const togglePriceRange = (range) => {
    setSelectedPriceRanges((prev) =>
      prev.includes(range) ? prev.filter((r) => r !== range) : [...prev, range]
    );
  };

  const toggleDiscountRange = (range) => {
    setSelectedDiscountRanges((prev) =>
      prev.includes(range) ? prev.filter((r) => r !== range) : [...prev, range]
    );
  };

  const toggleSize = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const toggleFilterSection = (section) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const clearFilters = () => {
    setSelectedPriceRanges([]);
    setSelectedDiscountRanges([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSortBy("default");
  };

  const hasActiveFilters =
    selectedPriceRanges.length > 0 ||
    selectedDiscountRanges.length > 0 ||
    selectedSizes.length > 0 ||
    selectedColors.length > 0;

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
            Searching products...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-480 px-6 py-24 text-center sm:px-10 xl:px-16">
        <h1 className="text-2xl font-semibold text-slate-900">Search Error</h1>
        <p className="mt-3 text-sm text-slate-500">{error}</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-full border border-slate-200 px-6 py-2 text-sm font-semibold uppercase tracking-[0.25em] text-slate-600 transition-colors hover:border-blue-500 hover:text-blue-600"
        >
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-white">
      <div className="mx-auto w-full max-w-480 px-6 py-12 sm:px-10 xl:px-16">
        {/* Main Content: Filters + Products */}
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left Sidebar - Filters */}
          <aside className="w-full lg:w-80 lg:shrink-0">
            <div className="sticky top-24 space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Filters
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Price Range Filter */}
              <div className="border-b border-slate-200 pb-4">
                <button
                  onClick={() => toggleFilterSection("price")}
                  className="flex w-full items-center justify-between text-sm font-semibold text-slate-900"
                >
                  <span>PRICE</span>
                  {expandedFilters.price ? (
                    <HiChevronUp className="h-4 w-4" />
                  ) : (
                    <HiChevronDown className="h-4 w-4" />
                  )}
                </button>
                {expandedFilters.price && (
                  <div className="mt-3 space-y-2">
                    {priceRanges.map((range) => (
                      <label
                        key={range.key}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPriceRanges.includes(range.key)}
                          onChange={() => togglePriceRange(range.key)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">
                          {range.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Discount Range Filter */}
              <div className="border-b border-slate-200 pb-4">
                <button
                  onClick={() => toggleFilterSection("discount")}
                  className="flex w-full items-center justify-between text-sm font-semibold text-slate-900"
                >
                  <span>DISCOUNT</span>
                  {expandedFilters.discount ? (
                    <HiChevronUp className="h-4 w-4" />
                  ) : (
                    <HiChevronDown className="h-4 w-4" />
                  )}
                </button>
                {expandedFilters.discount && (
                  <div className="mt-3 space-y-2">
                    {[
                      { key: "less-than-10", label: "Less Than 10%" },
                      { key: "10+", label: "10% - And Above" },
                      { key: "20+", label: "20% - And Above" },
                      { key: "30+", label: "30% - And Above" },
                      { key: "40+", label: "40% - And Above" },
                      { key: "50+", label: "50% - And Above" },
                    ].map((range) => (
                      <label
                        key={range.key}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDiscountRanges.includes(range.key)}
                          onChange={() => toggleDiscountRange(range.key)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">
                          {range.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Size Filter */}
              {filterOptions.sizes.length > 0 && (
                <div className="border-b border-slate-200 pb-4">
                  <button
                    onClick={() => toggleFilterSection("size")}
                    className="flex w-full items-center justify-between text-sm font-semibold text-slate-900"
                  >
                    <span>SIZE</span>
                    {expandedFilters.size ? (
                      <HiChevronUp className="h-4 w-4" />
                    ) : (
                      <HiChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {expandedFilters.size && (
                    <div className="mt-3 space-y-2">
                      {filterOptions.sizes.map((size) => (
                        <label
                          key={size}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSizes.includes(size)}
                            onChange={() => toggleSize(size)}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-slate-700">{size}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Color Filter */}
              {filterOptions.colors.length > 0 && (
                <div className="pb-4">
                  <button
                    onClick={() => toggleFilterSection("color")}
                    className="flex w-full items-center justify-between text-sm font-semibold text-slate-900"
                  >
                    <span>COLOR</span>
                    {expandedFilters.color ? (
                      <HiChevronUp className="h-4 w-4" />
                    ) : (
                      <HiChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  {expandedFilters.color && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {filterOptions.colors.map((color) => {
                        const isSelected = selectedColors.includes(color);
                        const colorHex = getColorHex(color);

                        return (
                          <button
                            key={color}
                            onClick={() => toggleColor(color)}
                            className="group relative flex flex-col items-center gap-1.5"
                            title={color}
                          >
                            <div
                              className={`h-10 w-10 rounded-full border-2 transition-all ${
                                isSelected
                                  ? "border-blue-600 ring-2 ring-blue-200 ring-offset-2"
                                  : "border-slate-300 hover:border-slate-400"
                              }`}
                              style={{ backgroundColor: colorHex }}
                            >
                              {isSelected && (
                                <div className="flex h-full w-full items-center justify-center">
                                  <HiCheck className="h-5 w-5 text-white drop-shadow-md" />
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-slate-600 max-w-[60px] truncate">
                              {color}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* Right Side - Products */}
          <div className="flex-1">
            {/* Sort and Results Count */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
                {searchData?.pagination
                  ? `${searchData.pagination.totalProducts} ${searchData.pagination.totalProducts === 1 ? "Product" : "Products"}`
                  : `${products.length} ${products.length === 1 ? "Product" : "Products"}`}
                {query && ` for "${query}"`}
              </p>
              <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl text-center">
                Search Results
              </h1>
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-600">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="default">Default</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {products.length > 0 ? (
              <div className="relative min-h-[400px]">
                {/* Subtle loading overlay when filtering */}
                {filtering && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
                    <div className="text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                      <p className="mt-2 text-sm font-medium text-slate-600">
                        Applying filters...
                      </p>
                    </div>
                  </div>
                )}
                <div
                  className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${filtering ? "opacity-60" : "opacity-100"} transition-opacity duration-200`}
                >
                  {products.map((product) => {
                    const discountPercent = getDiscountPercent(product);
                    const productImage =
                      product.images && product.images.length > 0
                        ? product.images[0]
                        : "https://via.placeholder.com/400x400?text=No+Image";

                    const rating = product.rating || 0;
                    const reviewCount = product.reviewCount || 0;
                    const isBestSeller = product.isBestSeller || false;
                    const productSlug = product.slug || product._id;
                    const productId = product._id || product.slug;
                    const isWishlisted = isInWishlist(productId);

                    const handleToggleWishlist = async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      await toggleWishlist(productId, user);
                    };

                    return (
                      <article
                        key={product._id || product.slug}
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
                          {/* Discount Badge - Top Left */}
                          {discountPercent && discountPercent > 0 && (
                            <span className="absolute left-3 top-3 z-20 inline-flex items-center justify-center rounded-md bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-lg">
                              {discountPercent}% OFF
                            </span>
                          )}
                          {/* Wishlist Icon - Top Right */}
                          <button
                            onClick={handleToggleWishlist}
                            className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur transition-colors hover:bg-white"
                            aria-label="Add to wishlist"
                          >
                            <HiHeart
                              className={`h-5 w-5 ${
                                isWishlisted
                                  ? "fill-red-500 text-red-500"
                                  : "text-slate-600"
                              }`}
                            />
                          </button>
                          {/* Best Seller Badge - Bottom Right */}
                          {isBestSeller && (
                            <div className="absolute bottom-3 right-3">
                              <div className="flex items-center gap-1 rounded bg-red-600 px-2 py-1">
                                <HiStar className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-semibold text-white">
                                  BEST SELLER
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <Link
                          to={`/products/${productSlug}`}
                          className="flex flex-col flex-1"
                        >
                          <div className="space-y-3 p-4">
                            {/* Product Name */}
                            <h3 className="text-base font-semibold text-slate-900 line-clamp-1">
                              {product.title}
                            </h3>

                            {/* Rating */}
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
                                {product.sizes.map((size) => (
                                  <button
                                    key={size}
                                    onClick={(e) => e.preventDefault()}
                                    className="rounded border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-600"
                                  >
                                    {size}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </Link>
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Pagination Controls */}
            {products.length > 0 &&
              searchData?.pagination &&
              searchData.pagination.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={!searchData.pagination.hasPrevPage}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                  >
                    <HiChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: searchData.pagination.totalPages },
                      (_, i) => i + 1
                    )
                      .filter((pageNum) => {
                        const current = searchData.pagination.currentPage;
                        const total = searchData.pagination.totalPages;
                        // Show first page, last page, current page, and pages around current
                        return (
                          pageNum === 1 ||
                          pageNum === total ||
                          (pageNum >= current - 1 && pageNum <= current + 1)
                        );
                      })
                      .map((pageNum, index, array) => {
                        // Add ellipsis if there's a gap
                        const showEllipsisBefore =
                          index > 0 && pageNum - array[index - 1] > 1;
                        return (
                          <div
                            key={pageNum}
                            className="flex items-center gap-1"
                          >
                            {showEllipsisBefore && (
                              <span className="px-2 text-sm text-slate-400">
                                ...
                              </span>
                            )}
                            <button
                              onClick={() => setCurrentPage(pageNum)}
                              className={`min-w-[40px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                pageNum === searchData.pagination.currentPage
                                  ? "border-blue-600 bg-blue-600 text-white"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(searchData.pagination.totalPages, prev + 1)
                      )
                    }
                    disabled={!searchData.pagination.hasNextPage}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                  >
                    Next
                    <HiChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

            {/* Empty State */}
            {products.length === 0 && query && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 py-12 text-center">
                {filtering ? (
                  <div className="flex flex-col items-center justify-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                    <p className="mt-4 text-sm font-medium text-slate-500">
                      Applying filters...
                    </p>
                  </div>
                ) : hasActiveFilters ? (
                  <>
                    <p className="text-sm font-medium text-slate-500">
                      No products match your filters.
                    </p>
                    <button
                      onClick={clearFilters}
                      className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Clear filters
                    </button>
                  </>
                ) : (
                  <>
                    <HiOutlineMagnifyingGlass className="h-16 w-16 text-slate-300 mb-4 mx-auto" />
                    <h2 className="text-xl font-semibold text-slate-900 mb-2">
                      No products found for "{query}"
                    </h2>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                      Try adjusting your search terms or browse our collections
                      to find what you're looking for.
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
