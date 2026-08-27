import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HiXMark,
  HiOutlineMagnifyingGlass,
  HiOutlinePhoto,
} from "react-icons/hi2";
import { getProducts, searchProducts, getProduct } from "../services/productApi.js";

const ProductSelector = ({
  selectedProducts = [],
  onChange,
  allProducts = null, // If provided, use these instead of fetching
}) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState(allProducts || []);
  const [selectedProductDetails, setSelectedProductDetails] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(!allProducts);
  const [productsPage, setProductsPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(false);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [tempProducts, setTempProducts] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef(null);
  const modalSearchTimeoutRef = useRef(null);

  // Fetch details for selected products that aren't in the current products list
  useEffect(() => {
    const fetchSelectedProductDetails = async () => {
      const missingProductIds = selectedProducts.filter(
        (id) => !products.find((p) => p._id === id)
      );

      if (missingProductIds.length === 0) {
        // All selected products are in the current products list
        const details = selectedProducts
          .map((id) => products.find((p) => p._id === id))
          .filter(Boolean);
        setSelectedProductDetails(details);
        return;
      }

      // Fetch missing product details
      try {
        const productPromises = missingProductIds.map((id) => getProduct(id));
        const responses = await Promise.all(productPromises);
        const fetchedProducts = responses.map((res) => res.data);

        // Combine with existing products
        const allProductDetails = [
          ...products.filter((p) => selectedProducts.includes(p._id)),
          ...fetchedProducts,
        ];
        setSelectedProductDetails(allProductDetails);
      } catch (error) {
        console.error("Failed to fetch selected product details:", error);
        // Fallback to products we have
        const details = selectedProducts
          .map((id) => products.find((p) => p._id === id))
          .filter(Boolean);
        setSelectedProductDetails(details);
      }
    };

    if (selectedProducts.length > 0) {
      fetchSelectedProductDetails();
    } else {
      setSelectedProductDetails([]);
    }
  }, [selectedProducts, products]);

  // Fetch products on mount if not provided
  useEffect(() => {
    if (allProducts) {
      setProducts(allProducts);
      setLoadingProducts(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const response = await getProducts();
        const data = response.data;
        setProducts(Array.isArray(data) ? data : data.products || []);
        setProductsPage(1);
        setHasMoreProducts(false); // getProducts returns all products
      } catch (error) {
        toast.error("Failed to load products");
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, [allProducts]);

  const loadMoreProducts = async () => {
    if (loadingMoreProducts || !hasMoreProducts || !isSearching) return;

    try {
      setLoadingMoreProducts(true);
      const nextPage = productsPage + 1;
      const response = await searchProducts(modalSearchTerm, nextPage);
      const data = response.data;
      setProducts((prev) => [...prev, ...(data.products || [])]);
      setProductsPage(nextPage);
      setHasMoreProducts(data.pagination?.hasNextPage || false);
    } catch (error) {
      toast.error("Failed to load more products");
    } finally {
      setLoadingMoreProducts(false);
    }
  };

  const searchProductsList = async (searchTerm) => {
    try {
      setLoadingProducts(true);
      if (!searchTerm.trim()) {
        // If search is empty, fetch all products
        const response = await getProducts();
        const data = response.data;
        setProducts(Array.isArray(data) ? data : data.products || []);
        setProductsPage(1);
        setHasMoreProducts(false);
        setIsSearching(false);
      } else {
        // Use searchProducts API
        const response = await searchProducts(searchTerm, 1);
        const data = response.data;
        setProducts(data.products || []);
        setProductsPage(1);
        setHasMoreProducts(data.pagination?.hasNextPage || false);
        setIsSearching(true);
      }
    } catch (error) {
      toast.error("Failed to search products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleProductToggle = (productId) => {
    if (tempProducts.includes(productId)) {
      setTempProducts(tempProducts.filter((id) => id !== productId));
    } else {
      setTempProducts([...tempProducts, productId]);
    }
  };

  const handleRemoveProduct = (productId) => {
    const newProducts = selectedProducts.filter((id) => id !== productId);
    onChange(newProducts);
  };

  const handleOpenModal = async () => {
    setProductModalOpen(true);
    setModalSearchTerm("");
    setTempProducts([...selectedProducts]);
    // Reset to first page without search
    try {
      setLoadingProducts(true);
      const response = await getProducts();
      const data = response.data;
      setProducts(Array.isArray(data) ? data : data.products || []);
      setProductsPage(1);
      setHasMoreProducts(false);
      setIsSearching(false);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCloseModal = () => {
    setTempProducts([...selectedProducts]);
    setModalSearchTerm("");
    setProductSearchTerm("");
    setProductModalOpen(false);
  };

  const handleSave = () => {
    onChange([...tempProducts]);
    setModalSearchTerm("");
    setProductSearchTerm("");
    setProductModalOpen(false);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (modalSearchTimeoutRef.current) {
        clearTimeout(modalSearchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className="space-y-4">
        {/* Search Bar with Browse Button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={productSearchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setProductSearchTerm(value);

                // Clear existing timeout
                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current);
                }

                // Update modal search immediately if modal is already open
                if (productModalOpen && value.trim()) {
                  setModalSearchTerm(value);
                } else if (value.trim()) {
                  // Add delay before opening modal
                  searchTimeoutRef.current = setTimeout(() => {
                    if (!productModalOpen) {
                      setProductModalOpen(true);
                      setModalSearchTerm(value);
                      setTempProducts([...selectedProducts]);
                    }
                  }, 500); // 500ms delay
                }
              }}
              onFocus={() => {
                // Open modal when focusing on search if there's text
                if (!productModalOpen && productSearchTerm.trim()) {
                  setProductModalOpen(true);
                  setModalSearchTerm(productSearchTerm);
                  setTempProducts([...selectedProducts]);
                }
              }}
              placeholder="Search products"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium whitespace-nowrap"
          >
            Browse
          </button>
        </div>

        {/* Selected Products as Cards */}
        {selectedProducts.length > 0 && (
          <div className="space-y-2">
            {selectedProductDetails
              .filter((product) => {
                if (!productSearchTerm.trim()) return true;
                return product.title
                  ?.toLowerCase()
                  .includes(productSearchTerm.toLowerCase());
              })
              .map((product) => {
                const productId = product._id;
                return (
                <div
                  key={productId}
                  className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                >
                  {product.images && product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                      <HiOutlinePhoto className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (product._id) {
                          navigate(`/admin/products/edit/${product._id}`);
                        }
                      }}
                      className="text-sm font-medium text-slate-900 hover:text-slate-700 hover:underline text-left"
                    >
                      {product.title}
                    </button>
                    <p className="text-xs text-slate-500">
                      {product.price && `$${product.price}`}
                      {product.discountedPrice &&
                        product.discountedPrice < product.price &&
                        ` ($${product.discountedPrice})`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(productId)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    <HiXMark className="h-5 w-5" />
                  </button>
                </div>
                );
              })}
          </div>
        )}

        {/* Empty State */}
        {selectedProducts.length === 0 && (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              No products selected. Click "Browse" to add products.
            </p>
          </div>
        )}
      </div>

      {/* Product Selection Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Select products
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <HiXMark className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Search */}
            <div className="p-6 border-b border-slate-200">
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={modalSearchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    setModalSearchTerm(value);

                    // Clear existing timeout
                    if (modalSearchTimeoutRef.current) {
                      clearTimeout(modalSearchTimeoutRef.current);
                    }

                    // Debounce search - fetch from backend after 500ms
                    modalSearchTimeoutRef.current = setTimeout(() => {
                      searchProductsList(value);
                    }, 500);
                  }}
                  placeholder="Search products"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  autoFocus
                />
                {loadingProducts && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Content - Product List */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingProducts && products.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-600 rounded-full"></div>
                  <p className="text-sm text-slate-500 mt-4">
                    Loading products...
                  </p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">
                    {modalSearchTerm.trim()
                      ? `No products found matching "${modalSearchTerm}"`
                      : "No products available"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {products.map((product) => {
                    const isSelected = tempProducts.includes(product._id);

                    return (
                      <label
                        key={product._id}
                        className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleProductToggle(product._id)}
                          className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                        />
                        {product.images && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.title}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                            <HiOutlinePhoto className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (product._id) {
                                navigate(`/admin/products/edit/${product._id}`);
                              }
                            }}
                            className="text-sm font-medium text-slate-900 hover:text-slate-700 hover:underline text-left"
                          >
                            {product.title}
                          </button>
                          <p className="text-xs text-slate-500">
                            {product.price && `$${product.price}`}
                            {product.discountedPrice &&
                              product.discountedPrice < product.price &&
                              ` ($${product.discountedPrice})`}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                  {/* Load More Button */}
                  {hasMoreProducts && (
                    <div className="pt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={loadMoreProducts}
                        disabled={loadingMoreProducts}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingMoreProducts ? (
                          <span className="flex items-center gap-2">
                            <div className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                            Loading...
                          </span>
                        ) : (
                          "Load More"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                {tempProducts.length} product
                {tempProducts.length !== 1 ? "s" : ""} selected
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductSelector;

