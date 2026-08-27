import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import Collection from "../models/collectionModel.js";
import Review from "../models/reviewModel.js";
import Cart from "../models/cartModel.js";
import Wishlist from "../models/wishlistModel.js";
import mongoose from "mongoose";

// Get comprehensive analytics (Admin only)
export const getAnalytics = async (req, res) => {
  try {
    const { period = "30" } = req.query; // days: 7, 30, 90, 365, all
    let dateFilter = {};

    if (period !== "all") {
      const days = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      dateFilter.createdAt = { $gte: startDate };
    }

    // 1. Revenue Analytics
    const revenueData = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: "$total" },
        },
      },
    ]);

    const revenueStats = revenueData[0] || {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
    };

    // 2. Revenue by Date (for chart)
    const revenueByDate = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 3. Orders by Status
    const ordersByStatus = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // 4. Top Selling Products
    const topProducts = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          productId: "$_id",
          productTitle: "$product.title",
          productImage: { $arrayElemAt: ["$product.images", 0] },
          totalSold: 1,
          totalRevenue: 1,
        },
      },
    ]);

    // 5. Revenue by Category
    const revenueByCategory = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // 6. Customer Analytics
    const totalCustomers = await User.countDocuments({});
    const newCustomers = await User.countDocuments(dateFilter);
    const customersWithOrders = await Order.distinct("user").then(
      (users) => users.length
    );

    // 7. Product Analytics
    const productStats = await Product.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          newProducts: { $sum: 1 },
        },
      },
    ]);

    const totalProducts = await Product.countDocuments({});
    const totalCollections = await Collection.countDocuments({});

    // 8. Average Rating
    const ratingStats = await Review.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    // 9. Cart and Wishlist Stats
    const totalCarts = await Cart.countDocuments({});
    const totalWishlists = await Wishlist.countDocuments({});

    // 10. Monthly Revenue Comparison (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // 11. Top Customers (by spending)
    const topCustomers = await Order.aggregate([
      { $match: { ...dateFilter, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: "$user",
          totalSpent: { $sum: "$total" },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$_id",
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          email: "$user.email",
          totalSpent: 1,
          orderCount: 1,
        },
      },
    ]);

    res.json({
      overview: {
        totalRevenue: revenueStats.totalRevenue,
        totalOrders: revenueStats.totalOrders,
        averageOrderValue: revenueStats.averageOrderValue,
        totalCustomers,
        customersWithOrders,
        totalProducts,
        totalCollections,
        averageRating: ratingStats[0]?.averageRating || 0,
        totalReviews: ratingStats[0]?.totalReviews || 0,
        totalCarts,
        totalWishlists,
      },
      revenueByDate,
      ordersByStatus,
      topProducts,
      revenueByCategory,
      monthlyRevenue,
      topCustomers,
      period: parseInt(period),
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: err.message });
  }
};

