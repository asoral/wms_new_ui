
import { motion } from 'framer-motion';
import { 
  Smartphone, 
  Package, 
  BarChart3, 
  CheckCircle, 
  Truck, 
  ClipboardList,
  Database,
  Zap
} from 'lucide-react';

const features = [
  {
    icon: Smartphone,
    title: "Mobile Barcode Scanning",
    description: "Scan barcodes instantly using your phone's camera. No additional hardware required."
  },
  {
    icon: Zap,
    title: "Real-time ERPNext Sync",
    description: "Seamlessly sync with your ERPNext system. All changes reflect immediately across platforms."
  },
  {
    icon: ClipboardList,
    title: "Pick List Management",
    description: "Create and manage pick lists efficiently. Track progress and optimize picking routes."
  },
  {
    icon: Package,
    title: "Inventory Tracking",
    description: "Monitor stock levels in real-time. Get alerts for low stock and reorder points."
  },
  {
    icon: CheckCircle,
    title: "Quality Control",
    description: "Implement quality checks at every stage. Maintain product standards and compliance."
  },
  {
    icon: Database,
    title: "Stock Counting",
    description: "Perform cycle counts and physical inventory audits with mobile-friendly interfaces."
  },
  {
    icon: Truck,
    title: "Delivery Management",
    description: "Track deliveries and manage shipments from creation to completion."
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Get insights into warehouse performance with comprehensive reporting tools."
  }
];

const LandingFeatures = () => {
  return (
    <section id="features" className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need for Modern Warehouse Management
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our comprehensive WMS solution covers all aspects of warehouse operations,
            from receiving to shipping, all from your mobile device.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingFeatures;
