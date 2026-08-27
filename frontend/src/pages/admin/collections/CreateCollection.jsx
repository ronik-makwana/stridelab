import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { HiChevronLeft } from "react-icons/hi2";
import { HiTrash } from "react-icons/hi2";
import { createCollection } from "../../../services/collectionApi.js";
import ProductSelector from "../../../components/ProductSelector.jsx";

const CreateCollection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    type: "manual",
    products: [],
    rules: [],
    ruleMatchType: "all",
  });
  // Rules state for managing condition inputs
  const [rules, setRules] = useState([]);

  // Field type mapping
  const fieldTypes = {
    // Number fields
    price: "number",
    discountedPrice: "number",
    // String fields
    title: "string",
    category: "string",
    brand: "string",
    // Array fields
    tags: "string",
  };

  // Field options for dropdown
  const fieldOptions = [
    { value: "tags", label: "Tag" },
    { value: "title", label: "Title" },
    { value: "price", label: "Price" },
    { value: "discountedPrice", label: "Discounted Price" },
    { value: "category", label: "Category" },
    //{ value: "brand", label: "Brand" },
  ];

  // Operator options by field type
  const operatorOptions = {
    number: [
      { value: "eq", label: "is equal to" },
      { value: "not_eq", label: "is not equal to" },
      { value: "greater_than", label: "is greater than" },
      { value: "greater_than_or_equal", label: "is greater than or equal to" },
      { value: "less_than", label: "is less than" },
      { value: "less_than_or_equal", label: "is less than or equal to" },
    ],
    string: [
      { value: "contains", label: "contains" },
      { value: "does_not_contain", label: "does not contain" },
      { value: "starts_with", label: "starts with" },
      { value: "ends_with", label: "ends with" },
      { value: "eq", label: "is equal to" },
      { value: "not_eq", label: "is not equal to" },
    ],
  };

  // Get operators for current field
  const getOperatorsForField = (field) => {
    const fieldType = fieldTypes[field] || "string";
    return operatorOptions[fieldType] || operatorOptions.string;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // If type changes to automatic and no rules exist in state, initialize with one rule
    // Rules state persists when switching types, so we only initialize if empty
    if (name === "type" && value === "automatic" && rules.length === 0) {
      const titleOperators = getOperatorsForField("title");
      setRules([
        {
          field: "title",
          operator:
            titleOperators.length > 0 ? titleOperators[0].value : "contains",
          value: "",
        },
      ]);
    }
  };

  const handleProductsChange = (newProducts) => {
    setFormData((prev) => ({
      ...prev,
      products: newProducts,
    }));
  };

  const addRule = () => {
    const titleOperators = getOperatorsForField("title");
    setRules((prev) => [
      ...prev,
      {
        field: "title",
        operator:
          titleOperators.length > 0 ? titleOperators[0].value : "contains",
        value: "",
      },
    ]);
  };

  const removeRule = (index) => {
    setRules((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      // If this was the last rule and we're in automatic mode, keep at least one rule with title
      if (filtered.length === 0 && formData.type === "automatic") {
        const titleOperators = getOperatorsForField("title");
        return [
          {
            field: "title",
            operator:
              titleOperators.length > 0 ? titleOperators[0].value : "contains",
            value: "",
          },
        ];
      }
      return filtered;
    });
  };

  const updateRule = (index, field, value) => {
    setRules((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // If field changes, reset operator to first available option for that field type
      if (field === "field") {
        const operators = getOperatorsForField(value);
        updated[index].operator =
          operators.length > 0 ? operators[0].value : "eq";
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    //
    if (formData.title.trim() === "") {
      toast.error("Collection title is required");
      setLoading(false);
      return;
    } else if (formData.type === "automatic") {
      for (const rule of rules) {
        if (!rule.value || rule.value.trim() === "") {
          toast.error(`Condition value for ${rule.field} is required`);
          setLoading(false);
          return;
        }
      }
    } else if (formData.type === "manual") {
      if (formData.products.length === 0) {
        toast.error("Manual collections must have at least one product");
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        image: formData.image.trim() || undefined,
        type: formData.type,
        products:
          formData.type === "manual" && formData.products.length > 0
            ? formData.products
            : undefined,
        rules:
          formData.type === "automatic" && rules.length > 0 ? rules : undefined,
        ruleMatchType:
          formData.type === "automatic" ? formData.ruleMatchType : undefined,
      };

      await createCollection(payload);
      toast.success("Collection created successfully!");
      navigate("/admin/collections");
    } catch (error) {
      console.error("Error creating collection:", error);
      console.error("Error response:", error.response?.data);

      // Display backend validation errors
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.entries(errors).flatMap(
          ([field, messages]) =>
            Array.isArray(messages)
              ? messages.map((msg) => `${field}: ${msg}`)
              : [`${field}: ${messages}`]
        );
        errorMessages.forEach((msg) => toast.error(msg));
      } else {
        toast.error(
          error.response?.data?.message || "Failed to create collection"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin/collections")}
        className="mb-4 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <HiChevronLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back to Collections</span>
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Create Collection
          </h1>
          <p className="text-slate-600 mt-1">
            Add a new collection to organize your products
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
                    placeholder="Enter collection title"
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
                    placeholder="Enter collection description"
                  />
                </div>

                {/* Image */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Collection Type Section */}
          <div className="p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Collection type
              </h2>
              <div className="space-y-4">
                {/* Manual Option */}
                <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="type"
                    value="manual"
                    checked={formData.type === "manual"}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-slate-900 border-slate-300"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 mb-1">
                      Manual
                    </div>
                    <div className="text-sm text-slate-600">
                      Add products to this collection one by one.
                    </div>
                  </div>
                </label>

                {/* Smart Option */}
                <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="type"
                    value="automatic"
                    checked={formData.type === "automatic"}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 text-slate-900 border-slate-300"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 mb-1">Smart</div>
                    <div className="text-sm text-slate-600">
                      Existing and future products that match the conditions you
                      set will automatically be added to this collection.
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Manual Collection - Products Selection */}
          {formData.type === "manual" && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Select Products
                </h2>
                <ProductSelector
                  selectedProducts={formData.products}
                  onChange={handleProductsChange}
                />
              </div>
            </div>
          )}

          {/* Automatic Collection - Conditions */}
          {formData.type === "automatic" && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">
                  Conditions
                </h3>

                {/* Products must match */}
                <div className="mb-6">
                  <p className="text-sm text-slate-700 mb-3">
                    Products must match:
                  </p>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="ruleMatchType"
                        value="all"
                        checked={formData.ruleMatchType === "all"}
                        onChange={handleChange}
                        className="w-4 h-4 text-slate-900 border-slate-300"
                      />
                      <span className="text-sm text-slate-700">
                        all conditions
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="ruleMatchType"
                        value="any"
                        checked={formData.ruleMatchType === "any"}
                        onChange={handleChange}
                        className="w-4 h-4 text-slate-900 border-slate-300"
                      />
                      <span className="text-sm text-slate-700">
                        any condition
                      </span>
                    </label>
                  </div>
                </div>

                {/* Condition Rows */}
                <div className="space-y-2">
                  {rules.map((rule, index) => (
                    <div key={index}>
                      {/* Divider between conditions (except first one) */}
                      {index > 0 && (
                        <div className="border-t border-slate-200 mb-2"></div>
                      )}

                      {/* Mobile: Stacked vertically */}
                      <div className="flex flex-col gap-3 md:hidden">
                        {/* Field Dropdown */}
                        <select
                          value={rule.field}
                          onChange={(e) =>
                            updateRule(index, "field", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-white text-sm"
                        >
                          {fieldOptions.map((field) => (
                            <option key={field.value} value={field.value}>
                              {field.label}
                            </option>
                          ))}
                        </select>

                        {/* Operator Dropdown */}
                        <select
                          value={rule.operator}
                          onChange={(e) =>
                            updateRule(index, "operator", e.target.value)
                          }
                          disabled={!rule.field}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-white text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                          {getOperatorsForField(rule.field).map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>

                        {/* Value Input and Delete Button Row */}
                        <div className="flex items-center gap-3">
                          <input
                            type={
                              fieldTypes[rule.field] === "number"
                                ? "number"
                                : "text"
                            }
                            value={rule.value}
                            onChange={(e) =>
                              updateRule(index, "value", e.target.value)
                            }
                            step={
                              fieldTypes[rule.field] === "number"
                                ? "0.01"
                                : undefined
                            }
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-sm"
                            placeholder="Value"
                          />
                          {rules.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRule(index)}
                              className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                              aria-label="Delete condition"
                            >
                              <HiTrash className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Tablet: Field and Operator in first row, Value and Delete in second row */}
                      <div className="hidden md:flex lg:hidden flex-col gap-3">
                        {/* First Row: Field and Operator */}
                        <div className="flex items-center gap-3">
                          <select
                            value={rule.field}
                            onChange={(e) =>
                              updateRule(index, "field", e.target.value)
                            }
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-white text-sm"
                          >
                            {fieldOptions.map((field) => (
                              <option key={field.value} value={field.value}>
                                {field.label}
                              </option>
                            ))}
                          </select>

                          <select
                            value={rule.operator}
                            onChange={(e) =>
                              updateRule(index, "operator", e.target.value)
                            }
                            disabled={!rule.field}
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-white text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                          >
                            {rule.field ? (
                              getOperatorsForField(rule.field).map((op) => (
                                <option key={op.value} value={op.value}>
                                  {op.label}
                                </option>
                              ))
                            ) : (
                              <option value="">Select field first</option>
                            )}
                          </select>
                        </div>

                        {/* Second Row: Value and Delete */}
                        <div className="flex items-center gap-3">
                          <input
                            type={
                              fieldTypes[rule.field] === "number"
                                ? "number"
                                : "text"
                            }
                            value={rule.value}
                            onChange={(e) =>
                              updateRule(index, "value", e.target.value)
                            }
                            step={
                              fieldTypes[rule.field] === "number"
                                ? "0.01"
                                : undefined
                            }
                            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-sm"
                            placeholder="Enter value"
                          />
                          {rules.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRule(index)}
                              className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                              aria-label="Delete condition"
                            >
                              <HiTrash className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Desktop: All in one row */}
                      <div className="hidden lg:flex items-center gap-3">
                        {/* Field Dropdown */}
                        <select
                          value={rule.field}
                          onChange={(e) =>
                            updateRule(index, "field", e.target.value)
                          }
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-white text-sm"
                        >
                          {fieldOptions.map((field) => (
                            <option key={field.value} value={field.value}>
                              {field.label}
                            </option>
                          ))}
                        </select>

                        {/* Operator Dropdown */}
                        <select
                          value={rule.operator}
                          onChange={(e) =>
                            updateRule(index, "operator", e.target.value)
                          }
                          disabled={!rule.field}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all bg-white text-sm disabled:bg-slate-100 disabled:cursor-not-allowed"
                        >
                          {rule.field ? (
                            getOperatorsForField(rule.field).map((op) => (
                              <option key={op.value} value={op.value}>
                                {op.label}
                              </option>
                            ))
                          ) : (
                            <option value="">Select field first</option>
                          )}
                        </select>

                        {/* Value Input */}
                        <input
                          type={
                            fieldTypes[rule.field] === "number"
                              ? "number"
                              : "text"
                          }
                          value={rule.value}
                          onChange={(e) =>
                            updateRule(index, "value", e.target.value)
                          }
                          step={
                            fieldTypes[rule.field] === "number"
                              ? "0.01"
                              : undefined
                          }
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all text-sm"
                          placeholder="Enter value"
                        />

                        {/* Delete Button */}
                        {rules.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRule(index)}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                            aria-label="Delete condition"
                          >
                            <HiTrash className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Another Condition Button */}
                <button
                  type="button"
                  onClick={addRule}
                  className="mt-4 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  + Add another condition
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="p-6 bg-slate-50 border-t border-slate-200">
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => navigate("/admin/collections")}
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

export default CreateCollection;
