import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const FOOD_ITEMS = [
  {
    url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80",
    title: "Gourmet Pizza",
    desc: "Italian classics handmade",
    price: "$12.99",
  },
  {
    url: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=800&q=80",
    title: "Juicy Burgers",
    desc: "100% Angus beef patties",
    price: "$14.50",
  },
  {
    url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
    title: "Fresh Sushi",
    desc: "Daily fresh catch",
    price: "$22.00",
  },
  {
    url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
    title: "Pasta Delights",
    desc: "Authentic creamy sauces",
    price: "$16.80",
  },
  {
    url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&q=80",
    title: "Tasty Tacos",
    desc: "Spicy & crunchy mix",
    price: "$9.50",
  },
  {
    url: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&q=80",
    title: "Sweet Desserts",
    desc: "Decadent chocolate treats",
    price: "$8.00",
  },
];

export default function FeaturesSection() {
  return (
    <section className="relative py-24 bg-muted ">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 flex flex-col items-center justify-between gap-4 md:flex-row md:items-end">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl ">
              Explore Our Menu
            </h2>
            <p className="mt-4 text-lg text-muted-foreground ">
              Discover delicious dishes from top-rated restaurants near you.
            </p>
          </motion.div>

          <button className="group flex items-center gap-2 font-semibold text-primary transition-colors hover:text-primary">
            View all categories
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FOOD_ITEMS.map((food, index) => (
            <FoodCard key={index} {...food} delay={index * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FoodCard({ url, title, desc, price, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      className="group relative cursor-pointer overflow-hidden rounded-3xl bg-card shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border "
    >
      {/* Image Area */}
      <div className="aspect-4/3 overflow-hidden">
        <img
          src={url}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </div>

      {/* Content Area */}
      <div className="p-6">
        <div className="mb-2 flex items-start justify-between">
          <h3 className="text-xl font-bold text-foreground ">
            {title}
          </h3>
          <span className="rounded-full bg-primary-subtle px-3 py-1 text-sm font-bold text-primary ">
            {price}
          </span>
        </div>
        <p className="text-muted-foreground ">{desc}</p>
      </div>
    </motion.div>
  );
}
