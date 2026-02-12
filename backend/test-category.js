// Simplified test
require('dotenv').config();

console.log('Step 1: Loading categoryController...');
const categoryController = require('./src/controllers/categoryController');

console.log('Step 2: Checking exports...');
console.log('getAllCategories:', typeof categoryController.getAllCategories);
console.log('getAllCategoriesNoPagination:', typeof categoryController.getAllCategoriesNoPagination);
console.log('getCategoryById:', typeof categoryController.getCategoryById);
console.log('createCategory:', typeof categoryController.createCategory);
console.log('updateCategory:', typeof categoryController.updateCategory);
console.log('deleteCategory:', typeof categoryController.deleteCategory);
console.log('deleteCategoryImage:', typeof categoryController.deleteCategoryImage);

console.log('\nStep 3: Loading categoryRoutes...');
try {
    const categoryRoutes = require('./src/routes/categoryRoutes');
    console.log('Category routes loaded successfully!');
} catch (error) {
    console.error('ERROR loading category routes:');
    console.error(error.message);
    console.error(error.stack);
}
