/**
 * Pattern matching utilities for trait incompatibility system
 * Supports wildcards (*) for flexible trait matching
 */

/**
 * Convert a pattern with wildcards to a regular expression
 * @param {string} pattern - Pattern string (e.g., "Hair*", "*Hat*", "exact")
 * @returns {RegExp} Regular expression for matching
 */
const patternToRegex = (pattern) => {
  // Escape special regex characters except *
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  // Replace * with .* for wildcard matching
  const regexPattern = escaped.replace(/\*/g, '.*');
  // Ensure exact matching with ^ and $
  return new RegExp(`^${regexPattern}$`);
};

/**
 * Check if an element name matches any of the incompatible patterns
 * @param {string} elementName - The clean name of the element
 * @param {Array<string>} incompatiblePatterns - Array of patterns to check against
 * @returns {boolean} True if element matches any pattern
 */
const isIncompatible = (elementName, incompatiblePatterns) => {
  return incompatiblePatterns.some(pattern => {
    // If pattern contains wildcard, use regex matching
    if (pattern.includes('*')) {
      const regex = patternToRegex(pattern);
      return regex.test(elementName);
    }
    // Otherwise, use exact matching
    return elementName === pattern;
  });
};

/**
 * Expand pattern-based incompatibility configuration
 * This preprocesses patterns to find all matching elements
 * @param {Object} incompatibleConfig - The incompatible configuration from config.js
 * @param {Array} allLayers - All available layers with their elements
 * @returns {Object} Expanded configuration with patterns resolved
 */
const expandIncompatibilities = (incompatibleConfig, allLayers) => {
  const expanded = {};
  
  // Collect all element names from all layers
  const allElementNames = [];
  allLayers.forEach(layer => {
    if (layer.elements) {
      layer.elements.forEach(element => {
        if (element.name) {
          allElementNames.push(element.name);
        }
      });
    }
  });

  // Expand each incompatibility rule
  for (const [key, patterns] of Object.entries(incompatibleConfig)) {
    expanded[key] = [];
    
    patterns.forEach(pattern => {
      if (pattern.includes('*')) {
        // Expand wildcard pattern to all matching elements
        const regex = patternToRegex(pattern);
        const matches = allElementNames.filter(name => regex.test(name));
        expanded[key].push(...matches);
      } else {
        // Keep exact patterns as-is
        expanded[key].push(pattern);
      }
    });
    
    // Remove duplicates
    expanded[key] = [...new Set(expanded[key])];
  }
  
  return expanded;
};

/**
 * Filter compatible layers based on pattern matching
 * @param {Array} layers - Array of layer elements
 * @param {Array<string>} incompatibleDNA - Current incompatibility list
 * @returns {Array} Filtered array of compatible layers
 */
const filterCompatibleLayers = (layers, incompatibleDNA) => {
  return layers.filter(layer => !isIncompatible(layer.name, incompatibleDNA));
};

module.exports = {
  patternToRegex,
  isIncompatible,
  expandIncompatibilities,
  filterCompatibleLayers
};