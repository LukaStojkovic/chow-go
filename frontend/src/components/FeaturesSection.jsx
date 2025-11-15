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
      img: "https://plus.unsplash.com/premium_photo-1673108852141-e8c3c22a4a22?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      icon: <UtensilsCrossed className="w-8 h-8" />,
      title: "10,000+ Restaurants",
      desc: "From local gems to national chains",
      badge: "LIVE",
      img: "https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?cs=srgb&dl=pexels-pixabay-262978.jpg&fm=jpg",
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
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            The Future of Food Delivery
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powered by AI, built for speed, designed for delight.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="group hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden h-full">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={feature.img}
                    alt={feature.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  <Badge className="absolute top-4 right-4 bg-emerald-600 text-white">
                    {feature.badge}
                  </Badge>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-linear-to-br from-emerald-500 to-teal-600 rounded-xl text-white">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
