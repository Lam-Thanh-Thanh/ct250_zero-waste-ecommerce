import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProductImage,
    setMainImage
} from '../../api/productApi';
import { getAllCategories } from '../../api/categoryApi';
import { getAllCertificatesNoPagination } from '../../api/certificateApi';
import { getAllPackagingsNoPagination } from '../../api/packagingApi';

const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [packagings, setPackagings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalProducts: 0,
        limit: 12
    });

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        minPrice: '',
        maxPrice: '',
        minEcoScore: '',
        maxEcoScore: '',
        inStock: 'all',
        isFeatured: 'all',
        isActive: 'all',
        sortBy: 'createdAt',
        order: 'desc'
    });

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        shortDescription: '',
        price: '',
        discount: '0',
        category: '',
        stock: '',
        // 5 Eco Criteria
        isNaturalMaterial: false,
        isReusable: false,
        isBiodegradable: false,
        hasRefill: false,
        // Certificates & Packaging
        certificates: [],
        packaging: '',
        materials: [],
        isActive: true,
        isFeatured: false
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [submitting, setSubmitting] = useState(false);


    // Materials input
    const [materialInput, setMaterialInput] = useState('');

    // Fetch categories, certificates, packagings
    useEffect(() => {
        fetchCategories();
        fetchCertificates();
        fetchPackagings();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await getAllCategories();
            setCategories(response.data);
        } catch (error) {
            toast.error('Lỗi khi tải danh mục');
        }
    };

    const fetchCertificates = async () => {
        try {
            const response = await getAllCertificatesNoPagination();
            setCertificates(response.data || []);
        } catch (error) {
            console.error('Lỗi khi tải certificates:', error);
        }
    };

    const fetchPackagings = async () => {
        try {
            const response = await getAllPackagingsNoPagination();
            setPackagings(response.data || []);
        } catch (error) {
            console.error('Lỗi khi tải packagings:', error);
        }
    };

    // Fetch products
    const fetchProducts = async (page = 1) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: pagination.limit,
                ...filters,
                ...(filters.inStock !== 'all' && { inStock: filters.inStock }),
                ...(filters.isFeatured !== 'all' && { isFeatured: filters.isFeatured }),
                ...(filters.isActive !== 'all' && { isActive: filters.isActive })
            };

            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === 'all') {
                    delete params[key];
                }
            });

            const response = await getProducts(params);
            setProducts(response.data.products);
            setPagination(response.data.pagination);
        } catch (error) {
            toast.error(error.message || 'Lỗi khi tải sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [filters]);

    // Handle filter change
    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            search: '',
            category: '',
            minPrice: '',
            maxPrice: '',
            minEcoScore: '',
            maxEcoScore: '',
            inStock: 'all',
            isFeatured: 'all',
            isActive: 'all',
            sortBy: 'createdAt',
            order: 'desc'
        });
    };

    // Open modal for create/edit
    const openModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                description: product.description,
                shortDescription: product.shortDescription || '',
                price: product.price.toString(),
                discount: product.discount.toString(),
                category: product.category._id,
                stock: product.stock.toString(),
                // 5 Eco Criteria
                isNaturalMaterial: product.isNaturalMaterial || false,
                isReusable: product.isReusable || false,
                isBiodegradable: product.isBiodegradable || false,
                hasRefill: product.hasRefill || false,
                // Certificates & Packaging
                certificates: product.certificates?.map(c => c._id) || [],
                packaging: product.packaging?._id || '',
                materials: product.materials || [],
                isActive: product.isActive,
                isFeatured: product.isFeatured
            });
            setExistingImages(product.images || []);
        } else {
            setEditingProduct(null);
            setFormData({
                name: '',
                description: '',
                shortDescription: '',
                price: '',
                discount: '0',
                category: '',
                stock: '',
                isNaturalMaterial: false,
                isReusable: false,
                isBiodegradable: false,
                hasRefill: false,
                certificates: [],
                packaging: '',
                materials: [],
                isActive: true,
                isFeatured: false
            });
            setExistingImages([]);
        }
        setImageFiles([]);
        setImagePreviews([]);
        setMaterialInput('');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        setFormData({
            name: '',
            description: '',
            shortDescription: '',
            price: '',
            discount: '0',
            category: '',
            stock: '',
            isNaturalMaterial: false,
            isReusable: false,
            isBiodegradable: false,
            hasRefill: false,
            certificates: [],
            packaging: '',
            materials: [],
            isActive: true,
            isFeatured: false
        });
        setImageFiles([]);
        setImagePreviews([]);
        setExistingImages([]);
        setMaterialInput('');
    };

    // Handle form input
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle image selection
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        // Validate
        const totalImages = existingImages.length + imageFiles.length + files.length;
        if (totalImages > 10) {
            toast.error('Tối đa 10 ảnh cho 1 sản phẩm');
            return;
        }

        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`File ${file.name} vượt quá 5MB`);
                return;
            }
        }

        setImageFiles(prev => [...prev, ...files]);

        // Create previews
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };

    // Remove new image before upload
    const removeNewImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    // Delete existing image
    const deleteExistingImage = async (productId, imageId) => {
        if (!window.confirm('Bạn có chắc muốn xóa ảnh này?')) return;

        try {
            await deleteProductImage(productId, imageId);
            toast.success('Xóa ảnh thành công');
            setExistingImages(prev => prev.filter(img => img._id !== imageId));
        } catch (error) {
            toast.error(error.message || 'Lỗi khi xóa ảnh');
        }
    };

    // Set main image
    const handleSetMainImage = async (productId, imageId) => {
        try {
            await setMainImage(productId, imageId);
            toast.success('Đặt ảnh chính thành công');
            setExistingImages(prev =>
                prev.map(img => ({ ...img, isMain: img._id === imageId }))
            );
        } catch (error) {
            toast.error(error.message || 'Lỗi khi đặt ảnh chính');
        }
    };

    // Handle certificate toggle
    const handleCertificateToggle = (certificateId) => {
        setFormData(prev => {
            const certs = prev.certificates.includes(certificateId)
                ? prev.certificates.filter(id => id !== certificateId)
                : [...prev.certificates, certificateId];
            return { ...prev, certificates: certs };
        });
    };

    // Calculate ecoScore in real-time for preview
    const calculateEcoScore = () => {
        let score = 0;
        if (formData.isNaturalMaterial) score += 1;
        if (formData.isReusable) score += 1;
        if (formData.isBiodegradable) score += 1;
        if (formData.certificates.length > 0) score += 1;
        if (formData.hasRefill) score += 1;
        return score;
    };

    // Render stars for ecoScore
    const renderStars = (score) => {
        return '⭐'.repeat(score) + '☆'.repeat(5 - score);
    };

    const addMaterial = () => {
        if (materialInput.trim()) {
            setFormData(prev => ({
                ...prev,
                materials: [...prev.materials, materialInput.trim()]
            }));
            setMaterialInput('');
        }
    };

    // Remove material
    const removeMaterial = (index) => {
        setFormData(prev => ({
            ...prev,
            materials: prev.materials.filter((_, i) => i !== index)
        }));
    };

    // Handle submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('description', formData.description);
            data.append('shortDescription', formData.shortDescription);
            data.append('price', formData.price);
            data.append('discount', formData.discount);
            data.append('category', formData.category);
            data.append('stock', formData.stock);
            
            // 5 Eco Criteria
            data.append('isNaturalMaterial', formData.isNaturalMaterial);
            data.append('isReusable', formData.isReusable);
            data.append('isBiodegradable', formData.isBiodegradable);
            data.append('hasRefill', formData.hasRefill);
            
            // Certificates & Packaging
            data.append('certificates', JSON.stringify(formData.certificates));
            data.append('packaging', formData.packaging);
            
            data.append('materials', JSON.stringify(formData.materials));
            data.append('isActive', formData.isActive);
            data.append('isFeatured', formData.isFeatured);

            // Add images
            imageFiles.forEach(file => {
                data.append('images', file);
            });

            if (editingProduct) {
                await updateProduct(editingProduct._id, data);
                toast.success('Cập nhật sản phẩm thành công');
            } else {
                await createProduct(data);
                toast.success('Tạo sản phẩm thành công');
            }

            closeModal();
            fetchProducts(pagination.currentPage);
        } catch (error) {
            toast.error(error.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle delete
    const handleDelete = async (id, name) => {
        if (!window.confirm(`Bạn có chắc muốn xóa sản phẩm "${name}"?`)) return;

        try {
            await deleteProduct(id);
            toast.success('Xóa sản phẩm thành công');
            fetchProducts(pagination.currentPage);
        } catch (error) {
            toast.error(error.message || 'Lỗi khi xóa sản phẩm');
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-900">Quản lý Sản phẩm</h1>
                        {pagination.totalProducts > 0 && (
                            <span className="bg-gray-100 text-gray-600 text-sm font-medium px-3 py-1 rounded-full">
                                {pagination.totalProducts}
                            </span>
                        )}
                    </div>
                    <p className="text-gray-600 mt-1">Quản lý sản phẩm và kho hàng</p>
                </div>

                {/* Filters & Actions */}
                <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                    <div className="space-y-4">
                        {/* Search & Add Button */}
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div className="flex-1 max-w-md">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sản phẩm..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                onClick={() => openModal()}
                                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                            >
                                + Thêm sản phẩm
                            </button>
                        </div>

                        {/* Filters Row 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Tất cả danh mục</option>
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>

                            <select
                                value={filters.inStock}
                                onChange={(e) => handleFilterChange('inStock', e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">Tồn kho: Tất cả</option>
                                <option value="true">Còn hàng</option>
                                <option value="false">Hết hàng</option>
                            </select>

                            <select
                                value={filters.isFeatured}
                                onChange={(e) => handleFilterChange('isFeatured', e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">Nổi bật: Tất cả</option>
                                <option value="true">Nổi bật</option>
                                <option value="false">Không nổi bật</option>
                            </select>

                            <select
                                value={filters.isActive}
                                onChange={(e) => handleFilterChange('isActive', e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">Trạng thái: Tất cả</option>
                                <option value="true">Hoạt động</option>
                                <option value="false">Không hoạt động</option>
                            </select>
                        </div>

                        {/* Filters Row 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Giá tối thiểu"
                                    value={filters.minPrice}
                                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                                <input
                                    type="number"
                                    placeholder="Giá tối đa"
                                    value={filters.maxPrice}
                                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <select
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="createdAt">Ngày tạo</option>
                                <option value="name">Tên sản phẩm</option>
                                <option value="price">Giá</option>
                                <option value="stock">Kho</option>
                            </select>

                            <select
                                value={filters.order}
                                onChange={(e) => handleFilterChange('order', e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="desc">Giảm dần</option>
                                <option value="asc">Tăng dần</option>
                            </select>
                        </div>

                        <button
                            onClick={resetFilters}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                            Đặt lại bộ lọc
                        </button>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-16">
                            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            <p className="text-gray-500 text-lg font-medium">Không có sản phẩm nào</p>
                            <p className="text-gray-400 text-sm mt-1">Hãy thêm sản phẩm đầu tiên của bạn</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Sản phẩm</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Giá</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Tồn kho</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Eco Score</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Trạng thái</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {products.map((product) => (
                                        <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                                            {/* Product Info */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                                                        {product.images && product.images.length > 0 ? (
                                                            <img
                                                                src={product.images.find(img => img.isMain)?.url || product.images[0].url}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate max-w-[260px]">{product.name}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{product.category?.name || '—'}</p>
                                                        {product.isFeatured && (
                                                            <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium mt-1">
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                                Nổi bật
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Price */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-bold text-gray-900">{formatCurrency(product.finalPrice)}</p>
                                                {product.discount > 0 && (
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <span className="text-xs text-gray-400 line-through">{formatCurrency(product.price)}</span>
                                                        <span className="text-xs font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded">-{product.discount}%</span>
                                                    </div>
                                                )}
                                            </td>
                                            {/* Stock */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {product.stock > 10 ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                        {product.stock}
                                                    </span>
                                                ) : product.stock > 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                        {product.stock}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 bg-red-50 px-2.5 py-1 rounded-full">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                        Hết hàng
                                                    </span>
                                                )}
                                            </td>
                                            {/* Eco Score */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                                        product.ecoScore >= 4 ? 'bg-green-100 text-green-700' :
                                                        product.ecoScore >= 2 ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        {product.ecoScore}
                                                    </div>
                                                    <span className="text-xs text-gray-400">/5</span>
                                                </div>
                                            </td>
                                            {/* Status */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                                                    product.isActive ? 'text-green-700 bg-green-50' : 'text-gray-500 bg-gray-100'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${product.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                                    {product.isActive ? 'Hoạt động' : 'Tắt'}
                                                </span>
                                            </td>
                                            {/* Actions */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => openModal(product)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Sửa"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product._id, product.name)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && products.length > 0 && (
                        <div className="bg-white px-4 py-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Hiển thị{' '}
                                    <span className="font-medium">
                                        {(pagination.currentPage - 1) * pagination.limit + 1}
                                    </span>{' '}
                                    đến{' '}
                                    <span className="font-medium">
                                        {Math.min(pagination.currentPage * pagination.limit, pagination.totalProducts)}
                                    </span>{' '}
                                    trong tổng số{' '}
                                    <span className="font-medium">{pagination.totalProducts}</span> sản phẩm
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => fetchProducts(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Trước
                                    </button>
                                    <span className="px-4 py-1 text-sm text-gray-700">
                                        Trang {pagination.currentPage} / {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => fetchProducts(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage === pagination.totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Sau
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {editingProduct ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Name */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tên sản phẩm <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* Short Description */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mô tả ngắn
                                        </label>
                                        <input
                                            type="text"
                                            name="shortDescription"
                                            value={formData.shortDescription}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mô tả chi tiết <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            required
                                            rows="4"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Danh mục <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">Chọn danh mục</option>
                                            {categories.map((cat) => (
                                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Price */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Giá <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="price"
                                            value={formData.price}
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* Discount */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Giảm giá (%)
                                        </label>
                                        <input
                                            type="number"
                                            name="discount"
                                            value={formData.discount}
                                            onChange={handleInputChange}
                                            min="0"
                                            max="100"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* Stock */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Số lượng <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="stock"
                                            value={formData.stock}
                                            onChange={handleInputChange}
                                            required
                                            min="0"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>

                                    {/* ===== ECO CRITERIA SECTION ===== */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Tiêu chí môi trường
                                        </label>

                                        <div className="space-y-2 mb-4">
                                            {/* Tiêu chí 1 */}
                                            <label className="flex items-start gap-3 p-3 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="isNaturalMaterial"
                                                    checked={formData.isNaturalMaterial}
                                                    onChange={handleInputChange}
                                                    className="mt-1 w-4 h-4 text-primary-600 rounded"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">Vật liệu xanh</div>
                                                    <div className="text-xs text-gray-500">100% tự nhiên, hữu cơ hoặc vật liệu tái chế</div>
                                                </div>
                                            </label>

                                            {/* Tiêu chí 2 */}
                                            <label className="flex items-start gap-3 p-3 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="isReusable"
                                                    checked={formData.isReusable}
                                                    onChange={handleInputChange}
                                                    className="mt-1 w-4 h-4 text-primary-600 rounded"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">Tái sử dụng</div>
                                                    <div className="text-xs text-gray-500">Thay thế đồ dùng một lần, có thể dùng lại nhiều năm</div>
                                                </div>
                                            </label>

                                            {/* Tiêu chí 3 */}
                                            <label className="flex items-start gap-3 p-3 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="isBiodegradable"
                                                    checked={formData.isBiodegradable}
                                                    onChange={handleInputChange}
                                                    className="mt-1 w-4 h-4 text-primary-600 rounded"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">Phân hủy sinh học</div>
                                                    <div className="text-xs text-gray-500">Có thể phân hủy sinh học hoặc ủ phân</div>
                                                </div>
                                            </label>

                                            {/* Tiêu chí 4 - Auto from certificates */}
                                            <label className="flex items-start gap-3 p-3 border border-gray-300 rounded bg-gray-50 cursor-not-allowed">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.certificates.length > 0}
                                                    disabled
                                                    className="mt-1 w-4 h-4 rounded"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">Chứng nhận xanh</div>
                                                    <div className="text-xs text-gray-500">
                                                        Có ít nhất 1 chứng chỉ {formData.certificates.length > 0 && `(${formData.certificates.length} đã chọn)`}
                                                    </div>
                                                </div>
                                            </label>

                                            {/* Tiêu chí 5 */}
                                            <label className="flex items-start gap-3 p-3 border border-gray-300 rounded hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="hasRefill"
                                                    checked={formData.hasRefill}
                                                    onChange={handleInputChange}
                                                    className="mt-1 w-4 h-4 text-primary-600 rounded"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">Refillable</div>
                                                    <div className="text-xs text-gray-500">Có thiết kế để làm đầy lại thay vì mua vỏ mới</div>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Real-time Preview */}
                                        <div className="bg-gray-100 p-3 rounded border border-gray-300">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600">Eco Score:</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-semibold text-gray-900">{calculateEcoScore()}/5</span>
                                                    <span className="text-yellow-500">{renderStars(calculateEcoScore())}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ===== CERTIFICATES SELECTION ===== */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Chứng chỉ môi trường
                                        </label>
                                        <p className="text-xs text-gray-500 mb-3">
                                            Chọn ít nhất 1 chứng chỉ để đạt tiêu chí "Chứng nhận xanh" (+1⭐)
                                        </p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-3 border border-gray-300 rounded-lg">
                                            {certificates.length === 0 ? (
                                                <div className="col-span-full text-center text-gray-500 py-4">
                                                    Không có chứng chỉ nào
                                                </div>
                                            ) : (
                                                certificates.map((cert) => (
                                                    <label
                                                        key={cert._id}
                                                        className={`flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                                            formData.certificates.includes(cert._id)
                                                                ? 'border-green-500 bg-green-50'
                                                                : 'border-gray-200 hover:border-gray-400'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.certificates.includes(cert._id)}
                                                            onChange={() => handleCertificateToggle(cert._id)}
                                                            className="sr-only"
                                                        />
                                                        {cert.image?.url && (
                                                            <img
                                                                src={cert.image.url}
                                                                alt={cert.name}
                                                                className="w-16 h-16 object-contain mb-2"
                                                            />
                                                        )}
                                                        <div className="text-xs font-medium text-center">{cert.name}</div>
                                                        {formData.certificates.includes(cert._id) && (
                                                            <div className="mt-1 text-green-600 text-xs">✓ Đã chọn</div>
                                                        )}
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* ===== PACKAGING SELECTION ===== */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Bao bì thân thiện môi trường
                                        </label>
                                        <select
                                            name="packaging"
                                            value={formData.packaging}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        >
                                            <option value="">-- Không có bao bì --</option>
                                            {packagings.map((pkg) => (
                                                <option key={pkg._id} value={pkg._id}>
                                                    {pkg.name} - {pkg.material}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Materials */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Chất liệu
                                        </label>
                                        <div className="flex gap-2 mb-2">
                                            <input
                                                type="text"
                                                value={materialInput}
                                                onChange={(e) => setMaterialInput(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                                placeholder="Nhập chất liệu..."
                                            />
                                            <button
                                                type="button"
                                                onClick={addMaterial}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.materials.map((material, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                                >
                                                    {material}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMaterial(index)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Images */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Hình ảnh (tối đa 10 ảnh)
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />

                                        {/* Existing Images */}
                                        {existingImages.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-sm font-medium text-gray-700 mb-2">Ảnh hiện có:</p>
                                                <div className="grid grid-cols-5 gap-2">
                                                    {existingImages.map((img) => (
                                                        <div key={img._id} className="relative group">
                                                            <img
                                                                src={img.url}
                                                                alt="Product"
                                                                className={`w-full h-24 object-cover rounded-lg ${img.isMain ? 'ring-2 ring-primary-600' : ''}`}
                                                            />
                                                            {img.isMain && (
                                                                <span className="absolute top-1 left-1 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                                                                    Chính
                                                                </span>
                                                            )}
                                                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                                                {!img.isMain && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSetMainImage(editingProduct._id, img._id)}
                                                                        className="px-2 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700"
                                                                    >
                                                                        Đặt chính
                                                                    </button>
                                                                )}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => deleteExistingImage(editingProduct._id, img._id)}
                                                                    className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                                                >
                                                                    Xóa
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* New Images Preview */}
                                        {imagePreviews.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-sm font-medium text-gray-700 mb-2">Ảnh mới:</p>
                                                <div className="grid grid-cols-5 gap-2">
                                                    {imagePreviews.map((preview, index) => (
                                                        <div key={index} className="relative group">
                                                            <img
                                                                src={preview}
                                                                alt="Preview"
                                                                className="w-full h-24 object-cover rounded-lg"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeNewImage(index)}
                                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Checkboxes */}
                                    <div className="flex items-center gap-4 md:col-span-2">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="isActive"
                                                checked={formData.isActive}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Hoạt động</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="isFeatured"
                                                checked={formData.isFeatured}
                                                onChange={handleInputChange}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">Nổi bật</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
                                    >
                                        {submitting ? 'Đang xử lý...' : editingProduct ? 'Cập nhật' : 'Tạo mới'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;