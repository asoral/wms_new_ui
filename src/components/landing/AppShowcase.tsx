
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Smartphone, Tablet } from 'lucide-react';
import { Button } from '@/components/ui/button';

const screenshots = [
  {
    title: "Dashboard Overview",
    device: "mobile",
    description: "Get a complete view of your warehouse operations at a glance"
  },
  {
    title: "Barcode Scanning",
    device: "mobile", 
    description: "Instantly scan items using your phone's camera"
  },
  {
    title: "Pick List Management",
    device: "tablet",
    description: "Manage pick lists efficiently with tablet interface"
  },
  {
    title: "Stock Count",
    device: "mobile",
    description: "Perform stock counts on the go"
  },
  {
    title: "Inventory Analytics",
    device: "tablet",
    description: "Comprehensive analytics and reporting"
  }
];

const AppShowcase = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % screenshots.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  return (
    <section id="screenshots" className="py-20 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            See WMS in Action
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore our mobile-first interface designed for warehouse professionals.
            Works seamlessly on phones and tablets.
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {/* Device Mockup */}
              <div className={`relative ${screenshots[currentSlide].device === 'mobile' ? 'w-72 h-96' : 'w-96 h-72'} mx-auto`}>
                <div className={`
                  bg-slate-800 rounded-3xl p-2 shadow-2xl
                  ${screenshots[currentSlide].device === 'mobile' ? 'w-72 h-96' : 'w-96 h-72'}
                `}>
                  <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                    <div className="text-center p-8">
                      {screenshots[currentSlide].device === 'mobile' ? (
                        <Smartphone className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                      ) : (
                        <Tablet className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                      )}
                      <h3 className="text-lg font-semibold text-slate-800 mb-2">
                        {screenshots[currentSlide].title}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {screenshots[currentSlide].device === 'mobile' ? 'Mobile View' : 'Tablet View'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="rounded-full"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-1">
                {screenshots[currentSlide].title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {screenshots[currentSlide].description}
              </p>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="rounded-full"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Dots Navigation */}
          <div className="flex justify-center space-x-2">
            {screenshots.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppShowcase;
