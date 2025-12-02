import { ChefHat, Clock, Shield, Star, TrendingUp, Zap } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";

export default function ProsSection() {
  const features = [
    {
      icon: Clock,
      title: "Lightning Fast",
      description:
        "Get your food delivered in 30 minutes or less. We prioritize speed without compromising quality.",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: ChefHat,
      title: "Top Restaurants",
      description:
        "Order from the best restaurants in your area. Curated selection of quality establishments.",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Shield,
      title: "Secure & Safe",
      description:
        "Your data and payments are protected with industry-leading security measures.",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: Zap,
      title: "Real-time Tracking",
      description:
        "Track your order in real-time from kitchen to your doorstep. Never wonder where your food is.",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Star,
      title: "Premium Quality",
      description:
        "Only the finest ingredients and most trusted restaurants. Quality guaranteed.",
      color: "from-yellow-500 to-orange-500",
    },
    {
      icon: TrendingUp,
      title: "Best Prices",
      description:
        "Competitive prices with exclusive deals and discounts. More value for your money.",
      color: "from-indigo-500 to-blue-500",
    },
  ];

  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Why Choose <span className="linear-text">Chow&Go</span>?
            </h2>
            <p className="text-lg text-muted-foreground">
              Experience the best food delivery service
            </p>
          </motion.div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-300 hover:shadow-2xl"
                >
                  <div
                    className={`absolute inset-0 bg-linear-to-br ${feature.color} opacity-0 transition-opacity duration-300 group-hover:opacity-10`}
                  />
                  <div className="relative z-10">
                    <div
                      className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br ${feature.color} shadow-lg`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
