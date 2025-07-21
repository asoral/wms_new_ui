import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const screenshots = [
  {
    id: 1,
    title: "Dashboard",
    description: "Real-time warehouse analytics and inventory overview",
    image: "/lovable-uploads/88fecf3a-df0a-43e3-aa0a-da9300c4791a.png"
  },
  {
    id: 2,
    title: "Stock Aging Analysis", 
    description: "Monitor inventory aging with ABC analysis",
    image: "/lovable-uploads/7d66b2b1-fc93-4ec5-950e-63b09ee09e91.png"
  },
  {
    id: 3,
    title: "Quick Actions",
    description: "Access all warehouse operations with one tap",
    image: "/lovable-uploads/48c564b4-0369-4a3b-9728-eae8d0ea27ca.png"
  },
  {
    id: 4,
    title: "Item Enquiry",
    description: "Check stock levels with barcode scanning",
    image: "/lovable-uploads/22bfc219-584c-445f-af62-b99aeabb1cc4.png"
  },
  {
    id: 5,
    title: "Barcode Scanner",
    description: "Fast and accurate barcode scanning",
    image: "/lovable-uploads/c4b1879c-e4de-4b32-84e8-1ab407c70933.png"
  },
  {
    id: 6,
    title: "Data Sync",
    description: "Real-time synchronization with ERPNext",
    image: "/lovable-uploads/7d8c35c7-dbd0-43b9-ba08-fad3ca1b8ec9.png"
  },
  {
    id: 7,
    title: "Reports",
    description: "Comprehensive warehouse reports",
    image: "/lovable-uploads/0bde32a5-442a-4810-99dd-86e8c096a435.png"
  },
  {
    id: 8,
    title: "Receive Items",
    description: "Streamlined receiving process",
    image: "/lovable-uploads/91b96a20-336c-49f6-b5dd-71a3af1d6ca5.png"
  }
];

const IPhoneCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const totalItems = screenshots.length;
  const angle = 360 / totalItems;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 bg-gradient-to-br from-background via-background/50 to-primary/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Experience WMS on Mobile
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Designed specifically for mobile-first warehouse operations. 
            See how our intuitive interface makes complex tasks simple.
          </p>
        </div>

        <div className="relative flex justify-center items-center min-h-[700px]">
          {/* iPhone mockup container */}
          <div className="relative w-80 h-[640px]">
            
            {/* Screenshot display area - positioned inside iPhone frame */}
            <div className="absolute top-[60px] left-[32px] w-[256px] h-[520px] rounded-[32px] overflow-hidden bg-black z-10">
              <img
                src={screenshots[currentIndex].image}
                alt={screenshots[currentIndex].title}
                className="w-full h-full object-cover transition-all duration-700 ease-in-out"
              />
            </div>
            
            {/* iPhone Frame overlay - positioned on top */}
            <div 
              className="absolute inset-0 z-20 pointer-events-none bg-contain bg-center bg-no-repeat"
              style={{
                backgroundImage: "url('/lovable-uploads/cc9b6f0e-9234-48d1-8b25-6e977b364d50.png')",
              }}
            />
          </div>

          {/* Side thumbnails for visual depth */}
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 hidden lg:block">
            <div className="space-y-4 transform -translate-x-8 rotate-12 opacity-30">
              {screenshots.slice(Math.max(0, currentIndex - 2), currentIndex).map((screenshot, index) => (
                <div
                  key={`left-${screenshot.id}`}
                  className="w-16 h-28 rounded-lg overflow-hidden shadow-lg cursor-pointer transition-all duration-300 hover:scale-110 hover:opacity-60"
                  onClick={() => goToSlide(Math.max(0, currentIndex - 2) + index)}
                >
                  <img 
                    src={screenshot.image} 
                    alt={screenshot.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 hidden lg:block">
            <div className="space-y-4 transform translate-x-8 -rotate-12 opacity-30">
              {screenshots.slice(currentIndex + 1, Math.min(screenshots.length, currentIndex + 3)).map((screenshot, index) => (
                <div
                  key={`right-${screenshot.id}`}
                  className="w-16 h-28 rounded-lg overflow-hidden shadow-lg cursor-pointer transition-all duration-300 hover:scale-110 hover:opacity-60"
                  onClick={() => goToSlide(currentIndex + 1 + index)}
                >
                  <img 
                    src={screenshot.image} 
                    alt={screenshot.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-background/80 backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* Dot indicators */}
          <div className="flex gap-2 mx-4">
            {screenshots.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-primary scale-125 shadow-lg'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-background/80 backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Current slide info */}
        <div className="text-center mt-8">
          <h3 className="text-2xl font-semibold text-foreground mb-2">
            {screenshots[currentIndex].title}
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {screenshots[currentIndex].description}
          </p>
        </div>

        {/* Instructions */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>Use arrows or dots to navigate • Auto-rotates every 4 seconds</p>
        </div>
      </div>
    </section>
  );
};

export default IPhoneCarousel;