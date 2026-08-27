import { useMemo } from "react";

const useCircularItems = (items, startIndex, count) =>
  useMemo(() => {
    if (!items.length) {
      return [];
    }

    const result = [];

    for (let i = 0; i < count; i += 1) {
      result.push(items[(startIndex + i) % items.length]);
    }

    return result;
  }, [items, startIndex, count]);

export default useCircularItems;

