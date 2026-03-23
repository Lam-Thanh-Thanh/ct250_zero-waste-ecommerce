import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProductImage,
    setMainImage
} from '../../api/productApi';
import { getAllCategories } from '../../api/categoryApi';
import { getAllCertificatesNoPagination } from '../../api/certificateApi';
import { getAllPackagingsNoPagination } from '../../api/packagingApi';

const ProductForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = Boolean(id);

    const [categories, setCategories] = useState([]);
    const [certificates, setCertificates] = useState([]);
    const [packagings, setPackagings] = useState([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
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
        isFeatured: false,
        variants: []
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [materialInput, setMaterialInput] = useState('');

    useEffect(() => {
        fetchCategories();
        fetchCertificates();
        fetchPackagings();
        if (isEditing) {
            fetchProduct();
        }
    }, [id]);

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

    const fetchProduct = async () => {
        setLoading(true);
        try {
            const response = await getProducts({ search: '', page: 1, limit: 100 });
            const product = response.data.products.find(p => p._id === id);
            if (product) {
                setFormData({
                    name: product.name,
                    description: product.description,
                    shortDescription: product.shortDescription || '',
                    price: product.price.toString(),
                    discount: product.discount.toString(),
                    category: product.category._id,
                    stock: product.stock.toString(),
                    isNaturalMaterial: product.isNaturalMaterial || false,
                    isReusable: product.isReusable || false,
                    isBiodegradable: product.isBiodegradable || false,
                    hasRefill: product.hasRefill || false,
                    certificates: product.certificates?.map(c => c._id) || [],
                    packaging: product.packaging?._id || '',
                    materials: product.materials || [],
                    isActive: product.isActive,
                    isFeatured: product.isFeatured,
                    variants: product.variants || []
                });
                setExistingImages(product.images || []);
            } else {
                toast.error('Không tìm thấy sản phẩm');
                navigate('/admin/products');
            }
        } catch (error) {
            toast.error('Lỗi khi tải sản phẩm');
            navigate('/admin/products');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
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
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };

    const removeNewImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const deleteExistingImage = async (imageId) => {
        if (!window.confirm('Bạn có chắc muốn xóa ảnh này?')) return;
        try {
            await deleteProductImage(id, imageId);
            toast.success('Xóa ảnh thành công');
            setExistingImages(prev => prev.filter(img => img._id !== imageId));
        } catch (error) {
            toast.error(error.message || 'Lỗi khi xóa ảnh');
        }
    };

    const handleSetMainImage = async (imageId) => {
        try {
            await setMainImage(id, imageId);
            toast.success('Đặt ảnh chính thành công');
            setExistingImages(prev =>
                prev.map(img => ({ ...img, isMain: img._id === imageId }))
            );
        } catch (error) {
            toast.error(error.message || 'Lỗi khi đặt ảnh chính');
        }
    };

    const handleCertificateToggle = (certificateId) => {
        setFormData(prev => {
            const certs = prev.certificates.includes(certificateId)
                ? prev.certificates.filter(id => id !== certificateId)
                : [...prev.certificates, certificateId];
            return { ...prev, certificates: certs };
        });
    };

    const calculateEcoScore = () => {
        let score = 0;
        if (formData.isNaturalMaterial) score += 1;
        if (formData.isReusable) score += 1;
        if (formData.isBiodegradable) score += 1;
        if (formData.certificates.length > 0) score += 1;
        if (formData.hasRefill) score += 1;
        return score;
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

    const removeMaterial = (index) => {
        setFormData(prev => ({
            ...prev,
            materials: prev.materials.filter((_, i) => i !== index)
        }));
    };

    // --- Variant logic ---
    const handleAddVariant = () => {
        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, { size: '', weight: '', volume: '', stockQuantity: '', priceModifier: '' }]
        }));
    };

    const handleVariantChange = (index, field, value) => {
        setFormData(prev => {
            const newVariants = [...prev.variants];
            newVariants[index][field] = value;
            return { ...prev, variants: newVariants };
        });
    };

    const handleRemoveVariant = (index) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index)
        }));
    };

    // Auto-calculate total stock from variants
    useEffect(() => {
        if (formData.variants && formData.variants.length > 0) {
            const totalStock = formData.variants.reduce((sum, v) => sum + (Number(v.stockQuantity) || 0), 0);
            if (formData.stock !== totalStock.toString()) {
                setFormData(prev => ({ ...prev, stock: totalStock.toString() }));
            }
        }
    }, [formData.variants]);

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
            data.append('isNaturalMaterial', formData.isNaturalMaterial);
            data.append('isReusable', formData.isReusable);
            data.append('isBiodegradable', formData.isBiodegradable);
            data.append('hasRefill', formData.hasRefill);
            data.append('certificates', JSON.stringify(formData.certificates));
            data.append('packaging', formData.packaging);
            data.append('materials', JSON.stringify(formData.materials));
            data.append('isActive', formData.isActive);
            data.append('isFeatured', formData.isFeatured);
            data.append('variants', JSON.stringify(formData.variants));

            imageFiles.forEach(file => {
                data.append('images', file);
            });

            if (isEditing) {
                await updateProduct(id, data);
                toast.success('Cập nhật sản phẩm thành công');
            } else {
                await createProduct(data);
                toast.success('Tạo sản phẩm thành công');
            }

            navigate('/admin/products');
        } catch (error) {
            toast.error(error.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-50 p-6 flex items-center justify-center" style={{ minHeight: '400px' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const ecoScore = calculateEcoScore();

    return (
        <div className="bg-gray-50">
            {/* Header Bar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/products')}
                            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Quay lại"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">
                                {isEditing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                            </h1>
                            <p className="text-xs text-gray-500">
                                {isEditing ? 'Cập nhật thông tin sản phẩm' : 'Điền đầy đủ thông tin bên dưới'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/products')}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            form="product-form"
                            disabled={submitting}
                            className="px-5 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 font-medium transition-colors"
                        >
                            {submitting ? 'Đang xử lý...' : isEditing ? 'Cập nhật' : 'Tạo sản phẩm'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Form Content — 2 Column Layout */}
            <form id="product-form" onSubmit={handleSubmit} className="max-w-7xl mx-auto px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ========== LEFT COLUMN (2/3) ========== */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Basic Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Thông tin cơ bản</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tên sản phẩm <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                        placeholder="Nhập tên sản phẩm..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
                                    <input
                                        type="text"
                                        name="shortDescription"
                                        value={formData.shortDescription}
                                        onChange={handleInputChange}
                                        placeholder="Mô tả tóm tắt sản phẩm..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mô tả chi tiết <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        required
                                        rows="3"
                                        placeholder="Mô tả đầy đủ về sản phẩm..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Variants */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Phân loại sản phẩm (Tùy chọn)</h2>
                                <button type="button" onClick={handleAddVariant} className="text-sm px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg font-medium hover:bg-primary-100 transition-colors">
                                    + Thêm phân loại
                                </button>
                            </div>
                            
                            {formData.variants.length > 0 ? (
                                <div className="space-y-4">
                                    {formData.variants.map((v, index) => (
                                        <div key={index} className="p-4 border rounded-lg bg-gray-50 flex flex-col gap-3 relative">
                                            <button type="button" onClick={() => handleRemoveVariant(index)} className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Xóa phân loại">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                            
                                            <div className="grid grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Kích thước (VD: S, M, L)</label>
                                                    <input type="text" value={v.size || ''} onChange={(e) => handleVariantChange(index, 'size', e.target.value)} placeholder="Nhập kích thước..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Trọng lượng (VD: 500g)</label>
                                                    <input type="text" value={v.weight || ''} onChange={(e) => handleVariantChange(index, 'weight', e.target.value)} placeholder="Nhập trọng lượng..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Thể tích (VD: 1L, 500ml)</label>
                                                    <input type="text" value={v.volume || ''} onChange={(e) => handleVariantChange(index, 'volume', e.target.value)} placeholder="Nhập thể tích..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Tồn kho <span className="text-red-500">*</span></label>
                                                    <input type="number" required min="0" value={v.stockQuantity} onChange={(e) => handleVariantChange(index, 'stockQuantity', e.target.value)} placeholder="Số lượng trong kho..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Giá cộng thêm (đ) (Có thể âm)</label>
                                                    <input type="number" value={v.priceModifier} onChange={(e) => handleVariantChange(index, 'priceModifier', e.target.value)} placeholder="Nhập số tiền..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white" />
                                                    <p className="text-[10px] text-gray-500 mt-1">So với giá mặc định</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic mt-2">Sản phẩm này hiện chưa có phân loại nào.</p>
                            )}
                        </div>

                        {/* Images */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Hình ảnh sản phẩm</h2>
                            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-colors">
                                <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm text-gray-500">Nhấn để chọn ảnh <span className="text-gray-400">(tối đa 10 ảnh, 5MB/ảnh)</span></span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>

                            {/* Existing + New Images */}
                            {(existingImages.length > 0 || imagePreviews.length > 0) && (
                                <div className="grid grid-cols-6 gap-2 mt-3">
                                    {existingImages.map((img) => (
                                        <div key={img._id} className="relative group aspect-square">
                                            <img src={img.url} alt="Product" className={`w-full h-full object-cover rounded-lg ${img.isMain ? 'ring-2 ring-primary-500' : ''}`} />
                                            {img.isMain && <span className="absolute top-1 left-1 bg-primary-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Chính</span>}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                                                {!img.isMain && (
                                                    <button type="button" onClick={() => handleSetMainImage(img._id)} className="px-1.5 py-0.5 bg-white text-gray-700 text-[10px] rounded hover:bg-gray-100 font-medium">Chính</button>
                                                )}
                                                <button type="button" onClick={() => deleteExistingImage(img._id)} className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded hover:bg-red-600 font-medium">Xóa</button>
                                            </div>
                                        </div>
                                    ))}
                                    {imagePreviews.map((preview, index) => (
                                        <div key={`new-${index}`} className="relative group aspect-square">
                                            <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-lg border-2 border-dashed border-blue-300" />
                                            <span className="absolute top-1 left-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">Mới</span>
                                            <button type="button" onClick={() => removeNewImage(index)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Eco Criteria — Grid Layout */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Tiêu chí Eco</h2>
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                        ecoScore >= 4 ? 'bg-green-100 text-green-700' :
                                        ecoScore >= 2 ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-gray-100 text-gray-500'
                                    }`}>{ecoScore}</div>
                                    <span className="text-xs text-gray-500">/5</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {[
                                    { name: 'isNaturalMaterial', label: 'Vật liệu xanh', desc: '100% tự nhiên, hữu cơ hoặc tái chế', icon: '🌿' },
                                    { name: 'isReusable', label: 'Tái sử dụng', desc: 'Dùng lại nhiều lần thay vì dùng một lần', icon: '♻️' },
                                    { name: 'isBiodegradable', label: 'Phân hủy sinh học', desc: 'Có thể phân hủy hoặc ủ phân', icon: '🍃' },
                                    { name: 'hasRefill', label: 'Có thể refill', desc: 'Thiết kế để làm đầy lại', icon: '🔄' },
                                ].map((item) => (
                                    <label key={item.name} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${formData[item.name] ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <input type="checkbox" name={item.name} checked={formData[item.name]} onChange={handleInputChange} className="sr-only" />
                                        <span className="text-lg flex-shrink-0">{item.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900">{item.label}</div>
                                            <div className="text-xs text-gray-500 truncate">{item.desc}</div>
                                        </div>
                                        <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${formData[item.name] ? 'bg-green-500 text-white' : 'border border-gray-300'}`}>
                                            {formData[item.name] && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                    </label>
                                ))}
                                {/* Auto cert criteria */}
                                <label className={`flex items-center gap-3 p-3 border rounded-lg md:col-span-2 ${formData.certificates.length > 0 ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                                    <span className="text-lg flex-shrink-0">🏅</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900">Chứng nhận xanh</div>
                                        <div className="text-xs text-gray-500">Tự động: có ít nhất 1 chứng chỉ {formData.certificates.length > 0 && `(${formData.certificates.length} đã chọn)`}</div>
                                    </div>
                                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${formData.certificates.length > 0 ? 'bg-green-500 text-white' : 'border border-gray-300'}`}>
                                        {formData.certificates.length > 0 && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Certificates Selection */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Chứng chỉ môi trường</h2>
                            <p className="text-xs text-gray-500 mb-3">Chọn ít nhất 1 chứng chỉ để đạt tiêu chí "Chứng nhận xanh" (+1⭐)</p>
                            {certificates.length === 0 ? (
                                <div className="text-center text-gray-400 py-6 text-sm">Không có chứng chỉ nào</div>
                            ) : (
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto">
                                    {certificates.map((cert) => (
                                        <label
                                            key={cert._id}
                                            className={`flex flex-col items-center p-2 border-2 rounded-lg cursor-pointer transition-all text-center ${
                                                formData.certificates.includes(cert._id)
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <input type="checkbox" checked={formData.certificates.includes(cert._id)} onChange={() => handleCertificateToggle(cert._id)} className="sr-only" />
                                            {cert.image?.url ? (
                                                <img src={cert.image.url} alt={cert.name} className="w-10 h-10 object-contain mb-1" />
                                            ) : (
                                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center mb-1 text-lg">🏅</div>
                                            )}
                                            <div className="text-[11px] font-medium leading-tight">{cert.name}</div>
                                            {formData.certificates.includes(cert._id) && (
                                                <div className="text-green-600 text-[10px] mt-0.5">✓</div>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ========== RIGHT COLUMN (1/3 — Sidebar) ========== */}
                    <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
                        {/* Pricing & Stock */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Giá & Kho hàng</h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Danh mục <span className="text-red-500">*</span></label>
                                    <select name="category" value={formData.category} onChange={handleInputChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                                        <option value="">Chọn danh mục</option>
                                        {categories.map((cat) => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Giá (đ) <span className="text-red-500">*</span></label>
                                        <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0" placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Giảm giá (%)</label>
                                        <input type="number" name="discount" value={formData.discount} onChange={handleInputChange} min="0" max="100" placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-xs font-medium text-gray-600">Số lượng tồn kho <span className="text-red-500">*</span></label>
                                        {formData.variants?.length > 0 && <span className="text-[10px] text-gray-500 italic">(Tự động tính từ phân loại)</span>}
                                    </div>
                                    <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} required min="0" placeholder="0" className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 ${formData.variants?.length > 0 ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} disabled={formData.variants?.length > 0} />
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Trạng thái</h2>
                            <div className="space-y-3">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">Hoạt động</div>
                                        <div className="text-xs text-gray-500">Hiển thị trên website</div>
                                    </div>
                                    <div className="relative">
                                        <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="sr-only" />
                                        <div className={`w-10 h-6 rounded-full transition-colors ${formData.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.isActive ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                </label>
                                <div className="border-t border-gray-100"></div>
                                <label className="flex items-center justify-between cursor-pointer">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">Nổi bật</div>
                                        <div className="text-xs text-gray-500">Hiển thị ở trang chủ</div>
                                    </div>
                                    <div className="relative">
                                        <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleInputChange} className="sr-only" />
                                        <div className={`w-10 h-6 rounded-full transition-colors ${formData.isFeatured ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
                                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.isFeatured ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Packaging */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Bao bì</h2>
                            <select name="packaging" value={formData.packaging} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                                <option value="">-- Không chọn --</option>
                                {packagings.map((pkg) => (
                                    <option key={pkg._id} value={pkg._id}>{pkg.name} - {pkg.material}</option>
                                ))}
                            </select>
                        </div>

                        {/* Materials */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Chất liệu</h2>

                            {/* Predefined Materials Grid */}
                            <div className="mb-3">
                                <p className="text-xs text-gray-500 mb-2">Chọn nhanh chất liệu phổ biến:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        'Tre', 'Gỗ', 'Cotton hữu cơ', 'Inox 304',
                                        'Giấy tái chế', 'Sợi dừa', 'Silicone thực phẩm', 'Thủy tinh',
                                        'Vải canvas', 'Lúa mì', 'Sáp ong', 'Bã mía',
                                        'Lá chuối', 'Tinh bột ngô', 'Cọ tự nhiên', 'Cao su tự nhiên',
                                    ].map((mat) => {
                                        const isSelected = formData.materials.includes(mat);
                                        return (
                                            <button
                                                key={mat}
                                                type="button"
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        materials: isSelected
                                                            ? prev.materials.filter(m => m !== mat)
                                                            : [...prev.materials, mat]
                                                    }));
                                                }}
                                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                                    isSelected
                                                        ? 'bg-primary-50 text-primary-700 border-primary-300 shadow-sm'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <span>{mat}</span>
                                                {isSelected && (
                                                    <svg className="w-3 h-3 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Custom Material Input */}
                            <div className="border-t border-gray-100 pt-3">
                                <p className="text-xs text-gray-500 mb-2">Hoặc thêm chất liệu khác:</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={materialInput}
                                        onChange={(e) => setMaterialInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
                                        placeholder="Nhập chất liệu tùy chỉnh..."
                                    />
                                    <button type="button" onClick={addMaterial} className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors">+</button>
                                </div>
                            </div>

                            {/* Selected Materials Display */}
                            {formData.materials.length > 0 && (
                                <div className="mt-3 border-t border-gray-100 pt-3">
                                    <p className="text-xs text-gray-500 mb-1.5">Đã chọn ({formData.materials.length}):</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {formData.materials.map((material, index) => (
                                            <span key={index} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium border border-primary-200">
                                                {material}
                                                <button type="button" onClick={() => removeMaterial(index)} className="text-primary-400 hover:text-primary-600 ml-0.5">×</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
