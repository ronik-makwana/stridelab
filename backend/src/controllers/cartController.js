import Cart from "../models/cartModel.js";
import Product from "../models/productModel.js";

// Get user's cart
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.json({ cart: cart.items || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add product to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity, size, color } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check if product with same size and color already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.size === (size || null) &&
        item.color === (color || null)
    );

    if (existingItemIndex !== -1) {
      // Update quantity if item already exists
      cart.items[existingItemIndex].quantity += quantity || 1;
    } else {
      // Add new item to cart
      cart.items.push({
        product: productId,
        quantity: quantity || 1,
        size: size || null,
        color: color || null,
      });
    }

    await cart.save();

    // Populate and return updated cart
    await cart.populate("items.product");
    res.json({
      message: "Product added to cart",
      cart: cart.items,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find the cart item
    const cartItem = cart.items.id(itemId);
    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Update quantity
    cartItem.quantity = quantity;
    await cart.save();

    // Populate and return updated cart
    await cart.populate("items.product");
    res.json({
      message: "Cart item updated",
      cart: cart.items,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove product from cart
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Check if cart item exists
    const cartItem = cart.items.id(itemId);
    if (!cartItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // Remove cart item
    cart.items.pull(itemId);
    await cart.save();

    // Populate and return updated cart
    await cart.populate("items.product");
    res.json({
      message: "Product removed from cart",
      cart: cart.items,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.json({
        message: "Cart cleared",
        cart: [],
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      message: "Cart cleared",
      cart: [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

