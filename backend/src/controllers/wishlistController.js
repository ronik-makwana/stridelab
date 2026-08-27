import Wishlist from "../models/wishlistModel.js";
import Product from "../models/productModel.js";

// Get user's wishlist
export const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    // If wishlist doesn't exist, create one
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, items: [] });
    }

    // Extract products from items array
    const products = wishlist.items.map((item) => item.product);
    res.json({ wishlist: products });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add product to wishlist
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find or create wishlist for user
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, items: [] });
    }

    // Check if product is already in wishlist
    const existingItem = wishlist.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    // Add product to wishlist
    wishlist.items.push({ product: productId });
    await wishlist.save();

    // Populate and return updated wishlist
    await wishlist.populate("items.product");
    const products = wishlist.items.map((item) => item.product);
    res.json({
      message: "Product added to wishlist",
      wishlist: products,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove product from wishlist
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    // Check if product is in wishlist
    const itemIndex = wishlist.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(400).json({ message: "Product not in wishlist" });
    }

    // Remove product from wishlist
    wishlist.items.splice(itemIndex, 1);
    await wishlist.save();

    // Populate and return updated wishlist
    await wishlist.populate("items.product");
    const products = wishlist.items.map((item) => item.product);
    res.json({
      message: "Product removed from wishlist",
      wishlist: products,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Check if product is in wishlist
export const checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.json({ isInWishlist: false });
    }

    const isInWishlist = wishlist.items.some(
      (item) => item.product.toString() === productId
    );

    res.json({ isInWishlist });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
