
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const benefits = [
  {
    number: 50,
    suffix: "%",
    label: "Faster Processing",
    description: "Reduce manual paperwork and streamline workflows"
  },
  {
    number: 95,
    suffix: "%",
    label: "Inventory Accuracy",
    description: "Real-time tracking eliminates counting errors"
  },
  {
    number: 30,
    suffix: "%",
    label: "Productivity Increase",
    description: "Optimized picking routes and mobile access"
  },
  {
    number: 24,
    suffix: "/7",
    label: "System Availability",
    description: "Cloud-based solution with 99.9% uptime"
  }
];

const AnimatedCounter = ({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    
    requestAnimationFrame(step);
  }, [isVisible, end, duration]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      onViewportEnter={() => setIsVisible(true)}
      className="text-center"
    >
      <div className="text-4xl md:text-6xl font-bold text-blue-600 mb-2">
        {count}{suffix}
      </div>
    </motion.div>
  );
};

const BenefitsSection = () => {
  return (
    <section id="benefits" className="py-20 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Proven Results for Your Warehouse
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join hundreds of warehouses that have transformed their operations with our mobile-first WMS solution.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="text-center p-6 bg-card rounded-lg border border-border"
            >
              <AnimatedCounter end={benefit.number} suffix={benefit.suffix} />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {benefit.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* ROI Calculator Teaser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Calculate Your ROI
            </h3>
            <p className="text-muted-foreground mb-6">
              Most warehouses see a complete return on investment within 3-6 months.
              See how much you could save with our WMS solution.
            </p>
            <div className="text-3xl font-bold text-blue-600 mb-4">
              Average ROI: 300%
            </div>
            <p className="text-sm text-muted-foreground">
              Based on reduced labor costs, improved accuracy, and increased throughput
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default BenefitsSection;
