
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
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 pt-16">
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
              <span className="text-blue-600">Warehouse Operations</span>
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
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6 h-auto"
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
                className="flex flex-col items-center p-4 bg-background/80 backdrop-blur-sm rounded-lg border border-border"
              >
                <item.icon className="w-8 h-8 text-blue-600 mb-2" />
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
