import mongoose from "mongoose";
import Product from "../models/productModel.js";
import Collection from "../models/collectionModel.js";
import Review from "../models/reviewModel.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../validations/productValidation.js";
import { createReviewSchema } from "../validations/reviewValidation.js";

// Get all products
export const getProducts = async (req, res) => {
  try {
    const { category, collection, search, page } = req.query;
    const currentPage = parseInt(page) || 1;
    const limit = 50; // 50 products per page
    const skip = (currentPage - 1) * limit;

    // Build filter query
    const filterConditions = [];

    // Filter by category if provided
    if (category && category !== "all") {
      filterConditions.push({ category: category.toLowerCase() });
    }

    // Filter by collection if provided
    // collections is an array field, MongoDB matches if ObjectId exists in the array
    if (collection && collection !== "all") {
      try {
        // Ensure collection ID is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(collection)) {
          // Use $in for array field matching (more reliable)
          filterConditions.push({
            collections: { $in: [new mongoose.Types.ObjectId(collection)] },
          });
        } else {
          // If not valid ObjectId, log and skip collection filter
          console.warn(`Invalid collection ID: ${collection}`);
        }
      } catch (error) {
        console.error("Error processing collection filter:", error);
      }
    }

    // Filter by search term if provided
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filterConditions.push({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { brand: searchRegex },
          { tags: { $in: [searchRegex] } },
        ],
      });
    }

    // Build final filter - use $and if multiple conditions, otherwise use the single condition
    const filter =
      filterConditions.length > 1
        ? { $and: filterConditions }
        : filterConditions.length === 1
        ? filterConditions[0]
        : {};

    // Get total count of filtered products
    const totalProducts = await Product.countDocuments(filter);

    // Get paginated products
    const products = await Product.find(filter)
      .populate("collections", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalProducts / limit);
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    // Build pagination object
    const pagination = {
      currentPage,
      totalPages,
      totalProducts,
      productsPerPage: limit,
      hasNextPage,
      hasPrevPage,
    };

    res.json({
      products,
      pagination,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Search products
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = 50; // 50 products per page
    const skip = (page - 1) * limit;

    if (!q || q.trim() === "") {
      return res.json({
        products: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalProducts: 0,
          productsPerPage: limit,
          hasNextPage: false,
          hasPrevPage: false,
        },
      });
    }

    // Helper function to parse array query parameters
    const parseArrayParam = (param) => {
      if (!param) return [];
      if (Array.isArray(param)) return param;
      if (typeof param === "string") {
        // Handle comma-separated values or single value
        return param.split(",").filter(Boolean);
      }
      return [param];
    };

    // Parse filter parameters
    const priceRanges = parseArrayParam(req.query.priceRanges);
    const discountRanges = parseArrayParam(req.query.discountRanges);
    const colors = parseArrayParam(req.query.colors);
    const sizes = parseArrayParam(req.query.sizes);
    const sortBy = req.query.sortBy || "default";

    const searchQuery = q.trim();
    const regex = new RegExp(searchQuery, "i");

    // Build base search filter
    const searchFilter = {
      $or: [{ title: regex }, { tags: { $in: [regex] } }],
    };

    // Array to hold all filter conditions
    const filterConditions = [];

    // Price range filter - static ranges
    if (priceRanges.length > 0) {
      const priceConditions = [];
      priceRanges.forEach((range) => {
        switch (range) {
          case "50-100":
            priceConditions.push({
              $expr: {
                $and: [
                  { $gte: [{ $ifNull: ["$discountedPrice", "$price"] }, 50] },
                  { $lte: [{ $ifNull: ["$discountedPrice", "$price"] }, 100] },
                ],
              },
            });
            break;
          case "101-150":
            priceConditions.push({
              $expr: {
                $and: [
                  { $gte: [{ $ifNull: ["$discountedPrice", "$price"] }, 101] },
                  { $lte: [{ $ifNull: ["$discountedPrice", "$price"] }, 150] },
                ],
              },
            });
            break;
          case "151-200":
            priceConditions.push({
              $expr: {
                $and: [
                  { $gte: [{ $ifNull: ["$discountedPrice", "$price"] }, 151] },
                  { $lte: [{ $ifNull: ["$discountedPrice", "$price"] }, 200] },
                ],
              },
            });
            break;
          case "201-250":
            priceConditions.push({
              $expr: {
                $and: [
                  { $gte: [{ $ifNull: ["$discountedPrice", "$price"] }, 201] },
                  { $lte: [{ $ifNull: ["$discountedPrice", "$price"] }, 250] },
                ],
              },
            });
            break;
          case "251-300":
            priceConditions.push({
              $expr: {
                $and: [
                  { $gte: [{ $ifNull: ["$discountedPrice", "$price"] }, 251] },
                  { $lte: [{ $ifNull: ["$discountedPrice", "$price"] }, 300] },
                ],
              },
            });
            break;
          case "300+":
            priceConditions.push({
              $expr: {
                $gte: [{ $ifNull: ["$discountedPrice", "$price"] }, 300],
              },
            });
            break;
        }
      });
      if (priceConditions.length > 0) {
        filterConditions.push({ $or: priceConditions });
      }
    }

    // Discount range filter
    if (discountRanges.length > 0) {
      const discountConditions = [];
      discountRanges.forEach((range) => {
        switch (range) {
          case "less-than-10":
            discountConditions.push({
              $expr: {
                $and: [
                  { $gt: ["$price", 0] },
                  { $gt: ["$discountedPrice", 0] },
                  {
                    $lt: [
                      {
                        $multiply: [
                          {
                            $divide: [
                              { $subtract: ["$price", "$discountedPrice"] },
                              "$price",
                            ],
                          },
                          100,
                        ],
                      },
                      10,
                    ],
                  },
                ],
              },
            });
            break;
          case "10+":
            discountConditions.push({
              $expr: {
                $and: [
                  { $gt: ["$price", 0] },
                  { $gt: ["$discountedPrice", 0] },
                  {
                    $gte: [
                      {
                        $multiply: [
                          {
                            $divide: [
                              { $subtract: ["$price", "$discountedPrice"] },
                              "$price",
                            ],
                          },
                          100,
                        ],
                      },
                      10,
                    ],
                  },
                ],
              },
            });
            break;
          case "20+":
            discountConditions.push({
              $expr: {
                $and: [
                  { $gt: ["$price", 0] },
                  { $gt: ["$discountedPrice", 0] },
                  {
                    $gte: [
                      {
                        $multiply: [
                          {
                            $divide: [
                              { $subtract: ["$price", "$discountedPrice"] },
                              "$price",
                            ],
                          },
                          100,
                        ],
                      },
                      20,
                    ],
                  },
                ],
              },
            });
            break;
          case "30+":
            discountConditions.push({
              $expr: {
                $and: [
                  { $gt: ["$price", 0] },
                  { $gt: ["$discountedPrice", 0] },
                  {
                    $gte: [
                      {
                        $multiply: [
                          {
                            $divide: [
                              { $subtract: ["$price", "$discountedPrice"] },
                              "$price",
                            ],
                          },
                          100,
                        ],
                      },
                      30,
                    ],
                  },
                ],
              },
            });
            break;
          case "40+":
            discountConditions.push({
              $expr: {
                $and: [
                  { $gt: ["$price", 0] },
                  { $gt: ["$discountedPrice", 0] },
                  {
                    $gte: [
                      {
                        $multiply: [
                          {
                            $divide: [
                              { $subtract: ["$price", "$discountedPrice"] },
                              "$price",
                            ],
                          },
                          100,
                        ],
                      },
                      40,
                    ],
                  },
                ],
              },
            });
            break;
          case "50+":
            discountConditions.push({
              $expr: {
                $and: [
                  { $gt: ["$price", 0] },
                  { $gt: ["$discountedPrice", 0] },
                  {
                    $gte: [
                      {
                        $multiply: [
                          {
                            $divide: [
                              { $subtract: ["$price", "$discountedPrice"] },
                              "$price",
                            ],
                          },
                          100,
                        ],
                      },
                      50,
                    ],
                  },
                ],
              },
            });
            break;
        }
      });
      if (discountConditions.length > 0) {
        filterConditions.push({ $or: discountConditions });
      }
    }

    // Color filter
    if (colors.length > 0) {
      filterConditions.push({ colors: { $in: colors } });
    }

    // Size filter
    if (sizes.length > 0) {
      filterConditions.push({ sizes: { $in: sizes } });
    }

    // Combine search filter with other filters
    const productFilter = { ...searchFilter };
    if (filterConditions.length > 0) {
      productFilter.$and = filterConditions;
    }

    // Build sort query
    let sortQuery = {};
    switch (sortBy) {
      case "price-low":
        sortQuery = { discountedPrice: 1, price: 1 };
        break;
      case "price-high":
        sortQuery = { discountedPrice: -1, price: -1 };
        break;
      case "name-asc":
        sortQuery = { title: 1 };
        break;
      case "name-desc":
        sortQuery = { title: -1 };
        break;
      default:
        sortQuery = { rating: -1, reviewCount: -1 };
    }

    // Get total count of filtered products
    const totalProducts = await Product.countDocuments(productFilter);

    // Get filtered and paginated products
    const products = await Product.find(productFilter)
      .populate("collections", "title")
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalProducts / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      products: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        productsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single product by ID or slug
export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Build query conditionally - only include _id if it's a valid ObjectId
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { slug: id }] }
      : { slug: id };

    const product = await Product.findOne(query).populate(
      "collections",
      "title"
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create product
export const createProduct = async (req, res) => {
  try {
    const parsedBody = createProductSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parsedBody.error.flatten().fieldErrors,
      });
    }

    const productData = parsedBody.data;

    // Check if product with same title exists
    const existingProduct = await Product.findOne({
      title: productData.title,
    });

    if (existingProduct) {
      return res.status(400).json({
        message: "Product with this title already exists",
      });
    }

    const product = await Product.create(productData);

    // Sync collections: add product to collections' products arrays
    if (productData.collections && productData.collections.length > 0) {
      await Collection.updateMany(
        { _id: { $in: productData.collections } },
        { $addToSet: { products: product._id } }
      );
    }

    res.status(201).json(product);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Product with this slug already exists",
      });
    }
    res.status(500).json({ message: err.message });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedBody = updateProductSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parsedBody.error.flatten().fieldErrors,
      });
    }

    // Fetch product without populating collections to get raw ObjectIds
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // If title is being updated, check for duplicates
    if (parsedBody.data.title && parsedBody.data.title !== product.title) {
      const existingProduct = await Product.findOne({
        title: parsedBody.data.title,
        _id: { $ne: id },
      });

      if (existingProduct) {
        return res.status(400).json({
          message: "Product with this title already exists",
        });
      }
    }

    // Handle collections synchronization (bidirectional relationship)
    // Always process collections if it's provided (even if empty array)
    if (parsedBody.data.collections !== undefined) {
      const oldCollectionIds = (product.collections || []).map((id) =>
        id.toString()
      );
      const newCollectionIds = (
        Array.isArray(parsedBody.data.collections)
          ? parsedBody.data.collections
          : []
      ).map((id) => id.toString());

      // Find collections that were removed (in old but not in new)
      const removedCollectionIds = oldCollectionIds.filter(
        (id) => !newCollectionIds.includes(id)
      );

      // Find collections that were added (in new but not in old)
      const addedCollectionIds = newCollectionIds.filter(
        (id) => !oldCollectionIds.includes(id)
      );

      // Remove product from collections that were removed
      if (removedCollectionIds.length > 0) {
        await Collection.updateMany(
          { _id: { $in: removedCollectionIds } },
          { $pull: { products: id } }
        );
      }

      // Add product to collections that were added
      if (addedCollectionIds.length > 0) {
        await Collection.updateMany(
          { _id: { $in: addedCollectionIds } },
          { $addToSet: { products: id } }
        );
      }

      // Ensure collections field is explicitly set (even if empty array)
      // This ensures Mongoose updates the field correctly
      if (newCollectionIds.length === 0) {
        parsedBody.data.collections = [];
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      parsedBody.data,
      { new: true, runValidators: true }
    ).populate("collections", "title");

    res.json(updatedProduct);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Product with this slug already exists",
      });
    }
    res.status(500).json({ message: err.message });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Remove product from all collections' products arrays
    if (product.collections && product.collections.length > 0) {
      await Collection.updateMany(
        { _id: { $in: product.collections } },
        { $pull: { products: id } }
      );
    }

    await Product.findByIdAndDelete(id);

    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add review to product
export const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Validate review data
    const parsedBody = createReviewSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parsedBody.error.flatten().fieldErrors,
      });
    }

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product: id,
      user: userId,
    });

    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }

    // Create review
    const review = await Review.create({
      product: id,
      user: userId,
      rating: parsedBody.data.rating,
      comment: parsedBody.data.comment,
      verified: true, // You can implement verification logic later
    });

    // Calculate average rating and update product
    const allReviews = await Review.find({ product: id });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / allReviews.length;

    product.rating = averageRating;
    product.reviewCount = allReviews.length;
    await product.save();

    // Populate user info for response
    await review.populate("user", "firstName lastName email");

    res.status(201).json({
      message: "Review added successfully",
      review,
      averageRating: product.rating,
      totalReviews: product.reviewCount,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }
    res.status(500).json({ message: err.message });
  }
};

// Get reviews for a product
export const getReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { sort = "recent" } = req.query;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Build sort query
    let sortQuery = {};
    if (sort === "recent") {
      sortQuery = { createdAt: -1 };
    } else if (sort === "oldest") {
      sortQuery = { createdAt: 1 };
    } else if (sort === "highest") {
      sortQuery = { rating: -1 };
    } else if (sort === "lowest") {
      sortQuery = { rating: 1 };
    }

    // Get reviews
    const reviews = await Review.find({ product: id })
      .populate("user", "firstName lastName email")
      .sort(sortQuery);

    // Calculate rating distribution
    const allReviews = await Review.find({ product: id });
    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    allReviews.forEach((review) => {
      ratingDistribution[review.rating]++;
    });

    res.json({
      reviews,
      averageRating: product.rating || 0,
      totalReviews: product.reviewCount || 0,
      ratingDistribution,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
