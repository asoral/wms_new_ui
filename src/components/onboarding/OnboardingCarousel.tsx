
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
      <div className="w-full max-w-sm mx-auto">
        <Card className="border-0 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            {/* Mobile-First Hero Section */}
            <div className={`bg-gradient-to-r ${currentSlideData.bgGradient} text-white p-6 text-center`}>
              <div className="text-4xl mb-3">{currentSlideData.image}</div>
              <h2 className="text-xl font-bold mb-2 leading-tight">
                {currentSlideData.title}
              </h2>
              <p className="text-sm opacity-90 leading-relaxed">
                {currentSlideData.description}
              </p>
            </div>
            
            {/* Mobile-Optimized Content */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Features:</h3>
              <div className="space-y-3 mb-6">
                {currentSlideData.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
              
              {/* Mobile Device Mockup */}
              <div className="text-center mb-6">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-6 shadow-inner">
                  <div className="text-5xl mb-2">📱</div>
                  <div className="text-xs text-gray-600 leading-relaxed">
                    {currentSlide === 0 && "Scan items instantly with your mobile camera"}
                    {currentSlide === 1 && "Manage complex inventory operations with ease"}
                    {currentSlide === 2 && "Access powerful analytics on the go"}
                  </div>
                </div>
              </div>
              
              {/* Progress indicators */}
              <div className="flex justify-center space-x-2 mb-6">
                {slides.map((_, dotIndex) => (
                  <button
                    key={dotIndex}
                    onClick={() => setCurrentSlide(dotIndex)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      dotIndex === currentSlide 
                        ? 'bg-blue-600' 
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              
              {/* Mobile-First Navigation */}
              <div className="space-y-3">
                <Button 
                  onClick={nextSlide}
                  size="lg"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base py-3"
                >
                  {currentSlide === slides.length - 1 ? 'Start Now' : 'Next'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                
                {currentSlide > 0 && (
                  <Button 
                    onClick={prevSlide}
                    variant="outline"
                    className="w-full"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}
                
                <div className="text-center text-xs text-gray-500 pt-2">
                  {currentSlide + 1} of {slides.length}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingCarousel;
