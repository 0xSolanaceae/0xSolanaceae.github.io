/**
 * Main JavaScript Module Index
 * 
 * This file serves as the main entry point for all JavaScript modules
 * and handles the initialization of the portfolio website.
 */

import './config.js';

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎨 0xSolanaceae Portfolio - Initializing...');
  
  // The actual initialization is handled by the individual script files
  // that are loaded in the HTML file:
  // - ascii-morph.js: Handles text morphing animations
  // - ambient.js: Manages background canvas effects  
  // - render.js: Main rendering and interaction logic
  
  if (window.DEV_CONFIG?.DEBUG_MODE) {
    console.log('🔧 Development mode enabled');
  }
});
