import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";

// Lazy initialization of Razorpay
let razorpay = null;

const getRazorpayInstance = () => {
  if (!razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error(
        "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables"
      );
    }
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

// Create Razorpay order
export const createRazorpayOrder = async (req, res) => {
  try {
    const razorpayInstance = getRazorpayInstance();
    const { amount, currency = "INR" } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: `receipt_${Date.now()}`,
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    res.status(500).json({
      message: "Failed to create payment order",
      error: err.message,
    });
  }
};

// Verify Razorpay payment and create order
export const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderData } =
      req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        message: "Payment verification data is missing",
      });
    }

    // Verify the payment signature
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({
        message: "Payment verification failed - Invalid signature",
      });
    }

    // Create order in database
    const order = await Order.create({
      ...orderData,
      user: req.user._id,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      status: "processing",
    });

    await order.populate("items.product");

    // Update user's total orders and total spend
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        totalOrders: 1,
        totalSpend: order.total,
      },
    });

    res.status(201).json({
      message: "Payment verified and order created successfully",
      order,
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({
      message: "Failed to verify payment",
      error: err.message,
    });
  }
};

// Create order (for COD)
export const createOrder = async (req, res) => {
  try {
    const order = await Order.create({
      ...req.body,
      user: req.user._id,
      status: "pending",
    });

    await order.populate("items.product");

    // Update user's total orders and total spend
    await User.findByIdAndUpdate(req.user._id, {
      $inc: {
        totalOrders: 1,
        totalSpend: order.total,
      },
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({
      message: "Failed to create order",
      error: err.message,
    });
  }
};

// Get user's orders with pagination, search, and status filtering
export const getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // 10 orders per page
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || null; // Optional status filter (can be comma-separated)

    // Build match stage for aggregation
    const matchStage = { user: req.user._id };

    // Filter by status if provided (support multiple statuses)
    if (status && status !== "all") {
      // Check if status is comma-separated (multiple statuses)
      if (status.includes(",")) {
        const statuses = status
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (statuses.length > 0) {
          matchStage.status = { $in: statuses };
        }
      } else {
        matchStage.status = status;
      }
    }

    // Build aggregation pipeline
    const pipeline = [
      // Match by user and status
      { $match: matchStage },
      // Lookup products for items
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
    ];

    // Add search filter if provided
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const searchTerm = search.trim();

      // Check if search term is a valid ObjectId (24 hex characters)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(searchTerm);

      // Build search conditions for direct fields
      const directSearchConditions = [
        { razorpayOrderId: searchRegex },
        { razorpayPaymentId: searchRegex },
        { "customer.firstName": searchRegex },
        { "customer.lastName": searchRegex },
        { "customer.email": searchRegex },
      ];

      // If search term looks like an ObjectId, also search by _id
      if (isObjectId) {
        try {
          directSearchConditions.push({
            _id: new mongoose.Types.ObjectId(searchTerm),
          });
        } catch (err) {
          // If ObjectId conversion fails, ignore it
        }
      }

      // Add $match stage for direct field search after lookup
      pipeline.push({
        $match: {
          $or: [
            ...directSearchConditions,
            // Search in product titles array
            {
              "productDetails.title": searchRegex,
            },
          ],
        },
      });
    }

    // Add sorting
    pipeline.push({ $sort: { createdAt: -1 } });

    // Get total count (clone pipeline and add count)
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Order.aggregate(countPipeline);
    const totalOrders = countResult[0]?.total || 0;

    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: limit });

    // Execute aggregation
    let orders = await Order.aggregate(pipeline);

    // Populate product details manually since aggregation doesn't populate
    orders = await Order.populate(orders, {
      path: "items.product",
      model: "Product",
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalOrders / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        ordersPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a specific order
export const getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    }).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all orders (Admin only)
export const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50; // 50 orders per page
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status || null; // Optional status filter

    // Build query with search filter and status filter
    let query = {};

    // Filter by status if provided
    if (status && status !== "all") {
      query.status = status;
    }

    // Add search filter
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const searchTerm = search.trim();

      // Check if search term is a valid ObjectId (24 hex characters)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(searchTerm);

      query.$or = [
        { razorpayOrderId: searchRegex },
        { "customer.firstName": searchRegex },
        { "customer.lastName": searchRegex },
        { "customer.email": searchRegex },
        { "customer.phone": searchRegex },
      ];

      // If search term looks like an ObjectId, also search by _id
      if (isObjectId) {
        try {
          query.$or.push({ _id: new mongoose.Types.ObjectId(searchTerm) });
        } catch (err) {
          // If ObjectId conversion fails, ignore it
        }
      }
    }

    // Get total count of orders matching search and status
    const totalOrders = await Order.countDocuments(query);

    // Get paginated orders
    const orders = await Order.find(query)
      .populate("items.product")
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalOrders / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalOrders,
        ordersPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a specific order (Admin only)
export const getOrderAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("items.product")
      .populate("user", "firstName lastName email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update order status (Admin only)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    ).populate("items.product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({
      message: "Order status updated successfully",
      order,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get dashboard statistics (Admin only)
export const getDashboardStats = async (req, res) => {
  try {
    // Get total count of all orders
    const totalOrders = await Order.countDocuments({});

    // Calculate total revenue from all non-cancelled orders
    const revenueResult = await Order.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    res.json({
      totalOrders,
      totalRevenue,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ message: err.message });
  }
};
