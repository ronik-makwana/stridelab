import { createContext, useContext, useState, useRef } from "react";
import ConfirmModal from "../components/ConfirmModal.jsx";

const ConfirmModalContext = createContext(null);

export const useConfirmModal = () => {
  const context = useContext(ConfirmModalContext);
  if (!context) {
    throw new Error("useConfirmModal must be used within ConfirmModalProvider");
  }
  return context;
};

export const ConfirmModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
    confirmText: "Delete",
    cancelText: "Cancel",
    variant: "danger",
  });
  const resolveRef = useRef(null);

  const showConfirm = ({
    message,
    onConfirm,
    confirmText = "Delete",
    cancelText = "Cancel",
    variant = "danger",
  }) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModalState({
        isOpen: true,
        message,
        onConfirm,
        confirmText,
        cancelText,
        variant,
      });
    });
  };

  const closeModal = () => {
    if (resolveRef.current) {
      resolveRef.current(false);
      resolveRef.current = null;
    }
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
      onConfirm: null,
    }));
  };

  const handleConfirm = () => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
    if (resolveRef.current) {
      resolveRef.current(true);
      resolveRef.current = null;
    }
    setModalState((prev) => ({
      ...prev,
      isOpen: false,
      onConfirm: null,
    }));
  };

  return (
    <ConfirmModalContext.Provider value={{ showConfirm }}>
      {children}
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={handleConfirm}
        message={modalState.message}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        variant={modalState.variant}
      />
    </ConfirmModalContext.Provider>
  );
};

