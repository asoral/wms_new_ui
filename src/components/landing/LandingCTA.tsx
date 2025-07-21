
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingCTA = () => {
  const navigate = useNavigate();

  const handleStartNow = () => {
    navigate('/auth?tab=signup');
  };

  const handleLogin = () => {
    navigate('/auth?tab=login');
  };

  return (
    <section className="py-20 bg-gradient-to-br from-blue-500 to-blue-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center text-white"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Warehouse?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Join thousands of warehouse professionals who trust our mobile-first WMS solution 
            to streamline their operations and boost productivity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button
              onClick={handleStartNow}
              size="lg"
              className="bg-white text-blue-500 hover:bg-blue-50 text-lg px-8 py-6 h-auto"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              onClick={handleLogin}
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white/10 text-lg px-8 py-6 h-auto"
            >
              Already have an account? Login
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              "Free 30-day trial",
              "No credit card required",
              "24/7 support included"
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="flex items-center justify-center space-x-2 text-blue-100"
              >
                <CheckCircle className="w-5 h-5" />
                <span>{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LandingCTA;
