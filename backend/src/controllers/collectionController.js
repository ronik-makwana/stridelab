import mongoose from "mongoose";
import Collection from "../models/collectionModel.js";
import Product from "../models/productModel.js";
import {
  createCollectionSchema,
  updateCollectionSchema,
} from "../validations/collectionValidation.js";

// Helper function to escape special regex characters
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Helper function to convert a rule to MongoDB query condition
const buildRuleCondition = (rule) => {
  const { field, operator, value } = rule;
  let condition = {};

  // Convert value to appropriate type based on field
  const isNumericField = ["price", "discountedPrice"].includes(field);
  const isArrayField = ["tags"].includes(field);
  const numericValue = isNumericField ? parseFloat(value) : null;

  switch (operator) {
    case "eq":
      if (isNumericField) {
        condition[field] = numericValue;
      } else if (isArrayField) {
        condition[field] = value;
      } else {
        condition[field] = value;
      }
      break;
    case "not_eq":
      if (isNumericField) {
        condition[field] = { $ne: numericValue };
      } else if (isArrayField) {
        condition[field] = { $nin: [value] };
      } else {
        condition[field] = { $ne: value };
      }
      break;
    case "greater_than":
      condition[field] = { $gt: numericValue };
      break;
    case "greater_than_or_equal":
      condition[field] = { $gte: numericValue };
      break;
    case "less_than":
      condition[field] = { $lt: numericValue };
      break;
    case "less_than_or_equal":
      condition[field] = { $lte: numericValue };
      break;
    case "contains":
      if (isArrayField) {
        condition[field] = { $regex: escapeRegex(value), $options: "i" };
      } else {
        condition[field] = { $regex: escapeRegex(value), $options: "i" };
      }
      break;
    case "does_not_contain":
      if (isArrayField) {
        condition[field] = {
          $not: { $regex: escapeRegex(value), $options: "i" },
        };
      } else {
        condition[field] = {
          $not: { $regex: escapeRegex(value), $options: "i" },
        };
      }
      break;
    case "starts_with":
      if (isArrayField) {
        condition[field] = {
          $regex: `^${escapeRegex(value)}`,
          $options: "i",
        };
      } else {
        condition[field] = {
          $regex: `^${escapeRegex(value)}`,
          $options: "i",
        };
      }
      break;
    case "ends_with":
      if (isArrayField) {
        condition[field] = {
          $regex: `${escapeRegex(value)}$`,
          $options: "i",
        };
      } else {
        condition[field] = {
          $regex: `${escapeRegex(value)}$`,
          $options: "i",
        };
      }
      break;
    case "contains_item":
      // For array fields, check if array contains the value
      condition[field] = value;
      break;
    case "does_not_contain_item":
      // For array fields, check that array does not contain the value
      condition[field] = { $nin: [value] };
      break;
    default:
      break;
  }

  return condition;
};

// Get all collections
export const getCollections = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50; // 50 collections per page
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const type = req.query.type || null; // Optional type filter

    // Build query with search filter and type filter
    let query = {};

    // Filter by type if provided
    if (type) {
      query.type = type;
    }

    // Add search filter
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    // Get total count of collections matching search
    const totalCollections = await Collection.countDocuments(query);

    // Get paginated collections
    const collections = await Collection.find(query)
      .populate("products")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate product counts for automatic collections
    const collectionsWithCounts = await Promise.all(
      collections.map(async (collection) => {
        const collectionObj = collection.toObject();
        
        if (collection.type === "automatic") {
          // Build product filter query from rules
          let productFilter = {};
          
          if (collection.rules && collection.rules.length > 0) {
            const ruleConditions = collection.rules
              .map((rule) => buildRuleCondition(rule))
              .filter((condition) => Object.keys(condition).length > 0);

            if (ruleConditions.length > 0) {
              // Apply ruleMatchType: "all" means $and, "any" means $or
              if (collection.ruleMatchType === "any") {
                productFilter.$or = ruleConditions;
              } else {
                // Default to "all" - all rules must match
                productFilter.$and = ruleConditions;
              }
            } else {
              // If no valid rules, return 0
              collectionObj.productCount = 0;
              return collectionObj;
            }
          } else {
            // Automatic collection with no rules - return 0
            collectionObj.productCount = 0;
            return collectionObj;
          }

          // Count products matching the filter
          const productCount = await Product.countDocuments(productFilter);
          collectionObj.productCount = productCount;
        } else {
          // For manual collections, use the products array length
          collectionObj.productCount = collection.products?.length || 0;
        }

        return collectionObj;
      })
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCollections / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      collections: collectionsWithCounts,
      pagination: {
        currentPage: page,
        totalPages,
        totalCollections,
        collectionsPerPage: limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single collection by ID or slug
export const getCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = 50; // 50 products per page
    const skip = (page - 1) * limit;

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

    // Build query conditionally - only include _id if it's a valid ObjectId
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { slug: id }] }
      : { slug: id };

    const collection = await Collection.findOne(query).select(
      "title description image type slug createdAt updatedAt products rules ruleMatchType"
    );

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    // Build product filter query based on collection type
    let productFilter = {};

    if (collection.type === "automatic") {
      // For automatic collections, build query from rules
      if (collection.rules && collection.rules.length > 0) {
        const ruleConditions = collection.rules
          .map((rule) => buildRuleCondition(rule))
          .filter((condition) => Object.keys(condition).length > 0);

        if (ruleConditions.length > 0) {
          // Apply ruleMatchType: "all" means $and, "any" means $or
          if (collection.ruleMatchType === "any") {
            productFilter.$or = ruleConditions;
          } else {
            // Default to "all" - all rules must match
            productFilter.$and = ruleConditions;
          }
        } else {
          // If no valid rules, return empty result
          productFilter._id = { $in: [] };
        }
      } else {
        // Automatic collection with no rules - return empty result
        productFilter._id = { $in: [] };
      }
    } else {
      // For manual collections, use the products array
      productFilter = {
        _id: { $in: collection.products || [] },
      };
    }

    // Array to hold all filter conditions (user filters)
    const filterConditions = [];

    // Price range filter - static ranges
    // Use effective price (discountedPrice if exists, otherwise price)
    if (priceRanges.length > 0) {
      const priceConditions = [];
      priceRanges.forEach((range) => {
        switch (range) {
          case "50-100":
            priceConditions.push({
              $expr: {
                $and: [
                  {
                    $gte: [{ $ifNull: ["$discountedPrice", "$price"] }, 50],
                  },
                  {
                    $lte: [{ $ifNull: ["$discountedPrice", "$price"] }, 100],
                  },
                ],
              },
            });
            break;
          case "101-150":
            priceConditions.push({
              $expr: {
                $and: [
                  {
                    $gte: [{ $ifNull: ["$discountedPrice", "$price"] }, 101],
                  },
                  {
                    $lte: [{ $ifNull: ["$discountedPrice", "$price"] }, 150],
                  },
                ],
              },
            });
            break;
          case "151-200":
            priceConditions.push({
              $expr: {
                $and: [
                  {
                    $gte: [{ $ifNull: ["$discountedPrice", "$price"] }, 151],
                  },
                  {
                    $lte: [{ $ifNull: ["$discountedPrice", "$price"] }, 200],
                  },
                ],
              },
            });
            break;
          case "201-250":
            priceConditions.push({
              $expr: {
                $and: [
                  {
                    $gte: [{ $ifNull: ["$discountedPrice", "$price"] }, 201],
                  },
                  {
                    $lte: [{ $ifNull: ["$discountedPrice", "$price"] }, 250],
                  },
                ],
              },
            });
            break;
          case "251-300":
            priceConditions.push({
              $expr: {
                $and: [
                  {
                    $gte: [{ $ifNull: ["$discountedPrice", "$price"] }, 251],
                  },
                  {
                    $lte: [{ $ifNull: ["$discountedPrice", "$price"] }, 300],
                  },
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

    // Combine all filter conditions with $and
    // If productFilter already has $and or $or from rules, we need to combine properly
    if (filterConditions.length > 0) {
      if (productFilter.$and) {
        // If $and already exists (from automatic rules with "all" match type), append user filters
        productFilter.$and = [...productFilter.$and, ...filterConditions];
      } else if (productFilter.$or) {
        // If $or exists (from automatic rules with "any" match type), wrap both in $and
        productFilter = {
          $and: [{ $or: productFilter.$or }, ...filterConditions],
        };
      } else {
        // No existing $and or $or, just add filterConditions
        productFilter.$and = filterConditions;
      }
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
        sortQuery = { createdAt: -1 };
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

    // Build pagination object
    const pagination = {
      currentPage: page,
      totalPages,
      totalProducts,
      productsPerPage: limit,
      hasNextPage,
      hasPrevPage,
    };

    // Build response object with conditional product field name
    const response = {
      _id: collection._id,
      title: collection.title,
      description: collection.description,
      image: collection.image,
      type: collection.type,
      slug: collection.slug,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
      rules: collection.rules || [],
      ruleMatchType: collection.ruleMatchType || "all",
    };

    // Add products with conditional field name based on collection type, including pagination
    if (collection.type === "manual") {
      response.manualProducts = {
        products: products,
        pagination: pagination,
      };
    } else if (collection.type === "automatic") {
      response.automaticProducts = {
        products: products,
        pagination: pagination,
      };
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create collection
export const createCollection = async (req, res) => {
  try {
    const parsedBody = createCollectionSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parsedBody.error.flatten().fieldErrors,
      });
    }

    const collectionData = parsedBody.data;

    // Check if collection with same title exists
    const existingCollection = await Collection.findOne({
      title: collectionData.title,
    });

    if (existingCollection) {
      return res.status(400).json({
        message: "Collection with this title already exists",
      });
    }

    const collection = await Collection.create(collectionData);

    // Sync products: add collection to products' collections arrays
    if (collectionData.products && collectionData.products.length > 0) {
      await Product.updateMany(
        { _id: { $in: collectionData.products } },
        { $addToSet: { collections: collection._id } }
      );
    }

    res.status(201).json(collection);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Collection with this slug already exists",
      });
    }
    res.status(500).json({ message: err.message });
  }
};

// Update collection
export const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const parsedBody = updateCollectionSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: parsedBody.error.flatten().fieldErrors,
      });
    }

    const collection = await Collection.findById(id);

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    // If title is being updated, check for duplicates
    if (parsedBody.data.title && parsedBody.data.title !== collection.title) {
      const existingCollection = await Collection.findOne({
        title: parsedBody.data.title,
        _id: { $ne: id },
      });

      if (existingCollection) {
        return res.status(400).json({
          message: "Collection with this title already exists",
        });
      }
    }

    // Handle products synchronization (bidirectional relationship)
    if (parsedBody.data.products !== undefined) {
      const oldProductIds = (collection.products || []).map((id) =>
        id.toString()
      );
      const newProductIds = (
        Array.isArray(parsedBody.data.products) ? parsedBody.data.products : []
      ).map((id) => id.toString());

      // Find products that were removed (in old but not in new)
      const removedProductIds = oldProductIds.filter(
        (id) => !newProductIds.includes(id)
      );

      // Find products that were added (in new but not in old)
      const addedProductIds = newProductIds.filter(
        (id) => !oldProductIds.includes(id)
      );

      // Remove collection from products that were removed
      if (removedProductIds.length > 0) {
        await Product.updateMany(
          { _id: { $in: removedProductIds } },
          { $pull: { collections: id } }
        );
      }

      // Add collection to products that were added
      if (addedProductIds.length > 0) {
        await Product.updateMany(
          { _id: { $in: addedProductIds } },
          { $addToSet: { collections: id } }
        );
      }
    }

    const updatedCollection = await Collection.findByIdAndUpdate(
      id,
      parsedBody.data,
      { new: true, runValidators: true }
    ).populate("products");

    res.json(updatedCollection);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Collection with this slug already exists",
      });
    }
    res.status(500).json({ message: err.message });
  }
};

// Delete collection
export const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findById(id);

    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    // Remove collection from all products' collections arrays
    if (collection.products && collection.products.length > 0) {
      await Product.updateMany(
        { _id: { $in: collection.products } },
        { $pull: { collections: id } }
      );
    }

    await Collection.findByIdAndDelete(id);

    res.json({ message: "Collection deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
