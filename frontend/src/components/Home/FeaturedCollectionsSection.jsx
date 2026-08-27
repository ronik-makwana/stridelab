import { useState } from "react";
import { Link } from "react-router-dom";
import { HiChevronLeft, HiChevronRight, HiArrowRight } from "react-icons/hi2";

import useCircularItems from "../../hooks/useCircularItems";

const featuredCollections = [
  {
    name: "Urban Street Capsule",
    slug: "urban-street",
    description:
      "Curated sneakers engineered for city runs and late-night sessions. Premium materials, reflective accents, and responsive cushioning.",
    image:
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=1600&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1600&q=80",
    genders: ["men", "women"],
    products: ["velocity-rx-1", "metro-shift-low", "nimbus-trail-pro"],
  },
  {
    name: "Performance Run Series",
    slug: "performance-run",
    description:
      "Distance-ready footwear with carbon plate propulsion, featherlight uppers, and tuned stability for race-day pace.",
    image:
      "https://images.unsplash.com/photo-1513105737059-ff0cf0580e4a?auto=format&fit=crop&w=1600&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?auto=format&fit=crop&w=1600&q=80",
    genders: ["men", "women"],
    products: ["aero-glide-v2", "pulse-carbon-elite"],
  },
  {
    name: "Minimal Luxe Studio",
    slug: "minimal-luxe",
    description:
      "Hand-finished suede, neutral palettes, and sculpted comfort—designed to elevate everyday fits from studio to street.",
    image:
      "https://images.unsplash.com/photo-1521579971123-1192931a1452?auto=format&fit=crop&w=1600&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1600&q=80",
    genders: ["women"],
    products: ["atelier-slide", "solace-heel"],
  },
];

const FeaturedCollectionsSection = () => {
  const collections = featuredCollections;
  const [collectionIndex, setCollectionIndex] = useState(0);
  const visibleCollections = useCircularItems(collections, collectionIndex, 3);

  if (!collections.length) return null;

  return (
    <section className="w-full bg-slate-50">
      <div className="mx-auto w-full max-w-480 space-y-12 px-6 py-24 sm:px-10 xl:px-16">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">
            Featured Collections
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Shop curated stories crafted for every stride
          </h2>
          <p className="max-w-3xl text-sm text-slate-500">
            From carbon-infused race shoes to minimalist studio silhouettes,
            each collection is mapped to specific use-cases and curated to help
            you move better.
          </p>
        </div>
        <div className="relative">
          <div className="grid gap-8 lg:grid-cols-3">
            {visibleCollections.map((collection) => (
              <article
                key={collection.slug}
                className="group relative overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                <div className="relative h-80 w-full overflow-hidden">
                  <img
                    src={collection.image}
                    alt={collection.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.3em] text-white backdrop-blur">
                    {collection.genders.join(" • ")}
                  </div>
                </div>
                <div className="space-y-4 px-6 py-7">
                  <h3 className="text-2xl font-semibold text-slate-900">
                    {collection.name}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {collection.description}
                  </p>
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                    <span>{collection.products.length} products</span>
                    <Link
                      to={`/collections/${collection.slug}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
                    >
                      Browse now
                      <HiArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-500 hover:text-blue-600"
              onClick={() =>
                setCollectionIndex(
                  (prev) => (prev - 1 + collections.length) % collections.length
                )
              }
              aria-label="Previous collections"
            >
              <HiChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-blue-500 hover:text-blue-600"
              onClick={() =>
                setCollectionIndex((prev) => (prev + 1) % collections.length)
              }
              aria-label="Next collections"
            >
              <HiChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCollectionsSection;
