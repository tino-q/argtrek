// Pricing Hook for React App - DISPLAY ONLY
// Shows pricing preview to user, but all actual calculations happen in backend

import { useState, useEffect } from "react";

import { getActivityByFormField } from "../utils/activities";
import { FORM_FIELDS } from "../utils/config";
import {
  getBasePrice,
  getPrivateRoomUpgradePrice,
  getUSDToEURExchangeRate,
} from "../utils/rsvpData";

import { useTripContext } from "./useTripContext";

export const usePricing = (rsvpData, formData) => {
  const { submissionResult } = useTripContext();

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
      const basePrice = submissionResult?.row
        ? Number(submissionResult.row["pricing.basePrice"])
        : getBasePrice(rsvpData);

      // === USER SELECTIONS FROM FORM ===
      const paymentMethod = formData[FORM_FIELDS.PAYMENT_METHOD];
      const paymentSchedule = formData[FORM_FIELDS.PAYMENT_SCHEDULE];

      // === CALCULATE ACCOMMODATION PRICE ===
      let privateRoomUpgrade = 0;
      if (submissionResult?.row) {
        privateRoomUpgrade = Number(
          submissionResult.row["pricing.privateRoomUpgrade"]
        );
      } else if (formData[FORM_FIELDS.PRIVATE_ROOM_UPGRADE]) {
        privateRoomUpgrade = getPrivateRoomUpgradePrice(rsvpData);
      }

      // === CALCULATE ACTIVITIES PRICE ===
      let activitiesPrice = 0;
      const selectedActivities = [];

      // Check each activity boolean field
      const activityFields = [
        FORM_FIELDS.RAFTING,
        // FORM_FIELDS.HORSEBACK,
        // FORM_FIELDS.COOKING,
        FORM_FIELDS.TANGO,
      ];

      activityFields.forEach((fieldName) => {
        if (formData[fieldName]) {
          const activity = getActivityByFormField(fieldName);
          activitiesPrice += activity.price;
          selectedActivities.push({
            name: activity.name,
            price: activity.price,
          });
        }
      });

      // === CALCULATE SUBTOTAL ===
      const subtotal = submissionResult?.row
        ? Number(submissionResult.row["pricing.subtotal"])
        : basePrice + privateRoomUpgrade + activitiesPrice;

      // === CALCULATE PROCESSING FEE ===
      // Apply processing fee to subtotal (no VAT)
      const processingFee = submissionResult?.row
        ? Number(submissionResult.row["pricing.processingFee"])
        : paymentMethod === "credit"
          ? Math.round(subtotal * 0.0285)
          : 0;

      // === CALCULATE FINAL TOTAL ===
      const total = submissionResult?.row
        ? Number(submissionResult.row["pricing.total"])
        : subtotal + processingFee;

      // === CALCULATE INSTALLMENT AMOUNT ===
      const installmentAmount = submissionResult?.row
        ? Number(submissionResult.row["pricing.installmentAmount"])
        : paymentSchedule === "installments"
          ? Math.round(total * 0.35)
          : total;

      // EUR conversions (only relevant for credit card payments)
      const exchangeRate = getUSDToEURExchangeRate(rsvpData);
      const installmentAmountEUR = submissionResult?.row
        ? Number(submissionResult.row["pricing.installmentAmountEUR"])
        : pricing.installmentAmount
          ? Math.round(pricing.installmentAmount * exchangeRate)
          : 0;

      setPricing({
        basePrice,
        privateRoomUpgrade,
        activitiesPrice,
        subtotal,
        processingFee,
        total,
        installmentAmount,
        activities: selectedActivities,
        installments: [installmentAmount, total - installmentAmount],
        installmentAmountEUR,
      });
    };

    calculatePricing();
  }, [
    rsvpData,
    formData,
    pricing.installmentAmount,
    pricing.total,
    submissionResult?.row,
  ]);

  return pricing;
};

// Helper function to format currency
export const formatCurrency = (amount) => {
  return `$${Math.round(amount).toLocaleString()}`;
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
