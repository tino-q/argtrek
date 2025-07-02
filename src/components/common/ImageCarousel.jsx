import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const ImageCarousel = ({ images, isOpen, onClose, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // Prevent body scroll when carousel is open
  useEffect(() => {
    if (isOpen) {
      // Simple approach: just prevent scrolling without affecting positioning
      document.body.style.overflow = "hidden";
    } else {
      // Restore scrolling
      document.body.style.overflow = "";
    }

    // Cleanup function
    return () => {
      if (isOpen) {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen, currentIndex]);

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Touch handling for swipe
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  if (!isOpen || images.length === 0) return null;

  return createPortal(
    <div className="carousel-overlay" onClick={onClose}>
      <div className="carousel-container" onClick={(e) => e.stopPropagation()}>
        <button className="carousel-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>

        <div
          className="carousel-content"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <button className="carousel-nav carousel-prev" onClick={goToPrevious}>
            <i className="fas fa-chevron-left"></i>
          </button>

          <div className="carousel-image-container">
            <img
              src={images[currentIndex]}
              alt={`Rafting ${currentIndex + 1}`}
              className="carousel-image"
            />
          </div>

          <button className="carousel-nav carousel-next" onClick={goToNext}>
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>

        <div className="carousel-indicators">
          {images.map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentIndex ? "active" : ""}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>

        <div className="carousel-counter">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ImageCarousel;
