// Color map as key-value pairs for backward compatibility with old color names
export const COLOR_MAP = {
  black: "#000000",
  white: "#FFFFFF",
  red: "#EF4444",
  blue: "#3B82F6",
  green: "#10B981",
  yellow: "#FBBF24",
  orange: "#F97316",
  purple: "#A855F7",
  pink: "#EC4899",
  brown: "#92400E",
  gray: "#6B7280",
  grey: "#6B7280",
  beige: "#F5F5DC",
  navy: "#1E3A8A",
  maroon: "#800000",
  teal: "#14B8A6",
  cyan: "#06B6D4",
  lime: "#84CC16",
  indigo: "#6366F1",
  violet: "#8B5CF6",
  gold: "#F59E0B",
  silver: "#C0C0C0",
  tan: "#D2B48C",
  olive: "#808000",
  coral: "#FF7F50",
  salmon: "#FA8072",
  turquoise: "#40E0D0",
  lavender: "#E6E6FA",
  mint: "#98FB98",
  peach: "#FFDAB9",
  cream: "#FFFDD0",
  ivory: "#FFFFF0",
};

// Helper function to get color hex value (handles both hex values and color names for backward compatibility)
export const getColorHex = (color) => {
  return COLOR_MAP[color] || "#CCCCCC";
};
