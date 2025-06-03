
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Warehouse, Package, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';

interface OnboardingCarouselProps {
  onComplete: () => void;
}

const OnboardingCarousel = ({ onComplete }: OnboardingCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: Warehouse,
      title: "Warehouse Management Made Simple",
      description: "Streamline your warehouse operations with our comprehensive WMS solution. Manage inventory, track stock levels, and optimize your warehouse processes.",
      features: ["Real-time inventory tracking", "Automated stock alerts", "Multi-warehouse support"]
    },
    {
      icon: Package,
      title: "Complete Inventory Control",
      description: "Take full control of your inventory with advanced features for receiving, picking, packing, and shipping operations.",
      features: ["Barcode scanning", "Pick list optimization", "Quality control workflows"]
    },
    {
      icon: BarChart3,
      title: "Powerful Reporting & Analytics",
      description: "Get insights into your warehouse performance with comprehensive reports and analytics directly from your ERPNext instance.",
      features: ["Real-time dashboards", "Custom reports", "Performance metrics"]
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Carousel className="w-full">
          <CarouselContent>
            {slides.map((slide, index) => {
              const Icon = slide.icon;
              return (
                <CarouselItem key={index}>
                  <Card className="border-0 shadow-xl">
                    <CardContent className="p-8 md:p-12 text-center">
                      <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                          <Icon className="w-10 h-10 text-white" />
                        </div>
                      </div>
                      
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        {slide.title}
                      </h2>
                      
                      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                        {slide.description}
                      </p>
                      
                      <div className="space-y-3 mb-8">
                        {slide.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center justify-center text-gray-700">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-center space-x-2 mb-8">
                        {slides.map((_, dotIndex) => (
                          <div
                            key={dotIndex}
                            className={`w-3 h-3 rounded-full ${
                              dotIndex === currentSlide ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      
                      <Button 
                        onClick={nextSlide}
                        size="lg"
                        className="px-8"
                      >
                        {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  );
};

export default OnboardingCarousel;
