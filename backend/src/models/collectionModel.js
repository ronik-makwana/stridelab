import mongoose from "mongoose";
import slugify from "slugify";

const ConditionSchema = new mongoose.Schema({
  field: { type: String, required: true }, // title, tags, price, category, brand
  operator: { type: String, required: true }, // equals, contains, greater_than
  value: { type: String, required: true },
});

const CollectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    type: {
      type: String,
      enum: ["manual", "automatic"],
      default: "manual",
    },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    rules: [ConditionSchema],
    ruleMatchType: {
      type: String,
      enum: ["all", "any"],
      default: "all",
    },
    slug: { type: String, unique: true },
  },
  { timestamps: true }
);

// Auto-create slug
CollectionSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model("Collection", CollectionSchema);
