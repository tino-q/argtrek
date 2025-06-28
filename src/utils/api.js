/**
 * Centralized API utilities for backend interactions
 */

import { fetchWithLocalStorageCache, CACHE_DURATIONS } from "./cache";
import { BACKEND_URL, APPS_SCRIPT_URL } from "./config";

/**
 * Get refresh parameter from current URL
 * @returns {boolean} Whether refresh parameter is present and set to "1"
 */
function getRefreshParam() {
  return new URLSearchParams(window.location.search).get("refresh") === "1";
}

/**
 * Build URL with query parameters and optional refresh
 * @param {string} baseParams - Base query parameters (without leading ?)
 * @param {boolean} includeRefresh - Whether to include refresh parameter
 * @returns {string} Complete URL
 */
function buildUrl(baseParams, includeRefresh = getRefreshParam()) {
  const refreshParam = includeRefresh ? "&refresh=1" : "";
  return `${BACKEND_URL}?${baseParams}${refreshParam}`;
}

/**
 * Generic API request handler
 * @param {string} url - The complete URL to fetch
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Response data
 */
async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (data.success === false) {
    throw new Error(data.error || "API request failed");
  }

  return data;
}

/**
 * Login API call
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} Login response data
 */
export async function loginUser(email, password) {
  const url = buildUrl(
    `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
  );
  return apiRequest(url, { method: "GET" });
}

/**
 * Get timeline data (with caching)
 * @returns {Promise<array>} Timeline data array
 */
export async function getTimelineData() {
  const refreshParam = getRefreshParam();
  return fetchWithLocalStorageCache(
    "timelineData",
    async () => {
      const url = buildUrl("endpoint=timeline");
      const response = await apiRequest(url);
      if (!response.success) {
        throw new Error("Failed to fetch timeline data");
      }
      return response.data;
    },
    CACHE_DURATIONS.ONE_HOUR,
    refreshParam
  );
}

/**
 * Get rafting registrations count
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} Rafting queue data
 */
export async function getRaftingCount(email, password) {
  const url = buildUrl(
    `endpoint=rafting_count&email=${email}&password=${password}`
  );
  return apiRequest(url);
}

/**
 * Download voucher (with caching)
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} Voucher data
 */
export async function downloadVoucher(email, password) {
  const refreshParam = getRefreshParam();
  return fetchWithLocalStorageCache(
    "voucher",
    async () => {
      const url = buildUrl(
        `endpoint=download_voucher&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
      );
      const data = await apiRequest(url);

      if (!data.success) {
        throw new Error(data.error || "Voucher download failed");
      }

      return {
        success: data.success,
        fileName: data.fileName,
        fileData: data.fileData,
        mimeType: data.mimeType,
      };
    },
    CACHE_DURATIONS.ONE_HOUR,
    refreshParam
  );
}

/**
 * Submit form data
 * @param {object} formData - Form data to submit
 * @returns {Promise<object>} Submission response
 */
export async function submitForm(formData) {
  return apiRequest(BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });
}

/**
 * Submit passport details
 * @param {object} passportData - Passport data
 * @returns {Promise<object>} Submission response
 */
export async function submitPassport(passportData) {
  return apiRequest(BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "submit_passport",
      ...passportData,
    }),
  });
}

/**
 * Submit luggage selection
 * @param {object} luggageData - Luggage selection data
 * @returns {Promise<object>} Submission response
 */
export async function submitLuggage(luggageData) {
  return apiRequest(BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "submit_luggage",
      ...luggageData,
    }),
  });
}

/**
 * Set user choice
 * @param {object} choiceData - Choice data
 * @returns {Promise<object>} Submission response
 */
export async function setUserChoice(choiceData) {
  return apiRequest(BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "set_choice",
      ...choiceData,
    }),
  });
}

/**
 * Upload proof of payment file
 * @param {object} uploadData - Upload data including file and form fields
 * @param {File} uploadData.file - The file to upload
 * @param {string} uploadData.name - Customer name
 * @param {string} uploadData.surname - Customer surname
 * @param {string} uploadData.orderNumber - Order number
 * @param {Array} uploadData.installments - Payment installments
 * @returns {Promise<object>} Upload response
 */
export async function uploadProofOfPayment(uploadData) {
  const { file, name, surname, orderNumber, installments } = uploadData;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const [, base64] = event.target.result.split(",");
        const timestamp = Date.now();

        const formData = new FormData();
        formData.append("action", "upload_proof_of_payment");
        formData.append("fileData", base64);
        formData.append("fileName", file.name);
        formData.append("fileType", file.type);
        formData.append("name", name);
        formData.append("surname", surname);
        formData.append("orderNumber", orderNumber);
        formData.append("timestamp", timestamp);
        formData.append("installments_0", installments[0]);
        formData.append("installments_1", installments[1]);

        const response = await fetch(APPS_SCRIPT_URL, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Upload failed");
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

export async function clearAllCache(email, password) {
  return apiRequest(BACKEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "clear_all_cache",
      email,
      password,
    }),
  }).then(() => {
    localStorage.removeItem("reset");
    // reload the page
    window.location.reload();
  });
}
