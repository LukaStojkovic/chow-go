import { ChefHat, Clock, Shield, Star, TrendingUp, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import React from "react";
import { motion } from "framer-motion";

export default function ProsSection() {
  const { t } = useTranslation(["landing", "common"]);
  // Keys rather than copy: this list is rebuilt on every render, so it picks
  // up a language change without any extra wiring.
  const features = [
    { icon: Clock, key: "fast" },
    { icon: ChefHat, key: "restaurants" },
    { icon: Shield, key: "secure" },
    { icon: Zap, key: "tracking" },
    { icon: Star, key: "quality" },
    { icon: TrendingUp, key: "prices" },
  ].map((entry) => ({
    ...entry,
    title: t(`pros.${entry.key}.title`),
    description: t(`pros.${entry.key}.description`),
    color: " ",
  }));

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
              {t("pros.headingBefore")}{" "}
              <span className="linear-text">{t("app.name")}</span>
              {t("pros.headingAfter")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("pros.subheading")}
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
                    className={`absolute inset-0  ${feature.color} opacity-0 transition-opacity duration-300 group-hover:opacity-10`}
                  />
                  <div className="relative z-10">
                    <div
                      className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl  ${feature.color} shadow-lg`}
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
