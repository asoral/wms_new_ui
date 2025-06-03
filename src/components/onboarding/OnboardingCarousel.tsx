
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, CheckCircle, Smartphone, BarChart3, Package } from 'lucide-react';

interface OnboardingCarouselProps {
  onComplete: () => void;
}

const OnboardingCarousel = ({ onComplete }: OnboardingCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: Smartphone,
      title: "Mobile Warehouse Management",
      description: "Transform your warehouse operations with powerful mobile capabilities. Scan barcodes, manage inventory, and track stock levels in real-time from any device.",
      features: ["📱 Mobile-first design", "📊 Real-time inventory tracking", "🔄 Instant sync with ERPNext"],
      image: "📱",
      bgGradient: "from-blue-500 to-purple-600"
    },
    {
      icon: Package,
      title: "Complete Inventory Control",
      description: "Take full control of your inventory with advanced features for receiving, picking, packing, and shipping operations directly from your mobile device.",
      features: ["📦 Barcode scanning", "📋 Pick list optimization", "✅ Quality control workflows"],
      image: "📦",
      bgGradient: "from-green-500 to-teal-600"
    },
    {
      icon: BarChart3,
      title: "Powerful Reporting & Analytics",
      description: "Get insights into your warehouse performance with comprehensive reports and analytics directly from your ERPNext instance, accessible anywhere.",
      features: ["📈 Real-time dashboards", "📊 Custom reports", "⚡ Performance metrics"],
      image: "📊",
      bgGradient: "from-orange-500 to-red-600"
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="border-0 shadow-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className={`bg-gradient-to-r ${currentSlideData.bgGradient} text-white p-8 text-center`}>
              <div className="text-6xl mb-4">{currentSlideData.image}</div>
              <h2 className="text-3xl font-bold mb-4">
                {currentSlideData.title}
              </h2>
              <p className="text-xl opacity-90 max-w-2xl mx-auto">
                {currentSlideData.description}
              </p>
            </div>
            
            <div className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-6">Key Features:</h3>
                  <div className="space-y-4">
                    {currentSlideData.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center text-gray-700">
                        <CheckCircle className="w-6 h-6 text-green-500 mr-4 flex-shrink-0" />
                        <span className="text-lg">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl p-8 shadow-inner">
                    <div className="text-8xl mb-4">📱</div>
                    <div className="text-sm text-gray-600">
                      {currentSlide === 0 && "Scan items instantly with your mobile camera"}
                      {currentSlide === 1 && "Manage complex inventory operations with ease"}
                      {currentSlide === 2 && "Access powerful analytics on the go"}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Progress indicators */}
              <div className="flex justify-center space-x-3 my-8">
                {slides.map((_, dotIndex) => (
                  <button
                    key={dotIndex}
                    onClick={() => setCurrentSlide(dotIndex)}
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                      dotIndex === currentSlide 
                        ? 'bg-blue-600 transform scale-125' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              
              {/* Navigation buttons */}
              <div className="flex justify-between items-center">
                <Button 
                  onClick={prevSlide}
                  variant="outline"
                  disabled={currentSlide === 0}
                  className="px-6"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                <div className="text-sm text-gray-500">
                  {currentSlide + 1} of {slides.length}
                </div>
                
                <Button 
                  onClick={nextSlide}
                  size="lg"
                  className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingCarousel;
