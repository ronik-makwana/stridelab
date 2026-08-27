import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePhoto,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi2";
import { getProducts, deleteProduct } from "../../services/productApi.js";
import { getCollections } from "../../services/collectionApi.js";
import { useConfirmModal } from "../../contexts/ConfirmModalContext.jsx";

const Products = () => {
  const navigate = useNavigate();
  const { showConfirm } = useConfirmModal();
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedCollection, setSelectedCollection] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    productsPerPage: 50,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedCollection]);

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategory, selectedCollection, currentPage]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const filters = {
        page: currentPage,
      };

      // Only add filters if they have values (not "all" or empty)
      if (selectedCategory && selectedCategory !== "all") {
        filters.category = selectedCategory;
      }

      if (selectedCollection && selectedCollection !== "all") {
        filters.collection = selectedCollection;
      }

      if (searchTerm && searchTerm.trim()) {
        filters.search = searchTerm.trim();
      }

      const response = await getProducts(filters);
      // Handle both old format (array) and new format (object with products and pagination)
      if (Array.isArray(response.data)) {
        setProducts(response.data);
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalProducts: response.data.length,
          productsPerPage: 50,
          hasNextPage: false,
          hasPrevPage: false,
        });
      } else {
        setProducts(response.data.products || []);
        setPagination(response.data.pagination || pagination);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      // Only fetch manual collections (exclude automatic collections)
      const response = await getCollections(1, "", "manual");
      const data = response.data;
      setCollections(data.collections || []);
    } catch (error) {
      console.error("Error fetching collections:", error);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      message: "Are you sure you want to delete this product?",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
    });
    if (confirmed) {
      try {
        await deleteProduct(id);
        // Refetch products to update the list
        fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert(error.message || "Failed to delete product");
      }
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const getCollectionCount = (productCollections) => {
    if (!productCollections || productCollections.length === 0) {
      return "No collection";
    }
    const count = productCollections.length;
    return count === 1 ? "1 collection" : `${count} collections`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading products...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-slate-600 mt-1">Manage your product catalog</p>
        </div>
        <button
          onClick={() => navigate("/admin/products/create")}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          Add Product
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4 gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="kids">Kids</option>
            </select>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            >
              <option value="all">All Collections</option>
              {collections.map((collection) => (
                <option key={collection._id} value={collection._id}>
                  {collection.title}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th
                    className="text-left py-3 px-4 font-semibold text-slate-900"
                    style={{ maxWidth: "300px" }}
                  >
                    Product
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Collection
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Price
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">
                    Category
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="text-center py-12 text-slate-500"
                    >
                      {loading
                        ? "Loading products..."
                        : searchTerm ||
                            selectedCategory !== "all" ||
                            selectedCollection !== "all"
                          ? "No products match your search criteria."
                          : "No products found. Add your first product to get started."}
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr
                      key={product._id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="py-3 px-4" style={{ maxWidth: "300px" }}>
                        <div className="flex items-center gap-3">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              className="w-12 h-12 object-cover rounded-lg shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center shrink-0">
                              <HiOutlinePhoto className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                          <div className="font-medium text-slate-900 truncate">
                            {product.title}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {getCollectionCount(product.collections)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {formatPrice(
                              product.discountedPrice || product.price
                            )}
                          </span>
                          {product.discountedPrice && (
                            <span className="text-sm text-slate-500 line-through">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 capitalize">
                          {product.category || "N/A"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              navigate(`/admin/products/edit/${product._id}`)
                            }
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <HiOutlinePencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <HiOutlineTrash className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6">
              <div className="text-sm text-slate-600">
                Showing{" "}
                <span className="font-medium text-slate-900">
                  {(currentPage - 1) * pagination.productsPerPage + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-slate-900">
                  {Math.min(
                    currentPage * pagination.productsPerPage,
                    pagination.totalProducts
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-900">
                  {pagination.totalProducts}
                </span>{" "}
                products
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <HiChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: pagination.totalPages },
                    (_, i) => i + 1
                  )
                    .filter((page) => {
                      // Show first page, last page, current page, and pages around current
                      if (page === 1) return true;
                      if (page === pagination.totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, index, array) => {
                      // Add ellipsis if there's a gap
                      const showEllipsisBefore =
                        index > 0 && page - array[index - 1] > 1;
                      return (
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsisBefore && (
                            <span className="px-2 text-slate-500">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            disabled={loading}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              currentPage === page
                                ? "bg-slate-900 text-white"
                                : "text-slate-700 bg-white border border-slate-300 hover:bg-slate-50"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <HiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
