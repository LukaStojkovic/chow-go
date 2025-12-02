import React from "react";
import { motion } from "framer-motion";
import { FoodCard } from "./FoodCart";

export default function FeaturesSection() {
  const foodImages = [
    {
      url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop",
      title: "Gourmet Pizza",
    },
    {
      url: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&h=600&fit=crop",
      title: "Juicy Burgers",
    },
    {
      url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop",
      title: "Fresh Sushi",
    },
    {
      url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop",
      title: "Pasta Delights",
    },
    {
      url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=600&fit=crop",
      title: "Tasty Tacos",
    },
    {
      url: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop",
      title: "Sweet Desserts",
    },
  ];

  return (
    <section className="relative overflow-hidden border-b py-20 md:py-32">
      <div className="absolute inset-0 brush-bg opacity-50" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="gradient-text">Explore Our Menu</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Discover delicious dishes from top-rated restaurants
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 justify-items-center">
          {foodImages.map((food, index) => (
            <div key={index} className="w-full max-w-sm">
              <FoodCard
                image={food.url}
                title={food.title}
                delay={index * 0.15}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
