const footerLinks = {
  Shop: [
    { label: "New Arrivals", to: "#" },
    { label: "Best Sellers", to: "#" },
    { label: "Member Exclusives", to: "#" },
  ],
  Collections: [
    { label: "Urban Street", to: "#" },
    { label: "Performance Run", to: "#" },
    { label: "Minimal Luxe", to: "#" },
  ],
  Support: [
    { label: "Size Guide", to: "#" },
    { label: "Shipping & Returns", to: "#" },
    { label: "Care & Repairs", to: "#" },
  ],
};

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto w-full px-4 py-12 sm:px-10 md:px-10 xl:px-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white">
                S
              </span>
              StrideLab
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Crafting standout footwear for every stride. From street-ready
              drops to performance kicks, we keep you one step ahead.
            </p>
          </div>
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
                {section}
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-500">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.to}
                      className="transition-colors hover:text-blue-600"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 border-t border-slate-200 pt-6">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} EcomX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
