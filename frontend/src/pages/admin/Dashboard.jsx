import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineCube,
  HiOutlineFolder,
  HiOutlineClipboardDocument,
  HiOutlineCurrencyDollar,
  HiOutlinePhoto,
} from "react-icons/hi2";
import { getProducts } from "../../services/productApi.js";
import { getCollections } from "../../services/collectionApi.js";
import { getDashboardStats } from "../../services/orderApi.js";

const Dashboard = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsResponse, collectionsResponse, statsResponse] =
        await Promise.all([
          getProducts(),
          getCollections(1), // Get all collections (manual and automatic)
          getDashboardStats(),
        ]);

      // Handle products response - can be array or object with products property
      const productsData = productsResponse.data;
      const productsList = Array.isArray(productsData)
        ? productsData
        : productsData?.products || [];
      setProducts(productsList);

      // Handle collections response
      const collectionsData = collectionsResponse.data;
      setCollections(collectionsData?.collections || []);

      // Handle dashboard stats response
      const statsData = statsResponse.data;
      setTotalOrders(statsData?.totalOrders || 0);
      setTotalRevenue(statsData?.totalRevenue || 0);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get recent products (last 5, sorted by createdAt)
  const recentProducts = [...products]
    .filter((p) => p.createdAt) // Filter out products without createdAt
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    })
    .slice(0, 5);

  // Get recent collections (last 5, sorted by createdAt)
  const recentCollections = [...collections]
    .filter((c) => c.createdAt) // Filter out collections without createdAt
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    })
    .slice(0, 5);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get product count for a collection (handles both manual and automatic)
  const getProductCount = (collection) => {
    // Backend now provides productCount for all collections
    if (collection.productCount !== undefined) {
      return collection.productCount;
    }
    // Fallback for backward compatibility
    if (collection.type === "automatic") {
      return (
        collection.automaticProducts?.pagination?.totalProducts ??
        collection.automaticProducts?.products?.length ??
        0
      );
    } else {
      return collection.products?.length ?? 0;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-slate-900 border-r-transparent"></div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome to the admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">
                Total Products
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {products.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <HiOutlineCube className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Collections</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {collections.length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <HiOutlineFolder className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Orders</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {totalOrders}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <HiOutlineClipboardDocument className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Revenue</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                $
                {totalRevenue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <HiOutlineCurrencyDollar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Products */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Products
            </h2>
            <button
              onClick={() => navigate("/admin/products")}
              className="text-sm text-slate-600 hover:text-slate-900 font-medium"
            >
              View all
            </button>
          </div>
          {recentProducts.length === 0 ? (
            <p className="text-slate-500 text-sm">No products yet</p>
          ) : (
            <div className="space-y-3">
              {recentProducts.map((product) => (
                <div
                  key={product._id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() =>
                    navigate(`/admin/products/edit/${product._id}`)
                  }
                >
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                      <HiOutlinePhoto className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {product.title}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatDate(product.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">
                      ${product.discountedPrice || product.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Collections */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Collections
            </h2>
            <button
              onClick={() => navigate("/admin/collections")}
              className="text-sm text-slate-600 hover:text-slate-900 font-medium"
            >
              View all
            </button>
          </div>
          {recentCollections.length === 0 ? (
            <p className="text-slate-500 text-sm">No collections yet</p>
          ) : (
            <div className="space-y-3">
              {recentCollections.map((collection) => (
                <div
                  key={collection._id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() =>
                    navigate(`/admin/collections/edit/${collection._id}`)
                  }
                >
                  {collection.image ? (
                    <img
                      src={collection.image}
                      alt={collection.title}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                      <HiOutlinePhoto className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {collection.title}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatDate(collection.createdAt)} •{" "}
                      {getProductCount(collection)} product
                      {getProductCount(collection) !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      collection.type === "automatic"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {collection.type || "manual"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
