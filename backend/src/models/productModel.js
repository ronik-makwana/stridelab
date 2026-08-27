import mongoose from "mongoose";
import slugify from "slugify";

const ProductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    images: [{ type: String, required: true }], // multiple images
    price: { type: Number, required: true },
    discountedPrice: { type: Number }, // for sale collection
    category: {
      type: String,
      enum: ["men", "women", "kids"],
      required: true,
    },
    brand: { type: String },
    tags: [{ type: String }],
    // Added fields 👇
    colors: [{ type: String }], // e.g. ["black", "white", "red"]
    sizes: [{ type: String }], // e.g. ["6", "7", "8", "9"]
    collections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Collection" }], // multiple collections
    slug: { type: String, unique: true },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Auto-generate slug
ProductSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model("Product", ProductSchema);
