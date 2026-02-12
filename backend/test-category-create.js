// Test category creation
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testCreateCategory() {
    try {
        // Get token first
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@example.com',
            password: 'admin123'
        });

        const token = loginResponse.data.token;
        console.log('Token:', token ? 'OK' : 'Missing');

        // Create category without image first
        const categoryData = new FormData();
        categoryData.append('name', 'Test Category ' + Date.now());
        categoryData.append('description', 'Test description');
        categoryData.append('isActive', 'true');

        const response = await axios.post('http://localhost:5000/api/categories', categoryData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                ...categoryData.getHeaders()
            }
        });

        console.log('Success:', response.data);
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
    }
}

testCreateCategory();
