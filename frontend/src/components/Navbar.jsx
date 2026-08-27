import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineShoppingBag,
  HiOutlineUser,
  HiXMark,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineBars3,
  HiHeart,
} from "react-icons/hi2";

import { logoutUser } from "../services/authApi.js";
import { getProducts, searchProducts } from "../services/productApi.js";
import { formatPrice } from "../utils/productUtils.js";
import useAuthStore from "../store/authStore.js";
import useWishlistStore from "../store/wishlistStore.js";
import useCartStore from "../store/cartStore.js";

// Static popular collections
const POPULAR_COLLECTIONS = [
  { slug: "running-shoes", title: "Running Shoes" },
  { slug: "casual-shoes", title: "Casual Shoes" },
  { slug: "sneakers", title: "Sneakers" },
  { slug: "sports-shoes", title: "Sports Shoes" },
];

const navItems = [
  {
    label: "Men",
    to: "/collections/mens-footware",
    submenu: {
      Shoes: [
        {
          label: "Running shoes",
          slug: "running-shoes",
          path: "/collections/mens-running-shoes",
        },
        {
          label: "Walking shoes",
          slug: "walking-shoes",
          path: "/collections/mens-walking-shoes",
        },
        {
          label: "Casual shoes",
          slug: "casual-shoes",
          path: "/collections/mens-casual-shoes",
        },
        {
          label: "Sports shoes",
          slug: "sports-shoes",
          path: "/collections/mens-sports-shoes",
        },
        {
          label: "Sneakers",
          slug: "sneakers",
          path: "/collections/mens-sneakers",
        },
      ],
      "Sandals & Floaters": [
        {
          label: "Casual",
          slug: "casual",
          path: "/collections/casual-sandals",
        },
        {
          label: "Sports",
          slug: "sports",
          path: "/collections/sports-sandals",
        },
        { label: "Clogs", slug: "clogs", path: "/collections/clogs" },
      ],
      Slippers: [
        {
          label: "Flip flops",
          slug: "flip-flops",
          path: "/collections/flip-flops",
        },
        { label: "sliders", slug: "sliders", path: "/collections/sliders" },
      ],
    },
  },
  {
    label: "Women",
    to: "/collections/womens-footware",
    submenu: {
      Shoes: [
        {
          label: "Running shoes",
          slug: "running-shoes",
          path: "/collections/running-shoes",
        },
        {
          label: "Walking shoes",
          slug: "walking-shoes",
          path: "/collections/walking-shoes",
        },
        {
          label: "Casual shoes",
          slug: "casual-shoes",
          path: "/collections/casual-shoes",
        },
        {
          label: "Sports shoes",
          slug: "sports-shoes",
          path: "/collections/sports-shoes",
        },
        { label: "Sneakers", slug: "sneakers", path: "/collections/sneakers" },
      ],
      "Sandals & Floaters": [
        {
          label: "Casual",
          slug: "casual",
          path: "/collections/casual-sandals",
        },
        {
          label: "Sports",
          slug: "sports",
          path: "/collections/sports-sandals",
        },
        { label: "Clogs", slug: "clogs", path: "/collections/clogs" },
      ],
      Slippers: [
        {
          label: "Flip flops",
          slug: "flip-flops",
          path: "/collections/flip-flops",
        },
        { label: "sliders", slug: "sliders", path: "/collections/sliders" },
      ],
    },
  },
  {
    label: "Kids",
    to: "/collections/kids-footware",
    submenu: {
      Shoes: [
        {
          label: "Running shoes",
          slug: "running-shoes",
          path: "/collections/running-shoes",
        },
        {
          label: "Sport shoes",
          slug: "sport-shoes",
          path: "/collections/sport-shoes",
        },
        {
          label: "Casual shoes",
          slug: "casual-shoes",
          path: "/collections/casual-shoes",
        },
        { label: "Sneakers", slug: "sneakers", path: "/collections/sneakers" },
        {
          label: "Slip on shoes",
          slug: "slip-on-shoes",
          path: "/collections/slip-on-shoes",
        },
      ],
      "Sandals & Floaters": [
        {
          label: "Casual",
          slug: "casual",
          path: "/collections/casual-sandals",
        },
        {
          label: "Sports",
          slug: "sports",
          path: "/collections/sports-sandals",
        },
        { label: "Clogs", slug: "clogs", path: "/collections/clogs" },
      ],
      "School shoes": [
        { label: "boys", slug: "boys", path: "/collections/school-shoes-boys" },
      ],
    },
  },
  { label: "Sale", to: "/collections/mega-sale-collection" },
  { label: "New Arrival", to: "/collections/new-arrival" },
];

const Navbar = () => {
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileMenus, setExpandedMobileMenus] = useState({});
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [topRatedProducts, setTopRatedProducts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingTopRated, setIsLoadingTopRated] = useState(false);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isMobileAccountDropdownOpen, setIsMobileAccountDropdownOpen] =
    useState(false);
  const accountDropdownRef = useRef(null);
  const mobileAccountDropdownRef = useRef(null);
  const searchContainerRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, setUser } = useAuthStore();
  const { getAllWishlistIds } = useWishlistStore();
  const { getCartCount } = useCartStore();
  const isAuthenticated = Boolean(user);
  const isAdmin = user?.role === "admin";
  const wishlistCount = getAllWishlistIds().length;
  const cartCount = getCartCount();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setExpandedMobileMenus({});
  };

  const toggleMobileSubmenu = (label) => {
    setExpandedMobileMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logoutUser();
      setUser(null);
      toast.success("Logged out");
      navigate("/");
      closeMobileMenu();
      setIsAccountDropdownOpen(false);
      setIsMobileAccountDropdownOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to log out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Fetch top rated products when search opens
  useEffect(() => {
    if (isSearchOpen) {
      const fetchData = async () => {
        // Fetch top rated products
        if (topRatedProducts.length === 0) {
          try {
            setIsLoadingTopRated(true);
            const response = await getProducts();
            // Handle paginated response: { products, pagination }
            const products = response.data?.products || response.data || [];
            // Sort by rating and review count, get top 4
            const topRated = products
              .filter((p) => p.rating > 0)
              .sort((a, b) => {
                if (b.rating !== a.rating) return b.rating - a.rating;
                return b.reviewCount - a.reviewCount;
              })
              .slice(0, 4);
            setTopRatedProducts(topRated);
          } catch (err) {
            console.error("Error fetching top rated products:", err);
          } finally {
            setIsLoadingTopRated(false);
          }
        }
      };
      fetchData();
    }
  }, [isSearchOpen, topRatedProducts.length]);

  // Search products when query changes
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim() === "") {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await searchProducts(searchQuery, 1, {});
        // The new API returns { products, pagination }
        setSearchResults(response.data?.products || []);
      } catch (err) {
        console.error("Error searching products:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        accountDropdownRef.current &&
        !accountDropdownRef.current.contains(event.target)
      ) {
        setIsAccountDropdownOpen(false);
      }
      if (
        mobileAccountDropdownRef.current &&
        !mobileAccountDropdownRef.current.contains(event.target)
      ) {
        setIsMobileAccountDropdownOpen(false);
      }
      if (isSearchOpen) {
        // Check if click is on search button (by checking aria-label or button type)
        const isSearchButton =
          event.target.closest('button[aria-label="Search"]') !== null;

        if (
          searchContainerRef.current &&
          !searchContainerRef.current.contains(event.target) &&
          !isSearchButton
        ) {
          setIsSearchOpen(false);
          setSearchQuery("");
          setSearchResults([]);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  return (
    <header
      className="fixed top-0 inset-x-0 w-full z-50 border-b border-slate-200 bg-white backdrop-blur-sm"
      onMouseLeave={() => setHoveredMenu(null)}
    >
      <nav className="mx-auto flex w-full items-center justify-between px-4 py-3 sm:px-10 md:px-10 xl:px-16">
        <div className="flex items-center gap-12">
          <Link
            to="/"
            className="flex items-center gap-3 text-xl font-semibold uppercase tracking-[0.3em] text-slate-900"
            onClick={closeMobileMenu}
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-lg text-white">
              SL
            </span>
            <span className="hidden sm:inline">StrideLab</span>
          </Link>
          <div className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => {
              const hasSubmenu = !!item.submenu;
              const isActiveHover = hoveredMenu === item.label;
              const handleMouseEnter = hasSubmenu
                ? () => setHoveredMenu(item.label)
                : () => setHoveredMenu(null);
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={handleMouseEnter}
                >
                  {hasSubmenu ? (
                    <Link
                      to={item.to}
                      className={`flex items-center gap-1 text-sm font-semibold uppercase tracking-[0.25em] transition-colors ${
                        isActiveHover
                          ? "text-slate-900"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <Link
                      to={item.to}
                      className="flex items-center gap-1 text-sm font-semibold uppercase tracking-[0.25em] text-slate-600 transition-colors hover:text-slate-900"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="hidden items-center gap-5 lg:flex">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-blue-500 hover:text-blue-600"
            aria-label="Search"
            onClick={() => setIsSearchOpen(true)}
          >
            <HiOutlineMagnifyingGlass className="h-5 w-5" />
          </button>
          <Link
            to="/wishlist"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-blue-500 hover:text-blue-600"
            aria-label="Wishlist"
          >
            <HiHeart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>
          <Link
            to="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-blue-500 hover:text-blue-600"
            aria-label="Cart"
          >
            <HiOutlineShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <div className="relative" ref={accountDropdownRef}>
              <button
                type="button"
                onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 transition-colors hover:border-blue-500 hover:text-blue-600"
                aria-label="Account menu"
              >
                <HiOutlineUser className="h-5 w-5" />
              </button>
              {isAccountDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg">
                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setIsAccountDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setIsAccountDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      My Orders
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setIsAccountDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        Dashboard
                      </Link>
                    )}
                    <div className="border-t border-slate-200"></div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-600 transition-colors hover:text-blue-600"
              >
                Login
              </Link>
              <span className="text-slate-300">/</span>
              <Link
                to="/register"
                className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-600 transition-colors hover:text-blue-700"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-blue-500 hover:text-blue-600"
            aria-label="Search"
            onClick={() => setIsSearchOpen(true)}
          >
            <HiOutlineMagnifyingGlass className="h-5 w-5" />
          </button>
          <Link
            to="/wishlist"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-blue-500 hover:text-blue-600"
            aria-label="Wishlist"
          >
            <HiHeart className="h-5 w-5" />
            {wishlistCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>
          <Link
            to="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-blue-500 hover:text-blue-600"
            aria-label="Cart"
          >
            <HiOutlineShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition-colors hover:border-blue-500 hover:text-blue-600"
            onClick={toggleMobileMenu}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <HiXMark className="h-5 w-5" />
            ) : (
              <HiOutlineBars3 className="h-5 w-5" />
            )}
          </button>
        </div>
      </nav>
      {isSearchOpen && (
        <div
          ref={searchContainerRef}
          className="absolute left-0 right-0 top-full z-60 border-t border-slate-200 bg-white/95 backdrop-blur shadow-lg"
        >
          <div className="mx-auto w-full px-4 py-4 sm:px-6 md:px-10 xl:px-16">
            <form
              onSubmit={handleSearchSubmit}
              className="mb-4 flex items-center gap-4"
            >
              <div className="relative flex-1">
                <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sneakers, collections, drops..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  autoFocus
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"></div>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-colors hover:border-blue-500 hover:text-blue-600"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Close search"
              >
                <HiXMark className="h-5 w-5" />
              </button>
            </form>

            {/* Search Results or Popular Searches + Top Rated */}
            {searchQuery.trim() ? (
              <div className="max-h-96 overflow-y-auto">
                {searchResults.length > 0 ? (
                  <div>
                    <h3 className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Search Results
                    </h3>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                      {searchResults.map((product) => (
                        <Link
                          key={product._id}
                          to={`/products/${product.slug}`}
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50"
                        >
                          {product.images && product.images[0] && (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="h-14 w-14 shrink-0 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {product.title}
                            </p>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-500 truncate">
                                {product.brand}
                              </span>
                              {product.rating > 0 && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-xs text-slate-500 whitespace-nowrap">
                                    ⭐ {product.rating.toFixed(1)}
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-slate-900 mt-0.5">
                              {formatPrice(
                                product.discountedPrice || product.price
                              )}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : !isSearching ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-slate-500">
                      No products found for "{searchQuery}"
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Popular Collections - Smaller width (1/3) */}
                <div>
                  <h3 className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Popular Collections
                  </h3>
                  {POPULAR_COLLECTIONS.length > 0 ? (
                    <div className="space-y-1">
                      {POPULAR_COLLECTIONS.map((collection) => (
                        <Link
                          key={collection.slug}
                          to={`/collections/${collection.slug}`}
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          <span className="truncate">{collection.title}</span>
                          <HiOutlineChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-xs text-slate-500">
                        No collections available
                      </p>
                    </div>
                  )}
                </div>

                {/* Top Rated Products - Larger width (2/3) */}
                <div className="lg:col-span-2">
                  <h3 className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Top Rated Products
                  </h3>
                  {isLoadingTopRated ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"></div>
                    </div>
                  ) : topRatedProducts.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {topRatedProducts.map((product) => (
                        <Link
                          key={product._id}
                          to={`/products/${product.slug}`}
                          onClick={() => {
                            setIsSearchOpen(false);
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                          className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50"
                        >
                          {product.images && product.images[0] && (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="h-14 w-14 shrink-0 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {product.title}
                            </p>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-500 truncate">
                                {product.brand}
                              </span>
                              {product.rating > 0 && (
                                <>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-xs text-slate-500 whitespace-nowrap">
                                    ⭐ {product.rating.toFixed(1)}
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-slate-900 mt-0.5">
                              {formatPrice(
                                product.discountedPrice || product.price
                              )}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm text-slate-500">
                        No top rated products available
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {hoveredMenu && (
        <div className="absolute left-0 right-0 top-full z-60 hidden w-full border-t border-slate-200 bg-white/95 px-6 py-6 shadow-lg backdrop-blur lg:block">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 md:px-10 xl:px-16">
            <div className="grid grid-cols-3 gap-8">
              {Object.entries(
                navItems.find((item) => item.label === hoveredMenu)?.submenu ||
                  {}
              ).map(([category, items]) => (
                <div key={category}>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">
                    {category}
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {items.map((subItem) => (
                      <li key={subItem.slug}>
                        <Link
                          to={subItem.path}
                          className="transition-colors hover:text-blue-600"
                        >
                          {subItem.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {isMobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white shadow-sm lg:hidden">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => {
                const hasSubmenu = !!item.submenu;
                const isExpanded = expandedMobileMenus[item.label];
                if (!hasSubmenu) {
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={closeMobileMenu}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-700 transition-colors hover:border-blue-500 hover:text-blue-600"
                    >
                      <span>{item.label}</span>
                      <HiOutlineChevronRight className="h-4 w-4" />
                    </Link>
                  );
                }
                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200"
                  >
                    <div className="flex items-center">
                      <Link
                        to={item.to}
                        onClick={closeMobileMenu}
                        className="flex-1 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-700"
                      >
                        {item.label}
                      </Link>
                      <button
                        type="button"
                        className="px-4 py-3"
                        onClick={() => toggleMobileSubmenu(item.label)}
                      >
                        <HiOutlineChevronDown
                          className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="space-y-4 border-t border-slate-200 px-4 py-3">
                        {Object.entries(item.submenu).map(
                          ([category, items]) => (
                            <div key={category}>
                              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 mb-2">
                                {category}
                              </h4>
                              <ul className="space-y-1 text-sm text-slate-600">
                                {items.map((subItem) => (
                                  <li key={subItem.slug}>
                                    <Link
                                      to={subItem.path}
                                      className="block rounded-lg px-2 py-2 transition-colors hover:bg-slate-100"
                                      onClick={closeMobileMenu}
                                    >
                                      {subItem.label}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-4">
              {isAuthenticated ? (
                <div className="relative w-full" ref={mobileAccountDropdownRef}>
                  <button
                    type="button"
                    onClick={() =>
                      setIsMobileAccountDropdownOpen(
                        !isMobileAccountDropdownOpen
                      )
                    }
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-700 transition-colors hover:border-blue-500 hover:text-blue-600"
                  >
                    <div className="flex items-center gap-3">
                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <HiOutlineUser className="h-4 w-4" />
                      </div>
                      <span>Account</span>
                    </div>
                    <HiOutlineChevronDown
                      className={`h-4 w-4 transition-transform ${isMobileAccountDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isMobileAccountDropdownOpen && (
                    <div className="mt-2 rounded-2xl border border-slate-200 bg-white">
                      <Link
                        to="/profile"
                        onClick={() => {
                          setIsMobileAccountDropdownOpen(false);
                          closeMobileMenu();
                        }}
                        className="flex items-center gap-3 rounded-t-2xl px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        My Profile
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => {
                          setIsMobileAccountDropdownOpen(false);
                          closeMobileMenu();
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                      >
                        My Orders
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => {
                            setIsMobileAccountDropdownOpen(false);
                            closeMobileMenu();
                          }}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                        >
                          Dashboard
                        </Link>
                      )}
                      <div className="border-t border-slate-200"></div>
                      <button
                        type="button"
                        onClick={() => {
                          handleLogout();
                          setIsMobileAccountDropdownOpen(false);
                        }}
                        disabled={isLoggingOut}
                        className="w-full px-4 py-3 text-left text-sm text-red-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isLoggingOut ? "Logging out..." : "Logout"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.25em]">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="text-slate-600 transition-colors hover:text-blue-600"
                  >
                    Login
                  </Link>
                  <span className="text-slate-300">/</span>
                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="text-blue-600 transition-colors hover:text-blue-700"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
