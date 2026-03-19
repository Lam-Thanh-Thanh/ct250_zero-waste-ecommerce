import React, { useState, useEffect } from "react";
import axios from "axios";

const DynamicBanner = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Lấy API_URL từ biến môi trường tương tự như các file API khác
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    
    axios.get(`${API_URL}/banners`)
      .then(res => {
        // Backend trả về { success: true, count: X, data: [...] }
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          setBanners(res.data.data);
        } else if (Array.isArray(res.data)) {
          setBanners(res.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Banner fetch failed", err);
        setLoading(false);
      });
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (loading) return <div className="h-[500px] w-full bg-gray-200 animate-pulse" />;
  if (!banners || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative h-[500px] w-full bg-slate-900 overflow-hidden group">
      {/* Background Images */}
      {banners.map((banner, idx) => (
        <div 
          key={banner._id || idx}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
        >
          <img 
            src={banner.image} 
            alt={banner.title}
            className="absolute inset-0 w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        </div>
      ))}

      {/* Content Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-center px-4 transition-all duration-500">
        <h1 
          key={`title-${currentIndex}`}
          className="text-5xl md:text-7xl font-black text-white drop-shadow-lg mb-4 animate-fade-in-up"
        >
          {currentBanner.title}
        </h1>
        <p 
          key={`subtitle-${currentIndex}`}
          className="text-xl text-gray-200 mb-8 max-w-2xl animate-fade-in-up animation-delay-200"
        >
          {currentBanner.subtitle}
        </p>
        {(currentBanner.link || currentBanner.buttonText) && (
          <a 
            key={`btn-${currentIndex}`}
            href={currentBanner.link || '#'}
            className="bg-green-600 hover:bg-green-500 text-white px-10 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg animate-fade-in-up animation-delay-400"
          >
            {currentBanner.buttonText || 'Khám phá ngay'}
          </a>
        )}
      </div>

      {/* Navigation Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center space-x-3">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'bg-green-500 w-8' : 'bg-white/50 hover:bg-white'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DynamicBanner;