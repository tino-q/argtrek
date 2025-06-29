// Animation and interaction effects hook
// Migrated from original animations.js

import { useEffect } from "react";

export const useAnimations = () => {
  useEffect(() => {
    // Add smooth scroll behavior for form sections
    const addSmoothScrolling = () => {
      const sections = document.querySelectorAll(".form-section");
      sections.forEach((section) => {
        section.style.scrollBehavior = "smooth";
      });
    };

    // Add entrance animations to form sections
    const addEntranceAnimations = () => {
      const sections = document.querySelectorAll(".form-section");

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.style.opacity = "1";
              entry.target.style.transform = "translateY(0)";
              entry.target.style.transition =
                "opacity 0.6s ease, transform 0.6s ease";
            }
          });
        },
        {
          threshold: 0.1,
          rootMargin: "0px 0px -50px 0px",
        }
      );

      sections.forEach((section) => {
        section.style.opacity = "0";
        section.style.transform = "translateY(20px)";
        observer.observe(section);
      });
    };

    // Add hover effects to interactive elements
    const addHoverEffects = () => {
      // Radio options hover effects
      const radioOptions = document.querySelectorAll(".radio-option");
      radioOptions.forEach((option) => {
        const label = option.querySelector("label");
        if (label) {
          label.addEventListener("mouseenter", () => {
            label.style.transform = "translateY(-2px)";
            label.style.boxShadow = "0 8px 25px var(--shadow-beige-light)";
            label.style.transition =
              "transform 0.3s ease, box-shadow 0.3s ease";
          });

          label.addEventListener("mouseleave", () => {
            if (!option.querySelector("input").checked) {
              label.style.transform = "translateY(0)";
              label.style.boxShadow = "";
            }
          });
        }
      });

      // Activity cards hover effects
      const activityCards = document.querySelectorAll(".activity-card");
      activityCards.forEach((card) => {
        card.addEventListener("mouseenter", () => {
          card.style.transform = "translateY(-5px)";
          card.style.boxShadow = "0 15px 35px var(--shadow-beige-strong)";
          card.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
        });

        card.addEventListener("mouseleave", () => {
          if (!card.classList.contains("activity-selected")) {
            card.style.transform = "translateY(0)";
            card.style.boxShadow = "0 10px 25px var(--shadow-beige-light)";
          }
        });
      });

      // Copy button effects
      const copyButtons = document.querySelectorAll(".copy-btn");
      copyButtons.forEach((btn) => {
        btn.addEventListener("mouseenter", () => {
          btn.style.transform = "scale(1.1)";
          btn.style.transition = "transform 0.2s ease";
        });

        btn.addEventListener("mouseleave", () => {
          btn.style.transform = "scale(1)";
        });
      });
    };

    // Add form validation visual feedback
    const addValidationEffects = () => {
      const inputs = document.querySelectorAll(
        'input[type="text"], input[type="email"]'
      );

      inputs.forEach((input) => {
        input.addEventListener("blur", () => {
          if (input.validity.valid && input.value.trim()) {
            input.style.borderColor = "var(--success-primary)";
            input.style.boxShadow = "0 0 0 2px rgba(16, 185, 129, 0.1)";
          } else if (!input.validity.valid && input.value.trim()) {
            input.style.borderColor = "var(--error-primary)";
            input.style.boxShadow = "0 0 0 2px var(--error-focus)";
          } else {
            input.style.borderColor = "";
            input.style.boxShadow = "";
          }
        });

        input.addEventListener("focus", () => {
          input.style.borderColor = "var(--primary-beige)";
          input.style.boxShadow = "0 0 0 2px var(--focus-beige)";
          input.style.transition =
            "border-color 0.3s ease, box-shadow 0.3s ease";
        });
      });
    };

    // Add loading animation utilities
    const addLoadingStates = () => {
      // This will be used by components that need loading states
      window.showLoadingState = (element) => {
        element.style.opacity = "0.7";
        element.style.pointerEvents = "none";
        element.style.transition = "opacity 0.3s ease";
      };

      window.hideLoadingState = (element) => {
        element.style.opacity = "1";
        element.style.pointerEvents = "auto";
      };
    };

    // Initialize all animations
    addSmoothScrolling();
    addEntranceAnimations();
    addHoverEffects();
    addValidationEffects();
    addLoadingStates();

    // Cleanup function
    return () => {
      // Remove event listeners if needed
      const sections = document.querySelectorAll(".form-section");
      sections.forEach((section) => {
        section.style.opacity = "";
        section.style.transform = "";
        section.style.transition = "";
      });
    };
  }, []);

  // Return utility functions for components to use
  return {
    // Animate element entrance
    animateEntrance: (element, delay = 0) => {
      setTimeout(() => {
        element.style.opacity = "1";
        element.style.transform = "translateY(0)";
        element.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      }, delay);
    },

    // Add pulse effect to element
    pulseElement: (element) => {
      element.style.animation = "pulse 0.6s ease-in-out";
      setTimeout(() => {
        element.style.animation = "";
      }, 600);
    },

    // Shake element for error feedback
    shakeElement: (element) => {
      element.style.animation = "shake 0.5s ease-in-out";
      setTimeout(() => {
        element.style.animation = "";
      }, 500);
    },
  };
};

// CSS animations that will be injected
export const injectAnimationStyles = () => {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .fade-in-up {
      animation: fadeInUp 0.6s ease forwards;
    }

    /* Enhanced transitions for interactive elements */
    .radio-option label,
    .activity-card,
    .copy-btn,
    input[type="text"],
    input[type="email"],
    .submit-btn {
      transition: all 0.3s ease !important;
    }

    /* Success states */
    .input-success {
      border-color: var(--success-primary) !important;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1) !important;
    }

    /* Error states */
    .input-error {
      border-color: var(--error-primary) !important;
      box-shadow: 0 0 0 2px var(--error-focus) !important;
    }

    /* Loading states */
    .loading {
      opacity: 0.7;
      pointer-events: none;
      position: relative;
    }

    .loading::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      margin: -10px 0 0 -10px;
      border: 2px solid var(--primary-beige-light);
      border-top: 2px solid var(--primary-beige);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  document.head.appendChild(style);
};
