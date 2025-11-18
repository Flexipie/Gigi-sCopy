import express from 'express';
console.log('Express imported successfully');

import logger from './src/utils/logger.js';
console.log('Logger imported successfully');

import healthRouter from './src/routes/health.js';
console.log('Health router imported successfully');

console.log('All imports successful!');
