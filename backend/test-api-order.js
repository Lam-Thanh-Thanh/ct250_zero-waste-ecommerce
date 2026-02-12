// Test API endpoint directly
// Run: node test-api-order.js

const testAPI = async () => {
    try {
        // First, get an order ID
        const mongoose = require('mongoose');
        require('dotenv').config();
        
        await mongoose.connect(process.env.MONGODB_URI);
        const Order = require('./src/models/Order');
        
        const order = await Order.findOne();
        if (!order) {
            console.log('No orders found');
            return;
        }
        
        const orderId = order._id.toString();
        console.log(`Testing with order ID: ${orderId}`);
        console.log(`Order number: ${order.orderNumber}\n`);
        
        await mongoose.connection.close();
        
        // Now test the API
        const axios = require('axios');
        
        // You need to replace this with a valid admin token
        console.log('To test the API, you need an admin token.');
        console.log('1. Login as admin in the frontend');
        console.log('2. Open browser console');
        console.log('3. Run: localStorage.getItem("token")');
        console.log('4. Copy the token and use it in the test\n');
        
        console.log(`Test URL: http://localhost:5000/api/orders/${orderId}`);
        console.log(`Method: GET`);
        console.log(`Headers: { Authorization: "Bearer YOUR_TOKEN_HERE" }`);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
};

testAPI();
