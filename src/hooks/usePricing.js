// Pricing Hook for React App - DISPLAY ONLY
// Shows pricing preview to user, but all actual calculations happen in backend

import { useState, useEffect } from "react";
import { FORM_FIELDS, ACTIVITIES } from "../utils/config";
import { getBasePrice, getPrivateRoomUpgradePrice } from "../utils/rsvpData";

export const usePricing = (rsvpData, formData) => {
  const [pricing, setPricing] = useState({
    basePrice: 0,
    privateRoomUpgrade: 0,
    activitiesPrice: 0,
    subtotal: 0,
    processingFee: 0,
    total: 0,
    installmentAmount: 0,
    activities: [],
  });

  useEffect(() => {
    if (!rsvpData || !formData) {
      return;
    }

    const calculatePricing = () => {
      // === READONLY DATA FROM RSVP (Backend) ===
      const basePrice = getBasePrice(rsvpData);

      // === USER SELECTIONS FROM FORM ===
      const paymentMethod = formData[FORM_FIELDS.PAYMENT_METHOD];
      const paymentSchedule = formData[FORM_FIELDS.PAYMENT_SCHEDULE];

      // === CALCULATE ACCOMMODATION PRICE ===
      let privateRoomUpgrade = 0;
      if (formData[FORM_FIELDS.PRIVATE_ROOM_UPGRADE]) {
        privateRoomUpgrade = getPrivateRoomUpgradePrice(rsvpData);
      }

      // === CALCULATE ACTIVITIES PRICE ===
      let activitiesPrice = 0;
      const selectedActivities = [];

      // Check each activity boolean field
      if (formData[FORM_FIELDS.RAFTING]) {
        activitiesPrice += ACTIVITIES.rafting.price;
        selectedActivities.push({
          name: ACTIVITIES.rafting.name,
          price: ACTIVITIES.rafting.price,
        });
      }

      if (formData[FORM_FIELDS.HORSEBACK]) {
        if (ACTIVITIES.horseback.price > 0) {
          activitiesPrice += ACTIVITIES.horseback.price;
        }
        selectedActivities.push({
          name: ACTIVITIES.horseback.name,
          price: ACTIVITIES.horseback.price,
        });
      }

      if (formData[FORM_FIELDS.COOKING]) {
        activitiesPrice += ACTIVITIES.cooking.price;
        selectedActivities.push({
          name: ACTIVITIES.cooking.name,
          price: ACTIVITIES.cooking.price,
        });
      }

      if (formData[FORM_FIELDS.TANGO]) {
        activitiesPrice += ACTIVITIES.tango.price;
        selectedActivities.push({
          name: ACTIVITIES.tango.name,
          price: ACTIVITIES.tango.price,
        });
      }

      // === CALCULATE SUBTOTAL ===
      const subtotal = basePrice + privateRoomUpgrade + activitiesPrice;

      // === CALCULATE PROCESSING FEE ===
      // Apply processing fee to subtotal (no VAT)
      const processingFee =
        paymentMethod === "credit" ? Math.round(subtotal * 0.0285) : 0;

      // === CALCULATE FINAL TOTAL ===
      const total = subtotal + processingFee;

      // === CALCULATE INSTALLMENT AMOUNT ===
      const installmentAmount =
        paymentSchedule === "installments" ? Math.round(total * 0.35) : total;

      setPricing({
        basePrice,
        privateRoomUpgrade,
        activitiesPrice,
        subtotal,
        processingFee,
        total,
        installmentAmount,
        activities: selectedActivities,
      });
    };

    calculatePricing();
  }, [rsvpData, formData]);

  return pricing;
};

// Helper function to format currency
export const formatCurrency = (amount) => {
  return `$${Math.round(amount).toLocaleString()}`;
};

// Helper function to get activity by ID (for backward compatibility)
export const getActivityById = (activityId) => {
  return ACTIVITIES[activityId] || { name: activityId, price: 0 };
};

// Helper function to validate pricing data
export const validatePricingData = (rsvpData, formData) => {
  const errors = [];

  if (!rsvpData) {
    errors.push("RSVP data is required for pricing");
  }

  if (!getBasePrice(rsvpData)) {
    errors.push("Base trip price not found in RSVP data");
  }

  if (
    !formData[FORM_FIELDS.PRIVATE_ROOM_UPGRADE] &&
    !formData.roommate?.trim()
  ) {
    errors.push("Please specify your roommate for shared accommodation");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
