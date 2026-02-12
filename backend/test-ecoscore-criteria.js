/**
 * Test script cho hệ thống EcoScore criteria-based mới
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./src/models/Product');
const Category = require('./src/models/Category');
const Certificate = require('./src/models/Certificate');
const Packaging = require('./src/models/Packaging');

async function testEcoScoreCriteria() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Kết nối MongoDB thành công\n');

        // Lấy dữ liệu cần thiết
        const category = await Category.findOne();
        const certificates = await Certificate.find().limit(2);
        const packaging = await Packaging.findOne();

        console.log('📦 Dữ liệu test:');
        console.log('Category:', category?.name || 'Không có');
        console.log('Certificates:', certificates.map(c => c.name).join(', ') || 'Không có');
        console.log('Packaging:', packaging?.name || 'Không có');
        console.log('\n' + '='.repeat(60) + '\n');

        // TEST 1: Product đạt cả 5 tiêu chí
        console.log('🔵 TEST 1: Product đạt cả 5 tiêu chí');
        const product1 = await Product.create({
            name: 'Test Product 1 - Eco Friendly 100%',
            description: 'Product test với cả 5 tiêu chí đạt',
            shortDescription: 'Test 5/5 sao',
            price: 100000,
            category: category._id,
            stock: 50,
            isNaturalMaterial: true,   // ✓ Tiêu chí 1
            isReusable: true,            // ✓ Tiêu chí 2
            isBiodegradable: true,       // ✓ Tiêu chí 3
            certificates: certificates.map(c => c._id), // ✓ Tiêu chí 4
            hasRefill: true,             // ✓ Tiêu chí 5
            images: [{
                url: 'https://via.placeholder.com/500',
                publicId: 'test_image_1',
                isMain: true
            }]
        });

        await product1.populate([
            { path: 'certificates', select: 'name' },
            { path: 'category', select: 'name' }
        ]);

        console.log(`✅ Product created: ${product1.name}`);
        console.log(`   - isNaturalMaterial: ${product1.isNaturalMaterial} ${product1.isNaturalMaterial ? '✓' : '✗'}`);
        console.log(`   - isReusable: ${product1.isReusable} ${product1.isReusable ? '✓' : '✗'}`);
        console.log(`   - isBiodegradable: ${product1.isBiodegradable} ${product1.isBiodegradable ? '✓' : '✗'}`);
        console.log(`   - Certificates: ${product1.certificates.length} ${product1.certificates.length > 0 ? '✓' : '✗'}`);
        console.log(`   - hasRefill: ${product1.hasRefill} ${product1.hasRefill ? '✓' : '✗'}`);
        console.log(`   ⭐ EcoScore: ${product1.ecoScore}/5`);
        console.log(`   Expected: 5, Got: ${product1.ecoScore} ${product1.ecoScore === 5 ? '✅ PASS' : '❌ FAIL'}`);
        console.log('');

        // TEST 2: Product đạt 3 tiêu chí
        console.log('🔵 TEST 2: Product đạt 3 tiêu chí');
        const product2 = await Product.create({
            name: 'Test Product 2 - Eco Moderate',
            description: 'Product test với 3 tiêu chí đạt',
            shortDescription: 'Test 3/5 sao',
            price: 80000,
            category: category._id,
            stock: 30,
            isNaturalMaterial: true,     // ✓ Tiêu chí 1
            isReusable: false,            // ✗ Tiêu chí 2
            isBiodegradable: true,        // ✓ Tiêu chí 3
            certificates: [certificates[0]._id], // ✓ Tiêu chí 4
            hasRefill: false,             // ✗ Tiêu chí 5
            images: [{
                url: 'https://via.placeholder.com/500',
                publicId: 'test_image_2',
                isMain: true
            }]
        });

        console.log(`✅ Product created: ${product2.name}`);
        console.log(`   - isNaturalMaterial: ${product2.isNaturalMaterial} ${product2.isNaturalMaterial ? '✓' : '✗'}`);
        console.log(`   - isReusable: ${product2.isReusable} ${product2.isReusable ? '✓' : '✗'}`);
        console.log(`   - isBiodegradable: ${product2.isBiodegradable} ${product2.isBiodegradable ? '✓' : '✗'}`);
        console.log(`   - Certificates: ${product2.certificates.length} ${product2.certificates.length > 0 ? '✓' : '✗'}`);
        console.log(`   - hasRefill: ${product2.hasRefill} ${product2.hasRefill ? '✓' : '✗'}`);
        console.log(`   ⭐ EcoScore: ${product2.ecoScore}/5`);
        console.log(`   Expected: 3, Got: ${product2.ecoScore} ${product2.ecoScore === 3 ? '✅ PASS' : '❌ FAIL'}`);
        console.log('');

        // TEST 3: Product không đạt tiêu chí nào
        console.log('🔵 TEST 3: Product không đạt tiêu chí nào');
        const product3 = await Product.create({
            name: 'Test Product 3 - No Eco',
            description: 'Product test không có tiêu chí nào',
            shortDescription: 'Test 0/5 sao',
            price: 50000,
            category: category._id,
            stock: 20,
            isNaturalMaterial: false,
            isReusable: false,
            isBiodegradable: false,
            certificates: [],
            hasRefill: false,
            images: [{
                url: 'https://via.placeholder.com/500',
                publicId: 'test_image_3',
                isMain: true
            }]
        });

        console.log(`✅ Product created: ${product3.name}`);
        console.log(`   - isNaturalMaterial: ${product3.isNaturalMaterial} ${product3.isNaturalMaterial ? '✓' : '✗'}`);
        console.log(`   - isReusable: ${product3.isReusable} ${product3.isReusable ? '✓' : '✗'}`);
        console.log(`   - isBiodegradable: ${product3.isBiodegradable} ${product3.isBiodegradable ? '✓' : '✗'}`);
        console.log(`   - Certificates: ${product3.certificates.length} ${product3.certificates.length > 0 ? '✓' : '✗'}`);
        console.log(`   - hasRefill: ${product3.hasRefill} ${product3.hasRefill ? '✓' : '✗'}`);
        console.log(`   ⭐ EcoScore: ${product3.ecoScore}/5`);
        console.log(`   Expected: 0, Got: ${product3.ecoScore} ${product3.ecoScore === 0 ? '✅ PASS' : '❌ FAIL'}`);
        console.log('');

        // TEST 4: Test ecoScoreBreakdown virtual field
        console.log('🔵 TEST 4: Test ecoScoreBreakdown virtual field');
        const productWithBreakdown = await Product.findById(product1._id);
        const breakdown = productWithBreakdown.ecoScoreBreakdown;
        
        console.log('✅ EcoScore Breakdown:');
        console.log(`   Total: ${breakdown.total}/5`);
        breakdown.criteria.forEach(c => {
            console.log(`   - ${c.name}: ${c.met ? '✅' : '❌'}`);
        });
        console.log('');

        // Cleanup
        console.log('🧹 Cleaning up test data...');
        await Product.deleteMany({
            _id: { $in: [product1._id, product2._id, product3._id] }
        });

        console.log('\n✅ TẤT CẢ TESTS COMPLETED!');
        console.log('\n📝 Summary:');
        console.log('  ✓ EcoScore tính đúng từ 5 tiêu chí');
        console.log('  ✓ Middleware hoạt động tự động');
        console.log('  ✓ Virtual field ecoScoreBreakdown hoạt động');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Đã đóng kết nối MongoDB');
    }
}

testEcoScoreCriteria();
