// Test script to find the error
require('dotenv').config();
console.log('Dotenv loaded');

try {
    console.log('Loading app...');
    const app = require('./src/app');
    console.log('App loaded successfully!');
} catch (error) {
    console.error('ERROR:', error.message);
    console.error('Stack:', error.stack);
}
