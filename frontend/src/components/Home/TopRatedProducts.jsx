import { useState } from "react";
import { Link } from "react-router-dom";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";

import useCircularItems from "../../hooks/useCircularItems";
import { formatPrice, getDiscountPercent } from "../../utils/productUtils";

const spotlightProducts = [
  {
    name: "Velocity RX-1",
    slug: "velocity-rx-1",
    description:
      "Lightweight knit upper with carbon plate propulsion tuned for uptempo city runs.",
    price: 210,
    discountPrice: 189,
    brand: "StrideLab",
    gender: "men",
    category: "sneakers",
    sizes: ["7", "8", "9", "10", "11"],
    colors: ["black", "infrared", "white"],
    stock: 28,
    heroImage:
      "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=1600&q=80",
  },
  {
    name: "Aero Glide V2",
    slug: "aero-glide-v2",
    description:
      "Adaptive cushioning with breathable mesh for long-distance comfort and pace stability.",
    price: 225,
    discountPrice: 199,
    brand: "StrideLab",
    gender: "women",
    category: "running",
    sizes: ["5", "6", "7", "8", "9"],
    colors: ["storm", "lilac"],
    stock: 36,
    heroImage:
      "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=1600&q=80",
  },
  {
    name: "Metro Shift Low",
    slug: "metro-shift-low",
    description:
      "Premium leather silhouette blending office polish with street-level comfort.",
    price: 185,
    brand: "StrideLab",
    gender: "men",
    category: "formal",
    sizes: ["7", "8", "9", "10", "11", "12"],
    colors: ["espresso", "charcoal"],
    stock: 18,
    heroImage:
      "https://images.unsplash.com/photo-1514996937319-344454492b37?auto=format&fit=crop&w=1600&q=80",
  },
  {
    name: "Nimbus Trail Pro",
    slug: "nimbus-trail-pro",
    description:
      "All-terrain traction with weather-ready overlays for weekend trail explorations.",
    price: 195,
    discountPrice: 175,
    brand: "StrideLab",
    gender: "unisex",
    category: "trail",
    sizes: ["6", "7", "8", "9", "10", "11"],
    colors: ["moss", "ember"],
    stock: 22,
    heroImage:
      "https://images.unsplash.com/photo-1508609349937-5ec4ae374ebf?auto=format&fit=crop&w=1600&q=80",
  },
];

const TopRatedProducts = () => {
  const products = spotlightProducts;
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const visibleSpotlight = useCircularItems(products, spotlightIndex, 3);

  if (!products.length) return null;

  return (
    <section className="w-full bg-white">
      <div className="mx-auto w-full max-w-480 space-y-12 px-6 py-24 sm:px-10 xl:px-16">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-600">
            Spotlight Products
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Top-rated footwear built from our product lab
          </h2>
          <p className="max-w-3xl text-sm text-slate-500">
            Explore hero products drawn from our schema-backed library—each with
            precise metadata for pricing, inventory, gender fit, and available
            sizes.
          </p>
        </div>
        <div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleSpotlight.map((product) => {
              const discountPercent = getDiscountPercent(product);

              return (
                <article
                  key={product.slug}
                  className="group flex flex-col overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="relative h-80 overflow-hidden">
                    <img
                      src={product.heroImage}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    {discountPercent && (
                      <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-600">
                        Save {discountPercent}%
                      </span>
                    )}
                    <span className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-800 backdrop-blur">
                      {product.gender}
                    </span>
                  </div>
                  <div className="space-y-4 px-6 py-6">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                        {product.brand}
                      </p>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {product.name}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {product.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <p className="text-base font-semibold text-slate-900">
                          {product.discountPrice
                            ? formatPrice(product.discountPrice)
                            : formatPrice(product.price)}
                        </p>
                        {product.discountPrice && (
                          <p className="text-xs text-slate-400 line-through">
                            {formatPrice(product.price)}
                          </p>
                        )}
                      </div>
                      <Link
                        to={`/products/${product.slug}`}
                        className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition-colors hover:border-blue-500 hover:text-blue-600"
                      >
                        Details
                      </Link>
                    </div>
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                      <span>Sizes {product.sizes.join(" ")}</span>
                      <span>{product.colors.join(" / ")}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-500 hover:text-blue-600"
              onClick={() =>
                setSpotlightIndex(
                  (prev) => (prev - 1 + products.length) % products.length
                )
              }
              aria-label="Previous spotlight"
            >
              <HiChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-500 hover:text-blue-600"
              onClick={() =>
                setSpotlightIndex((prev) => (prev + 1) % products.length)
              }
              aria-label="Next spotlight"
            >
              <HiChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TopRatedProducts;
