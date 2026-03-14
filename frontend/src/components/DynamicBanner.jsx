import React, { useState,useEffect } from "react";
import axios from "axios";

const DynamicBanner = () => {
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace with your actual API URL
    axios.get('http://localhost:5000/api/banners/ ')
      .then(res => {
        setBanner(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Banner fetch failed", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="h-96 bg-gray-200 animate-pulse" />;
  if (!banner) return null;

  return (
    <div className="relative h-[500px] w-full bg-slate-900 overflow-hidden">
      {/* Background Image */}
      <img 
        src={banner.image} 
        alt={banner.title}
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      />

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
        <h1 className="text-5xl md:text-7xl font-black text-white drop-shadow-lg mb-4">
          {banner.title}
        </h1>
        <p className="text-xl text-gray-200 mb-8 max-w-xl">
          {banner.subtitle}
        </p>
        <a 
          href={banner.link}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-full font-bold transition-all transform hover:scale-105"
        >
          {banner.buttonText}
        </a>
      </div>
    </div>
  );
};

export default DynamicBanner;