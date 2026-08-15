#!/usr/bin/env node
/* global __dirname */

const fs = require('fs');
const path = require('path');

// Create necessary directories
const createDirectories = () => {
  const dirs = ['data', 'logs', 'models'];
  
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

// Create .env file if it doesn't exist
const createEnvFile = () => {
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, 'env.example');
  
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('📝 Created .env file from template');
    console.log('⚠️  Please update .env with your configuration');
  }
};

// Main startup function
const startServer = () => {
  console.log('🚀 Starting CrashCue+ AI API Server...');
  
  // Create directories
  createDirectories();
  
  // Create .env file
  createEnvFile();
  
  // Start the server
  require('./server.js');
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();










