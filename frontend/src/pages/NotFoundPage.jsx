import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, UtensilsCrossed, Frown } from "lucide-react";
import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-linear-to-br from-white via-gray-50 to-gray-100 dark:from-[#0a0e27] dark:via-gray-950 dark:to-black relative overflow-hidden">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, 80, 0], x: [0, -40, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 -left-32 w-96 h-96 bg-linear-to-br from-emerald-400 to-teal-500 dark:from-emerald-500/30 dark:to-teal-600/20 rounded-full blur-3xl opacity-20 dark:opacity-15"
        />
        <motion.div
          animate={{ y: [0, -60, 0], x: [0, 50, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-20 -right-32 w-80 h-80 bg-linear-to-br from-orange-400 to-pink-500 dark:from-orange-500/20 dark:to-pink-600/10 rounded-full blur-3xl opacity-15 dark:opacity-10"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl w-full"
      >
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 shadow-2xl rounded-3xl overflow-hidden">
          <div className="p-8 md:p-16 text-center space-y-8">
            <div className="flex justify-center">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="relative"
              >
                <div className="w-32 h-32 bg-linear-to-br from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500 rounded-full flex items-center justify-center shadow-xl">
                  <Frown className="w-16 h-16 text-white" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-2 w-12 h-12 bg-red-500 dark:bg-red-600 rounded-full flex items-center justify-center"
                >
                  <span className="text-white font-bold text-xl">4</span>
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  className="absolute -top-2 -left-2 w-12 h-12 bg-red-500 dark:bg-red-600 rounded-full flex items-center justify-center"
                >
                  <span className="text-white font-bold text-xl">4</span>
                </motion.div>
              </motion.div>
            </div>

            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-extrabold bg-linear-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                Oops!
              </h1>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                Page Not Found
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                Looks like this page took a wrong turn at the kitchen. Don’t
                worry — your food is still on the way!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                className="bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 dark:from-emerald-400 dark:to-teal-500 dark:hover:from-emerald-500 dark:hover:to-teal-600 text-white font-semibold shadow-xl h-14 px-8 rounded-xl"
              >
                <Link to="/">
                  <Home className="w-5 h-5 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-12 p-6 bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-900/50"
            >
              <p className="text-sm text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <em>
                  Fun fact: The average pizza delivery is faster than this page
                  load!
                </em>
              </p>
            </motion.div>
          </div>
        </Card>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()}{" "}
            <span className="font-semibold text-emerald-600">Chow & Go</span>.
            Still hungry?{" "}
            <Link to="/" className="underline hover:text-emerald-600">
              Order now
            </Link>
            .
          </p>
        </div>
      </motion.div>
    </div>
  );
}
