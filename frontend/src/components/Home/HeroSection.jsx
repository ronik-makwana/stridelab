import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { formatPrice } from "../../utils/productUtils";

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

const HeroSection = () => {
  const [heroIndex, setHeroIndex] = useState(0);
  const collections = featuredCollections;
  const products = spotlightProducts;

  useEffect(() => {
    if (!collections.length) return undefined;

    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % collections.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [collections.length]);

  const heroCollection = collections[heroIndex] ?? collections[0];

  const heroProduct = useMemo(() => {
    if (!heroCollection) return null;

    const match = products.find((product) =>
      heroCollection.products.includes(product.slug)
    );

    return match ?? products[0] ?? null;
  }, [heroCollection, products]);

  if (!heroCollection) return null;

  return (
    <section className="relative w-full overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-xl"
          style={{ backgroundImage: `url(${heroCollection.heroImage})` }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(15,23,42,0.7)_0%,rgba(15,23,42,0.95)_60%,rgba(15,23,42,1)_100%)]" />
      </div>
      <div className="relative mx-auto flex w-full max-w-480 flex-col gap-16 px-6 py-24 sm:px-10 xl:px-16">
        <header className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-200">
            Featured Collection
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl xl:text-6xl">
            {heroCollection.name}
          </h1>
          <p className="mt-5 max-w-2xl text-base text-slate-200 sm:text-lg">
            {heroCollection.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to={`/collections/${heroCollection.slug}`}
              className="rounded-full bg-white px-9 py-3 text-sm font-semibold !text-slate-900 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-slate-200"
            >
              Explore collection
            </Link>
            {heroProduct && (
              <Link
                to={`/products/${heroProduct.slug}`}
                className="rounded-full border border-white/50 px-9 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:border-white hover:bg-white/10"
              >
                View spotlight product
              </Link>
            )}
          </div>
        </header>

        {heroProduct && (
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 shadow-2xl backdrop-blur">
            <img
              src={heroProduct.heroImage}
              alt={heroProduct.name}
              className="h-104 w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950 via-slate-950/60 to-transparent p-6">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-slate-200">
                <span>{heroProduct.brand}</span>
                <span>{heroProduct.category}</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">
                    {heroProduct.name}
                  </p>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-300">
                    {heroProduct.gender} • sizes {heroProduct.sizes.join(" ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">
                    {heroProduct.discountPrice
                      ? formatPrice(heroProduct.discountPrice)
                      : formatPrice(heroProduct.price)}
                  </p>
                  {heroProduct.discountPrice && (
                    <p className="text-xs text-slate-300 line-through">
                      {formatPrice(heroProduct.price)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-center">
          <div className="flex gap-2">
            {collections.map((collection, index) => (
              <button
                key={collection.slug}
                type="button"
                className={`h-2 w-8 rounded-full transition ${
                  index === heroIndex ? "bg-white" : "bg-white/30"
                }`}
                onClick={() => setHeroIndex(index)}
                aria-label={`Go to ${collection.name}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
