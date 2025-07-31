import { useState } from 'react';

export const useModal = () => {
  const [isVisible, setIsVisible] = useState(false);

  const showModal = () => setIsVisible(true);
  const hideModal = () => setIsVisible(false);
  const toggleModal = () => setIsVisible(!isVisible);

  return {
    isVisible,
    showModal,
    hideModal,
    toggleModal,
  };
};