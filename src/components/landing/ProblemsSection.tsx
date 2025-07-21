
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

const problems = [
  {
    problem: "Manual paperwork slows down operations",
    solution: "Digital workflows on mobile devices",
    impact: "50% faster processing"
  },
  {
    problem: "Inventory errors and stock-outs",
    solution: "Real-time tracking and alerts",
    impact: "95% inventory accuracy"
  },
  {
    problem: "Disconnected systems and data silos",
    solution: "Seamless ERPNext integration",
    impact: "Single source of truth"
  },
  {
    problem: "Inefficient picking and packing",
    solution: "Optimized pick lists and routes",
    impact: "30% productivity increase"
  }
];

const ProblemsSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Common Warehouse Challenges, Solved
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Transform your warehouse operations from chaotic to efficient with our mobile-first approach.
          </p>
        </motion.div>

        <div className="space-y-8">
          {problems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center"
            >
              {/* Problem */}
              <div className="flex items-center space-x-4 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Problem</h3>
                  <p className="text-sm text-muted-foreground">{item.problem}</p>
                </div>
              </div>

              {/* Solution */}
              <div className="flex items-center space-x-4 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <CheckCircle className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Solution</h3>
                  <p className="text-sm text-muted-foreground">{item.solution}</p>
                </div>
              </div>

              {/* Impact */}
              <div className="flex items-center space-x-4 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <TrendingUp className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Impact</h3>
                  <p className="text-sm text-muted-foreground">{item.impact}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemsSection;
