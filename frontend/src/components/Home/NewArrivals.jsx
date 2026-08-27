import { useState } from "react";
import { Link } from "react-router-dom";
import { HiChevronLeft, HiChevronRight, HiArrowRight } from "react-icons/hi2";

import useCircularItems from "../../hooks/useCircularItems";
import { formatPrice } from "../../utils/productUtils";

const newArrivals = [
  {
    name: "Pulse Carbon Elite",
    slug: "pulse-carbon-elite",
    description:
      "Race-day flat with dual-density foam and full-length carbon plate for explosive toe-off.",
    price: 240,
    brand: "StrideLab",
    gender: "men",
    category: "running",
    sizes: ["7", "8", "9", "10"],
    colors: ["graphite", "volt"],
    stock: 14,
    heroImage:
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1600&q=80",
  },
  {
    name: "Atelier Slide",
    slug: "atelier-slide",
    description:
      "Minimalist slide crafted with soft-touch suede and memory foam cushioning.",
    price: 120,
    brand: "StrideLab",
    gender: "women",
    category: "sliders",
    sizes: ["5", "6", "7", "8"],
    colors: ["sand", "oat"],
    stock: 32,
    heroImage:
      "https://images.unsplash.com/photo-1516478177764-9fe5bdc5feab?auto=format&fit=crop&w=1600&q=80",
  },
  {
    name: "Sprinter Vibe",
    slug: "sprinter-vibe",
    description:
      "Kids-friendly sneakers with playful color-blocking and durable traction pods.",
    price: 95,
    brand: "StrideLab",
    gender: "kids",
    category: "sneakers",
    sizes: ["1", "2", "3", "4"],
    colors: ["cobalt", "citrus"],
    stock: 40,
    heroImage:
      "https://images.unsplash.com/photo-1523380836010-2320f32fd5ba?auto=format&fit=crop&w=1600&q=80",
  },
];

const NewArrivals = () => {
  const products = newArrivals;
  const [arrivalIndex, setArrivalIndex] = useState(0);
  const visibleArrivals = useCircularItems(products, arrivalIndex, 3);

  if (!products.length) return null;

  return (
    <section className="w-full bg-slate-900 text-white">
      <div className="mx-auto w-full max-w-480 space-y-12 px-6 py-24 sm:px-10 xl:px-16">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
            New Arrivals
          </p>
          <h2 className="text-3xl font-semibold sm:text-4xl">
            Fresh drops mapped to our product schema
          </h2>
          <p className="max-w-3xl text-sm text-slate-300">
            Recently added products with detailed metadata—ready for cart
            assignments, wishlists, and category filtering once the backend is
            connected.
          </p>
        </div>
        <div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleArrivals.map((product) => (
              <article
                key={product.slug}
                className="group relative flex flex-col overflow-hidden rounded-4xl border border-white/10 bg-white/5 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:bg-white/10"
              >
                <div className="relative h-72 overflow-hidden">
                  <img
                    src={product.heroImage}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.3em] text-white backdrop-blur">
                    {product.gender}
                  </span>
                </div>
                <div className="space-y-4 px-6 py-6">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
                      {product.category}
                    </p>
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <p className="text-sm text-slate-200">
                      {product.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-base font-semibold text-white">
                      {formatPrice(product.price)}
                    </p>
                    <span className="text-xs uppercase tracking-[0.3em] text-slate-300">
                      Stock {product.stock}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-300">
                    <span>Sizes {product.sizes.join(" ")}</span>
                    <span>{product.colors.join(" / ")}</span>
                  </div>
                  <Link
                    to={`/products/${product.slug}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition-colors hover:text-emerald-300"
                  >
                    View product
                    <HiArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-slate-200 transition hover:border-white hover:text-white"
              onClick={() =>
                setArrivalIndex(
                  (prev) => (prev - 1 + products.length) % products.length
                )
              }
              aria-label="Previous arrivals"
            >
              <HiChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-slate-200 transition hover:border-white hover:text-white"
              onClick={() =>
                setArrivalIndex((prev) => (prev + 1) % products.length)
              }
              aria-label="Next arrivals"
            >
              <HiChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
