
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Package, Smartphone, BarChart3, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingHero = () => {
  const navigate = useNavigate();

  const handleStartNow = () => {
    navigate('/auth?tab=signup');
  };

  const handleWatchDemo = () => {
    // Scroll to screenshots section
    document.getElementById('screenshots')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Transform Your
              <br />
              <span className="text-blue-500">Warehouse Operations</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Mobile-first WMS that integrates seamlessly with ERPNext. 
              Streamline picking, packing, and inventory management from your phone.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Button
              onClick={handleStartNow}
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white text-lg px-8 py-6 h-auto"
            >
              Start Now - Free Trial
            </Button>
            <Button
              onClick={handleWatchDemo}
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 h-auto"
            >
              Watch Demo
            </Button>
          </motion.div>

          {/* Hero Screenshot */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex justify-center mb-16"
          >
            <div className="relative">
              {/* Main screenshot */}
              <div className="relative w-80 h-96 mx-auto">
                <div className="bg-slate-800 rounded-3xl p-2 shadow-2xl w-80 h-96">
                  <div className="w-full h-full bg-white rounded-2xl overflow-hidden">
                    <img 
                      src="/lovable-uploads/bc19e340-dfe9-40e2-9838-a52edd4879e4.png" 
                      alt="WMS Dashboard" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              
              {/* Floating mini screenshots */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute -left-16 top-16 w-28 h-36 hidden lg:block"
              >
                <div className="bg-slate-800 rounded-2xl p-1 shadow-xl">
                  <div className="w-full h-full bg-white rounded-xl overflow-hidden">
                    <img 
                      src="/lovable-uploads/9d2ccdec-ae7a-4f97-be42-fd56e3be2e03.png" 
                      alt="Item Enquiry" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="absolute -right-16 top-32 w-28 h-36 hidden lg:block"
              >
                <div className="bg-slate-800 rounded-2xl p-1 shadow-xl">
                  <div className="w-full h-full bg-white rounded-xl overflow-hidden">
                    <img 
                      src="/lovable-uploads/843ae785-e73e-47a8-98dd-ea4587d27947.png" 
                      alt="Data Sync" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Floating Feature Icons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            {[
              { icon: Smartphone, label: "Mobile-First", delay: 0.3 },
              { icon: Package, label: "Inventory Control", delay: 0.4 },
              { icon: BarChart3, label: "Real-time Analytics", delay: 0.5 },
              { icon: Zap, label: "ERPNext Integration", delay: 0.6 }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: item.delay }}
                className="flex flex-col items-center p-4 bg-white/90 backdrop-blur-sm rounded-lg border border-gray-200 dark:bg-gray-800/90 dark:border-gray-700"
              >
                <item.icon className="w-8 h-8 text-blue-500 mb-2" />
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingHero;
