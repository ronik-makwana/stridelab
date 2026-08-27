import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { HiChevronLeft, HiChevronDown, HiPlus } from "react-icons/hi2";
import { createProduct } from "../../../services/productApi.js";
import { COLOR_MAP, getColorHex } from "../../../utils/colorUtils.js";
import CollectionSelector from "../../../components/CollectionSelector.jsx";

const CreateProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    images: [""],
    price: "",
    discountedPrice: "",
    category: "",
    brand: "",
    tags: [],
    colors: [],
    sizes: [],
    collections: [],
  });
  const [tagInput, setTagInput] = useState("");
  const [colorDropdownOpen, setColorDropdownOpen] = useState(false);
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false);
  const colorDropdownRef = useRef(null);
  const sizeDropdownRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData((prev) => ({
      ...prev,
      images: newImages,
    }));
  };

  const addImageField = () => {
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ""],
    }));
  };

  const removeImageField = (index) => {
    if (formData.images.length > 1) {
      const newImages = formData.images.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        images: newImages,
      }));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const toggleColor = (color) => {
    if (color) {
      setFormData((prev) => {
        if (prev.colors.includes(color)) {
          return {
            ...prev,
            colors: prev.colors.filter((c) => c !== color),
          };
        } else {
          return {
            ...prev,
            colors: [...prev.colors, color],
          };
        }
      });
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check color dropdown
      if (colorDropdownRef.current) {
        const isClickInside = colorDropdownRef.current.contains(event.target);
        if (!isClickInside && colorDropdownOpen) {
          setColorDropdownOpen(false);
        }
      }
      // Check size dropdown
      if (sizeDropdownRef.current) {
        const isClickInside = sizeDropdownRef.current.contains(event.target);
        if (!isClickInside && sizeDropdownOpen) {
          setSizeDropdownOpen(false);
        }
      }
    };

    // Use mousedown to catch clicks before they bubble
    if (colorDropdownOpen || sizeDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [colorDropdownOpen, sizeDropdownOpen]);

  const removeColor = (colorToRemove) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((color) => color !== colorToRemove),
    }));
  };

  const toggleSize = (size) => {
    if (size) {
      setFormData((prev) => {
        if (prev.sizes.includes(size)) {
          return {
            ...prev,
            sizes: prev.sizes.filter((s) => s !== size),
          };
        } else {
          return {
            ...prev,
            sizes: [...prev.sizes, size],
          };
        }
      });
    }
  };

  // Generate size options from 2 to 13
  const SIZE_OPTIONS = Array.from({ length: 12 }, (_, i) => (i + 2).toString());

  const removeSize = (sizeToRemove) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((size) => size !== sizeToRemove),
    }));
  };

  const handleCollectionsChange = (newCollections) => {
    setFormData((prev) => ({
      ...prev,
      collections: newCollections,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filter out empty images
      const validImages = formData.images.filter((img) => img.trim() !== "");

      if (validImages.length === 0) {
        toast.error("At least one image URL is required");
        setLoading(false);
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        images: validImages,
        price: parseFloat(formData.price),
        discountedPrice: formData.discountedPrice
          ? parseFloat(formData.discountedPrice)
          : undefined,
        category: formData.category,
        brand: formData.brand || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        colors: formData.colors.length > 0 ? formData.colors : undefined,
        sizes: formData.sizes.length > 0 ? formData.sizes : undefined,
        collections:
          formData.collections.length > 0 ? formData.collections : undefined,
      };

      await createProduct(payload);
      toast.success("Product created successfully!");
      navigate("/admin/products");
    } catch (error) {
      toast.error(error.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin/products")}
        className="mb-4 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <HiChevronLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back to Products</span>
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Product</h1>
          <p className="text-slate-600 mt-1">
            Add a new product to your catalog
          </p>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            const form = document.querySelector("form");
            if (form) {
              form.requestSubmit();
            }
          }}
          disabled={loading}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm border border-slate-200"
      >
        <div className="divide-y divide-slate-200">
          {/* Basic Information Section */}
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Basic Information
              </h2>
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                    placeholder="Enter product title"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all resize-none"
                    placeholder="Enter product description"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-white"
                  >
                    <option value="">Select category</option>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="kids">Kids</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Product Images
              </h2>
              <div className="space-y-3">
                {formData.images.map((image, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      required={index === 0}
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                      placeholder="https://example.com/image.jpg"
                    />
                    {formData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addImageField}
                  className="text-sm text-slate-700 hover:text-slate-900 font-medium flex items-center gap-1"
                >
                  <HiPlus className="w-4 h-4" />
                  Add another image
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Pricing
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      $
                    </span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Discounted Price
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      $
                    </span>
                    <input
                      type="number"
                      name="discountedPrice"
                      value={formData.discountedPrice}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="w-full pl-8 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Section */}
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Product Details
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                      placeholder="Enter tag"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
                    >
                      Add
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-medium"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-red-600 hover:text-red-700 text-base leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Colors */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Colors
                  </label>
                  <div className="relative" ref={colorDropdownRef}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setColorDropdownOpen(!colorDropdownOpen);
                      }}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-white text-left flex items-center justify-between"
                    >
                      <span className="text-slate-700">
                        {formData.colors.length > 0
                          ? `${formData.colors.length} color${formData.colors.length > 1 ? "s" : ""} selected`
                          : "Select colors"}
                      </span>
                      <HiChevronDown
                        className={`w-5 h-5 text-slate-500 transition-transform ${
                          colorDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {colorDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        <div className="p-2">
                          {Object.entries(COLOR_MAP).map(([color, hex]) => {
                            const isSelected = formData.colors.includes(color);
                            return (
                              <button
                                key={color}
                                type="button"
                                onClick={() => toggleColor(color)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleColor(color)}
                                  className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900 cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span
                                  className="w-6 h-6 rounded-full border border-slate-300 shrink-0"
                                  style={{ backgroundColor: hex }}
                                ></span>
                                <span className="text-sm font-medium text-slate-900">
                                  {color}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  {formData.colors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.colors.map((color) => {
                        return (
                          <span
                            key={color}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-medium"
                          >
                            <span
                              className="inline-block w-4 h-4 rounded-full border border-slate-300"
                              style={{ backgroundColor: getColorHex(color) }}
                            ></span>
                            {color}
                            <button
                              type="button"
                              onClick={() => removeColor(color)}
                              className="text-red-600 hover:text-red-700 text-base leading-none"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sizes */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Sizes
                  </label>
                  <div className="relative" ref={sizeDropdownRef}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSizeDropdownOpen(!sizeDropdownOpen);
                      }}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-white text-left flex items-center justify-between"
                    >
                      <span className="text-slate-700">
                        {formData.sizes.length > 0
                          ? `${formData.sizes.length} size${formData.sizes.length > 1 ? "s" : ""} selected`
                          : "Select sizes"}
                      </span>
                      <HiChevronDown
                        className={`w-5 h-5 text-slate-500 transition-transform ${
                          sizeDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {sizeDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        <div className="p-2">
                          {SIZE_OPTIONS.map((size) => {
                            const isSelected = formData.sizes.includes(size);
                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={() => toggleSize(size)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSize(size)}
                                  className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900 cursor-pointer"
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <span className="text-sm font-medium text-slate-900">
                                  {size}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  {formData.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.sizes.map((size) => (
                        <span
                          key={size}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-medium"
                        >
                          {size}
                          <button
                            type="button"
                            onClick={() => removeSize(size)}
                            className="text-red-600 hover:text-red-700 text-base leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Collections Section */}
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Collections
              </h2>
              <CollectionSelector
                selectedCollections={formData.collections}
                onChange={handleCollectionsChange}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => navigate("/admin/products")}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-white transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateProduct;
