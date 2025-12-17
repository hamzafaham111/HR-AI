/**
 * useModal Hook
 * 
 * Manages modal state (open/close) and provides utilities for modal operations.
 */

import { useState, useCallback } from 'react';

/**
 * @param {boolean} initialOpen - Initial open state (default: false)
 * @returns {Object} { isOpen, open, close, toggle }
 */
export const useModal = (initialOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
};

export default useModal;

