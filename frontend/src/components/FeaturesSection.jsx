import { Bike, Smartphone, UtensilsCrossed } from "lucide-react";
import React from "react";
import { motion } from "framer-motion";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

export default function FeaturesSection() {
  const features = [
    {
      icon: <Bike className="w-8 h-8" />,
      title: "Lightning Delivery",
      desc: "Average 18 mins from order to doorstep",
      badge: "NEW",
      img: "https://plus.unsplash.com/premium_photo-1673108852141-e8c3c22a4a22?q=80&w=1170&auto=format&fit=crop",
    },
    {
      icon: <UtensilsCrossed className="w-8 h-8" />,
      title: "10,000+ Restaurants",
      desc: "From local gems to national chains",
      badge: "LIVE",
      img: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg",
    },
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "AI-Powered App",
      desc: "Smart recommendations & predictive ordering",
      badge: "AI",
      img: "https://img.freepik.com/premium-photo/happy-business-young-male-enjoying-using-mobile-phone-app-sharing-media-internet-awesome-man-texting-laughing-with-cellphone-outdoors_639864-134.jpg",
    },
  ];

  return (
    <section
      id="features"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-black/30"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            The Future of Food Delivery
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Powered by AI, built for speed, designed for delight.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
            >
              <Card className="group h-full overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white dark:bg-gray-900/90 backdrop-blur-xl">
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={feature.img}
                    alt={feature.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                  <Badge className="absolute top-4 right-4 bg-emerald-600 dark:bg-emerald-500 text-white font-medium shadow-lg">
                    {feature.badge}
                  </Badge>
                </div>

                <div className="p-7">
                  <div className="flex items-center gap-4 mb-5">
                    <div className="p-3.5 bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl text-white shadow-lg">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
