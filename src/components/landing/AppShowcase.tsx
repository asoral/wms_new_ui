
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Smartphone, Tablet } from 'lucide-react';
import { Button } from '@/components/ui/button';

const screenshots = [
  {
    title: "Item Enquiry",
    device: "mobile",
    description: "Check stock levels with barcode scanning or manual search",
    image: "/lovable-uploads/9d2ccdec-ae7a-4f97-be42-fd56e3be2e03.png"
  },
  {
    title: "Data Sync", 
    device: "mobile",
    description: "Real-time synchronization with comprehensive sync status tracking",
    image: "/lovable-uploads/843ae785-e73e-47a8-98dd-ea4587d27947.png"
  },
  {
    title: "Reports & Analytics",
    device: "mobile",
    description: "Comprehensive stock reports and movement analytics",
    image: "/lovable-uploads/f5c40b16-2792-446c-ab04-78da9aa83d96.png"
  },
  {
    title: "Quick Actions",
    device: "mobile",
    description: "Access all warehouse operations with one tap",
    image: "/lovable-uploads/3fa14763-9f4f-46f9-9195-23b6cc645442.png"
  },
  {
    title: "Receive Items",
    device: "tablet",
    description: "Streamlined receiving process with batch tracking",
    image: "/lovable-uploads/7d4d3618-22b9-4278-9134-2276056ce42b.png"
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
                  <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
                    {screenshots[currentSlide].image ? (
                      <img 
                        src={screenshots[currentSlide].image} 
                        alt={screenshots[currentSlide].title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full p-8">
                        <div className="text-center">
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
                    )}
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
