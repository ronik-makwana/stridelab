import { HiStar } from "react-icons/hi2";

const testimonials = [
  {
    name: "Jordan Chen",
    role: "Creative Director, NYC",
    quote:
      "StrideLab nails the balance between design and performance. The Urban Street capsule keeps my rotation sharp without sacrificing comfort.",
    rating: 5,
  },
  {
    name: "Mila Ortega",
    role: "Marathon Coach",
    quote:
      "Performance Run Series is my go-to recommendation for athletes. The carbon plate lineup delivers consistent energy return on long sessions.",
    rating: 5,
  },
  {
    name: "Rafael Duarte",
    role: "Collector",
    quote:
      "Limited drops, thoughtful storytelling, and premium materials—StrideLab continues to lead the sneaker culture conversation.",
    rating: 5,
  },
];

const renderStars = (count) =>
  Array.from({ length: count }).map((_, index) => (
    <HiStar key={index} className="h-4 w-4 text-amber-400" />
  ));

const Testimonial = () => {
  if (!testimonials.length) return null;

  return (
    <section className="w-full bg-slate-50">
      <div className="mx-auto w-full max-w-480 space-y-12 px-6 py-24 sm:px-10 xl:px-16">
        <div className="flex flex-col gap-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
            Community Voices
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Verified experiences from the StrideLab community
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-slate-500">
            Testimonials from creators, athletes, and collectors already
            exploring our schema-driven product catalog.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <blockquote
              key={testimonial.name}
              className="flex h-full flex-col justify-between rounded-4xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-lg"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-1.5">
                  {renderStars(testimonial.rating)}
                </div>
                <p className="text-sm text-slate-600">“{testimonial.quote}”</p>
              </div>
              <footer className="mt-6 text-sm">
                <p className="font-semibold text-slate-900">
                  {testimonial.name}
                </p>
                <p className="text-xs text-slate-500">{testimonial.role}</p>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonial;
