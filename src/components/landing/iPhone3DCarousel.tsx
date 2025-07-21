import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const iPhone3DCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % screenshots.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % screenshots.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Experience WMS on Mobile
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Designed specifically for mobile-first warehouse operations. 
            See how our intuitive interface makes complex tasks simple.
          </p>
        </motion.div>

        <div className="relative flex items-center justify-center">
          {/* Left Stack - Previous Screenshots */}
          <div className="hidden lg:flex absolute left-0 z-10 space-x-4">
            {screenshots.slice(Math.max(0, currentIndex - 2), currentIndex).map((screenshot, index) => (
              <motion.div
                key={screenshot.id}
                initial={{ opacity: 0, x: -100, rotateY: -45 }}
                animate={{ 
                  opacity: 0.6, 
                  x: 0, 
                  rotateY: -25 - (index * 10),
                  scale: 0.7 - (index * 0.1)
                }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="w-48 h-96 rounded-3xl overflow-hidden shadow-xl cursor-pointer"
                onClick={() => goToSlide(Math.max(0, currentIndex - 2) + index)}
                style={{
                  transform: `perspective(1000px) rotateY(${-25 - (index * 10)}deg) scale(${0.7 - (index * 0.1)})`
                }}
              >
                <img 
                  src={screenshot.image} 
                  alt={screenshot.title}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </div>

          {/* Center iPhone with Current Screenshot */}
          <motion.div 
            className="relative z-20 flex items-center justify-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative w-80 h-[640px]">
              {/* iPhone Frame - Using generated mockup */}
              <div className="absolute inset-0 z-30 bg-black rounded-[3rem] p-2">
                <div className="w-full h-full bg-gray-900 rounded-[2.5rem] relative overflow-hidden">
                  {/* Notch */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-black rounded-full z-40"></div>
                  
                  {/* Screenshot Content */}
                  <div className="absolute inset-0 z-20 rounded-[2.5rem] overflow-hidden">
                    <AnimatePresence mode="wait" custom={direction}>
                      <motion.img
                        key={currentIndex}
                        src={screenshots[currentIndex].image}
                        alt={screenshots[currentIndex].title}
                        custom={direction}
                        initial={{ opacity: 0, x: direction > 0 ? 300 : -300 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction > 0 ? -300 : 300 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="w-full h-full object-cover"
                      />
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Stack - Next Screenshots */}
          <div className="hidden lg:flex absolute right-0 z-10 space-x-4">
            {screenshots.slice(currentIndex + 1, Math.min(screenshots.length, currentIndex + 3)).map((screenshot, index) => (
              <motion.div
                key={screenshot.id}
                initial={{ opacity: 0, x: 100, rotateY: 45 }}
                animate={{ 
                  opacity: 0.6, 
                  x: 0, 
                  rotateY: 25 + (index * 10),
                  scale: 0.7 - (index * 0.1)
                }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="w-48 h-96 rounded-3xl overflow-hidden shadow-xl cursor-pointer"
                onClick={() => goToSlide(currentIndex + 1 + index)}
                style={{
                  transform: `perspective(1000px) rotateY(${25 + (index * 10)}deg) scale(${0.7 - (index * 0.1)})`
                }}
              >
                <img 
                  src={screenshot.image} 
                  alt={screenshot.title}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            ))}
          </div>

          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            className="absolute left-4 lg:left-80 z-30 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            className="absolute right-4 lg:right-80 z-30 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Content Description */}
        <motion.div 
          className="text-center mt-12"
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h3 className="text-2xl font-semibold text-foreground mb-2">
            {screenshots[currentIndex].title}
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {screenshots[currentIndex].description}
          </p>
        </motion.div>

        {/* Dots Navigation */}
        <div className="flex justify-center space-x-2 mt-8">
          {screenshots.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-blue-500 scale-125' 
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default iPhone3DCarousel;