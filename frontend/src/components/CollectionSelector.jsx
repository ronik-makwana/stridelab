import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HiXMark,
  HiOutlineMagnifyingGlass,
  HiOutlinePhoto,
} from "react-icons/hi2";
import { getCollections } from "../services/collectionApi.js";

const CollectionSelector = ({
  selectedCollections = [],
  onChange,
  allCollections = null, // If provided, use these instead of fetching
}) => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState(allCollections || []);
  const [loadingCollections, setLoadingCollections] = useState(!allCollections);
  const [collectionsPage, setCollectionsPage] = useState(1);
  const [hasMoreCollections, setHasMoreCollections] = useState(false);
  const [loadingMoreCollections, setLoadingMoreCollections] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [collectionSearchTerm, setCollectionSearchTerm] = useState("");
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [tempCollections, setTempCollections] = useState([]);
  const searchTimeoutRef = useRef(null);
  const modalSearchTimeoutRef = useRef(null);

  // Fetch collections on mount if not provided
  useEffect(() => {
    if (allCollections) {
      setCollections(allCollections);
      setLoadingCollections(false);
      return;
    }

    const fetchCollections = async () => {
      try {
        setLoadingCollections(true);
        // Only fetch manual collections
        const response = await getCollections(1, "", "manual");
        const data = response.data;
        setCollections(data.collections || []);
        setCollectionsPage(1);
        setHasMoreCollections(data.pagination?.hasNextPage || false);
      } catch (error) {
        toast.error("Failed to load collections");
      } finally {
        setLoadingCollections(false);
      }
    };
    fetchCollections();
  }, [allCollections]);

  const loadMoreCollections = async () => {
    if (loadingMoreCollections || !hasMoreCollections) return;

    try {
      setLoadingMoreCollections(true);
      const nextPage = collectionsPage + 1;
      // Only fetch manual collections
      const response = await getCollections(
        nextPage,
        modalSearchTerm,
        "manual"
      );
      const data = response.data;
      setCollections((prev) => [...prev, ...(data.collections || [])]);
      setCollectionsPage(nextPage);
      setHasMoreCollections(data.pagination?.hasNextPage || false);
    } catch (error) {
      toast.error("Failed to load more collections");
    } finally {
      setLoadingMoreCollections(false);
    }
  };

  const searchCollections = async (searchTerm) => {
    try {
      setLoadingCollections(true);
      // Only fetch manual collections
      const response = await getCollections(1, searchTerm, "manual");
      const data = response.data;
      setCollections(data.collections || []);
      setCollectionsPage(1);
      setHasMoreCollections(data.pagination?.hasNextPage || false);
    } catch (error) {
      toast.error("Failed to search collections");
    } finally {
      setLoadingCollections(false);
    }
  };

  const handleCollectionToggle = (collectionId) => {
    if (tempCollections.includes(collectionId)) {
      setTempCollections(tempCollections.filter((id) => id !== collectionId));
    } else {
      setTempCollections([...tempCollections, collectionId]);
    }
  };

  const handleRemoveCollection = (collectionId) => {
    const newCollections = selectedCollections.filter(
      (id) => id !== collectionId
    );
    onChange(newCollections);
  };

  const handleOpenModal = async () => {
    setCollectionModalOpen(true);
    setModalSearchTerm("");
    setTempCollections([...selectedCollections]);
    // Reset to first page without search, only manual collections
    try {
      setLoadingCollections(true);
      const response = await getCollections(1, "", "manual");
      const data = response.data;
      setCollections(data.collections || []);
      setCollectionsPage(1);
      setHasMoreCollections(data.pagination?.hasNextPage || false);
    } catch (error) {
      toast.error("Failed to load collections");
    } finally {
      setLoadingCollections(false);
    }
  };

  const handleCloseModal = () => {
    setTempCollections([...selectedCollections]);
    setModalSearchTerm("");
    setCollectionSearchTerm("");
    setCollectionModalOpen(false);
  };

  const handleSave = () => {
    onChange([...tempCollections]);
    setModalSearchTerm("");
    setCollectionSearchTerm("");
    setCollectionModalOpen(false);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (modalSearchTimeoutRef.current) {
        clearTimeout(modalSearchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className="space-y-4">
        {/* Disclaimer */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs text-amber-800">
            <span className="font-semibold">Note:</span> Only manual collections
            are shown here. Automatic collections add products dynamically based
            on their criteria and cannot be manually assigned to products.
          </p>
        </div>

        {/* Search Bar with Browse Button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={collectionSearchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setCollectionSearchTerm(value);

                // If modal is already open, update search term and trigger search
                if (collectionModalOpen) {
                  setModalSearchTerm(value);
                  // Clear existing timeout
                  if (modalSearchTimeoutRef.current) {
                    clearTimeout(modalSearchTimeoutRef.current);
                  }
                  // Debounce search - fetch from backend after 500ms
                  modalSearchTimeoutRef.current = setTimeout(() => {
                    searchCollections(value);
                  }, 500);
                } else if (value.trim()) {
                  // Open modal immediately when typing
                  setCollectionModalOpen(true);
                  setModalSearchTerm(value);
                  setTempCollections([...selectedCollections]);
                  // Trigger search after a short delay
                  setTimeout(() => {
                    searchCollections(value);
                  }, 100);
                }
              }}
              onFocus={() => {
                // Open modal when focusing on search if there's text
                if (!collectionModalOpen && collectionSearchTerm.trim()) {
                  setCollectionModalOpen(true);
                  setModalSearchTerm(collectionSearchTerm);
                  setTempCollections([...selectedCollections]);
                  searchCollections(collectionSearchTerm);
                }
              }}
              placeholder="Search collections"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium whitespace-nowrap"
          >
            Browse
          </button>
        </div>

        {/* Selected Collections as Cards */}
        {selectedCollections.length > 0 && (
          <div className="space-y-2">
            {selectedCollections
              .map((collectionId) => {
                const collection = collections.find(
                  (c) => c._id === collectionId
                );
                if (!collection) return null;

                const productCount = collection.products?.length || 0;

                return { collection, productCount, collectionId };
              })
              .filter((item) => item !== null)
              .map(({ collection, productCount, collectionId }) => (
                <div
                  key={collectionId}
                  className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                >
                  {collection.image ? (
                    <img
                      src={collection.image}
                      alt={collection.title}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                      <HiOutlinePhoto className="w-6 h-6 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (collection._id) {
                          navigate(`/admin/collections/edit/${collection._id}`);
                        }
                      }}
                      className="text-sm font-medium text-slate-900 hover:text-slate-700 hover:underline text-left"
                    >
                      {collection.title}
                    </button>
                    <p className="text-xs text-slate-500">
                      {productCount}{" "}
                      {productCount === 1 ? "product" : "products"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCollection(collectionId)}
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    <HiXMark className="h-5 w-5" />
                  </button>
                </div>
              ))}
          </div>
        )}

        {/* Empty State */}
        {selectedCollections.length === 0 && (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              No collections selected. Click "Browse" to add collections.
            </p>
          </div>
        )}
      </div>

      {/* Collection Selection Modal */}
      {collectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Edit collections
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <HiXMark className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Search */}
            <div className="p-6 border-b border-slate-200">
              <div className="relative">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={modalSearchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    setModalSearchTerm(value);

                    // Clear existing timeout
                    if (modalSearchTimeoutRef.current) {
                      clearTimeout(modalSearchTimeoutRef.current);
                    }

                    // Debounce search - fetch from backend after 500ms
                    modalSearchTimeoutRef.current = setTimeout(() => {
                      searchCollections(value);
                    }, 500);
                  }}
                  placeholder="Search collections"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                  autoFocus
                />
                {loadingCollections && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-5 w-5 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Content - Collection List */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingCollections && collections.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin h-8 w-8 border-4 border-slate-300 border-t-slate-600 rounded-full"></div>
                  <p className="text-sm text-slate-500 mt-4">
                    Loading collections...
                  </p>
                </div>
              ) : collections.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-slate-500">
                    {modalSearchTerm.trim()
                      ? `No collections found matching "${modalSearchTerm}"`
                      : "No collections available"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {collections.map((collection) => {
                    const isSelected = tempCollections.includes(collection._id);
                    const productCount = collection.products?.length || 0;

                    return (
                      <label
                        key={collection._id}
                        className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            handleCollectionToggle(collection._id)
                          }
                          className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                        />
                        {collection.image ? (
                          <img
                            src={collection.image}
                            alt={collection.title}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                            <HiOutlinePhoto className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (collection._id) {
                                navigate(`/admin/collections/edit/${collection._id}`);
                              }
                            }}
                            className="text-sm font-medium text-slate-900 hover:text-slate-700 hover:underline text-left"
                          >
                            {collection.title}
                          </button>
                          <p className="text-xs text-slate-500">
                            {productCount}{" "}
                            {productCount === 1 ? "product" : "products"}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                  {/* Load More Button */}
                  {hasMoreCollections && (
                    <div className="pt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={loadMoreCollections}
                        disabled={loadingMoreCollections}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingMoreCollections ? (
                          <span className="flex items-center gap-2">
                            <div className="animate-spin h-4 w-4 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                            Loading...
                          </span>
                        ) : (
                          "Load More"
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-slate-200">
              <p className="text-sm text-slate-600">
                {tempCollections.length}/{collections.length} collections
                selected
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CollectionSelector;
