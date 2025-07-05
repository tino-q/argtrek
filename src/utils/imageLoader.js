// Dynamic Image Loader Utility
// Programmatically loads images from asset folders and organizes them

// Import all empanadas images
import empanadasMain from "../assets/empanadas/empanadas-1.jpeg";
import empanadas2 from "../assets/empanadas/empanadas-2.jpeg";
import empanadas3 from "../assets/empanadas/empanadas-3.jpeg";
import empanadas4 from "../assets/empanadas/empanadas-4.jpeg";

// Import all horseback riding images
import horseback2 from "../assets/horseback-riding/horseback-riding-mendoza-1.jpeg";
import horseback3 from "../assets/horseback-riding/horseback-riding-mendoza-2.jpeg";

// Import milonga images
import milonga1 from "../assets/milonga/milonga-1.png";
import milonga2 from "../assets/milonga/milonga-2.jpg";
import milonga3 from "../assets/milonga/milonga-3.jpg";

// Import rafting images (keeping existing structure for now)
import rafting1 from "../assets/rafting/rafting1.jpeg";
import rafting2 from "../assets/rafting/rafting2.jpeg";
import rafting3 from "../assets/rafting/rafting3.jpeg";
import rafting4 from "../assets/rafting/rafting4.jpeg";
import rafting5 from "../assets/rafting/rafting5.jpeg";
import rafting6 from "../assets/rafting/rafting6.jpeg";
import rafting7 from "../assets/rafting/rafting7.jpeg";
import rafting8 from "../assets/rafting/rafting8.jpeg";
import rafting9 from "../assets/rafting/rafting9.jpeg";
import rafting10 from "../assets/rafting/rafting10.jpeg";
import rafting11 from "../assets/rafting/rafting11.jpeg";
import rafting12 from "../assets/rafting/rafting12.jpeg";

// Image collection configuration
const IMAGE_COLLECTIONS = {
  empanadas: {
    main: empanadas3, // -1 index (main image)
    additional: [
      { index: 2, image: empanadasMain },
      { index: 3, image: empanadas2 },
      { index: 4, image: empanadas4 },
    ],
  },
  horseback: {
    main: horseback3, // -1 index (main image)
    additional: [{ index: 2, image: horseback2 }],
  },
  rafting: {
    main: rafting2, // -1 index (main image, using rafting1 as main)
    additional: [
      { index: 2, image: rafting1 },
      { index: 3, image: rafting3 },
      { index: 4, image: rafting4 },
      { index: 5, image: rafting5 },
      { index: 6, image: rafting6 },
      { index: 7, image: rafting7 },
      { index: 8, image: rafting8 },
      { index: 9, image: rafting9 },
      { index: 10, image: rafting10 },
      { index: 11, image: rafting11 },
      { index: 12, image: rafting12 },
    ],
  },
  milonga: {
    main: milonga1, // -1 index (main image)
    additional: [
      { index: 2, image: milonga2 },
      { index: 3, image: milonga3 },
    ],
  },
};

// Log the image collections for debugging
console.log("🖼️ Dynamic Image Loader Initialized");
console.log("📸 Available Collections:", Object.keys(IMAGE_COLLECTIONS));
Object.entries(IMAGE_COLLECTIONS).forEach(([activityId, collection]) => {
  console.log(
    `📷 ${activityId}: Main image (index -1) + ${collection.additional.length} additional images`
  );
});

/**
 * Get all images for a specific activity
 * @param {string} activityId - The activity identifier (empanadas, horseback, rafting)
 * @returns {Array} Array of image objects with index and image source
 */
export const getActivityImages = (activityId) => {
  const collection = IMAGE_COLLECTIONS[activityId];
  if (!collection) {
    console.warn(`No image collection found for activity: ${activityId}`);
    return [];
  }

  // Return main image (-1) followed by additional images
  const images = [
    { index: -1, image: collection.main },
    ...collection.additional.sort((a, b) => a.index - b.index),
  ];

  console.log(`🎯 Loading ${images.length} images for activity: ${activityId}`);
  return images;
};

/**
 * Get the main image for a specific activity (index -1)
 * @param {string} activityId - The activity identifier
 * @returns {string} Main image source
 */
export const getMainActivityImage = (activityId) => {
  const collection = IMAGE_COLLECTIONS[activityId];
  const mainImage = collection?.main || null;

  if (mainImage) {
    console.log(`🌟 Main image loaded for ${activityId} (index: -1)`);
  } else {
    console.warn(`⚠️ No main image found for activity: ${activityId}`);
  }

  return mainImage;
};

/**
 * Get just the image sources (for backwards compatibility)
 * @param {string} activityId - The activity identifier
 * @returns {Array} Array of image sources
 */
export const getActivityImageSources = (activityId) => {
  return getActivityImages(activityId).map((item) => item.image);
};

/**
 * Get random images from a collection for carousel/display
 * @param {string} activityId - The activity identifier
 * @param {number} count - Number of images to return
 * @returns {Array} Array of randomly selected image sources
 */
export const getRandomActivityImages = (activityId, count = 3) => {
  const images = getActivityImageSources(activityId);
  const shuffled = [...images].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  console.log(
    `🎲 Selected ${selected.length} random images from ${activityId} collection`
  );
  return selected;
};

export default {
  getActivityImages,
  getMainActivityImage,
  getActivityImageSources,
  getRandomActivityImages,
};
