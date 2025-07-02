// Pricing Hook for React App
// Migrated and improved from original pricing.js

import { useState, useEffect } from "react";
import { FORM_FIELDS } from "../utils/config";

const ACCOMMODATION_PRICES = {
  0: 0, // Shared room - no extra cost (legacy)
  shared: 0, // Shared room - no extra cost
  private: 0, // Private room upgrade (price comes from RSVP data)
};

export const usePricing = (formData) => {
  const [pricing, setPricing] = useState({
    basePrice: 0,
    accommodationPrice: 0,
    activitiesPrice: 0,
    subtotal: 0,
    processingFee: 0,
    total: 0,
    installmentAmount: 0,
    activities: [],
  });

  useEffect(() => {
    const calculatePricing = () => {
      // Base trip price
      const basePrice = parseFloat(formData[FORM_FIELDS.TRIP_OPTION]) || 0;

      // Accommodation price - use dynamic price from RSVP data if available
      let accommodationPrice =
        ACCOMMODATION_PRICES[formData[FORM_FIELDS.ACCOMMODATION]] || 0;

      // If private room is selected and we have a dynamic price from RSVP data, use it
      if (
        formData[FORM_FIELDS.ACCOMMODATION] === "private" &&
        formData[FORM_FIELDS.ACCOMMODATION_UPGRADE_PRICE]
      ) {
        accommodationPrice = formData[FORM_FIELDS.ACCOMMODATION_UPGRADE_PRICE];
      }

      // Activities price - handle both old string format and new object format
      const activities = formData[FORM_FIELDS.ACTIVITIES] || [];
      let activitiesPrice = activities.reduce((total, activity) => {
        // Handle both old format (strings) and new format (objects)
        if (typeof activity === "string") {
          // Old format: activity names as strings, lookup prices
          const activityPrices = { horseback: 45, cooking: 140, rafting: 75 };
          return total + (activityPrices[activity] || 0);
        } else if (typeof activity === "object" && activity.price) {
          // New format: activity objects with price property
          return total + activity.price;
        }
        return total;
      }, 0);

      // Add checked luggage price if selected
      const checkedLuggagePrice =
        formData.luggage?.checked && formData.luggagePrice
          ? formData.luggagePrice
          : 0;
      activitiesPrice += checkedLuggagePrice;

      // Subtotal
      const subtotal = basePrice + accommodationPrice + activitiesPrice;

      // Processing fee (4% for credit cards)
      const processingFee =
        formData[FORM_FIELDS.PAYMENT_METHOD] === "credit" ? subtotal * 0.04 : 0;

      // Total
      const total = subtotal + processingFee;

      // Installment calculation (35% down payment)
      const installmentAmount =
        formData[FORM_FIELDS.PAYMENT_SCHEDULE] === "installments"
          ? total * 0.35
          : total;

      // Build activities array for display
      const displayActivities = activities.map((activity) => {
        if (typeof activity === "string") {
          const activityPrices = { horseback: 45, cooking: 140, rafting: 75 };
          const activityNames = {
            horseback: "Horse Back Riding",
            cooking: "Empanadas Cooking Class",
            rafting: "Rafting Adventure",
          };
          return {
            name: activityNames[activity] || activity,
            price: activityPrices[activity] || 0,
          };
        } else {
          return {
            name: activity.name,
            price: activity.price,
          };
        }
      });

      // Add checked luggage to activities display if selected
      if (formData.luggage?.checked && formData.luggagePrice) {
        displayActivities.push({
          name: "Checked Luggage",
          price: formData.luggagePrice,
        });
      }

      setPricing({
        basePrice,
        accommodationPrice,
        activitiesPrice,
        subtotal,
        processingFee,
        total,
        installmentAmount,
        activities: displayActivities,
      });
    };

    calculatePricing();
  }, [formData]);

  return pricing;
};

// Helper function to format currency
export const formatCurrency = (amount) => {
  return `$${amount.toLocaleString()}`;
};

// Helper function to get activity by ID (replaced by direct activity objects)
export const getActivityById = (activityId) => {
  const activities = {
    horseback: { name: "Horse Back Riding", price: 45 },
    cooking: { name: "Empanadas Cooking Class", price: 140 },
    rafting: { name: "Rafting Adventure", price: 75 },
  };
  return activities[activityId] || null;
};

// Helper function to validate pricing data
export const validatePricingData = (formData) => {
  const errors = [];

  if (!formData.tripOption) {
    errors.push("Please select a trip option");
  }

  if (formData.accommodation === "0" && !formData.roommate?.trim()) {
    errors.push("Please specify your roommate for shared accommodation");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
