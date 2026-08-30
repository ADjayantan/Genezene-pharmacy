'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

const BANNERS = [
  { 
    src: '/banners/banner-welcome-desktop.png', 
    mobileSrc: '/banners/banner-welcome-mobile.png', 
    alt: 'Welcome to Genezenz Pharmacy - Flat 20% off your first order', 
    href: '/products' 
  },
  { 
    src: '/banners/banner-medicines-desktop.png', 
    mobileSrc: '/banners/banner-medicines-mobile.png', 
    alt: 'Genuine Medicines at 18% Off - Upload Rx', 
    href: '/upload-prescription' 
  },
  { 
    src: '/banners/banner-skincare-desktop.png', 
    mobileSrc: '/banners/banner-skincare-mobile.png', 
    alt: 'Radiant Skin, Healthy Glow - Derma & Beauty Care', 
    href: '/products?cat=personal-care' 
  },
  { 
    src: '/banners/banner-active-desktop.png', 
    mobileSrc: '/banners/banner-active-mobile.png', 
    alt: 'Stay Active & Pain-Free - Wellness & Fitness', 
    href: '/products?cat=pain-relief' 
  },
];

export function PromoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-play slideshow logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % BANNERS.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(timer);
  }, []);

  // Sync scroll position with current index
  useEffect(() => {
    if (containerRef.current) {
      const scrollWidth = containerRef.current.clientWidth;
      containerRef.current.scrollTo({
        left: scrollWidth * currentIndex,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  // Handle manual scroll snapping
  const handleScroll = () => {
    if (containerRef.current) {
      const scrollLeft = containerRef.current.scrollLeft;
      const scrollWidth = containerRef.current.clientWidth;
      const newIndex = Math.round(scrollLeft / scrollWidth);
      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
      }
    }
  };

  return (
    <section className="border-b border-paper-edge bg-paper-deep pt-3 pb-3 md:pt-6 md:pb-6 overflow-hidden w-full">
      <div className="container-x relative w-full max-w-full">
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="flex w-full snap-x snap-mandatory overflow-x-auto rounded-lg shadow-sm scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            .flex.snap-x::-webkit-scrollbar { display: none; }
          `}} />
          {BANNERS.map((banner, i) => (
            <Link key={i} href={banner.href} className="w-full min-w-full snap-start shrink-0 block">
              <picture>
                <source media="(max-width: 767px)" srcSet={banner.mobileSrc} />
                <source media="(min-width: 768px)" srcSet={banner.src} />
                <img 
                  src={banner.src} 
                  alt={banner.alt} 
                  className="w-full h-auto aspect-[2/1] object-contain rounded-lg shadow-sm" 
                />
              </picture>
            </Link>
          ))}
        </div>
        
        {/* Pagination Dots */}
        <div className="mt-2 md:mt-4 flex justify-center items-center gap-1">
          {BANNERS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className="p-2 flex items-center justify-center outline-none focus:outline-none"
              aria-label={`Go to slide ${idx + 1}`}
            >
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-6 bg-green' : 'w-2 bg-paper-edge'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
