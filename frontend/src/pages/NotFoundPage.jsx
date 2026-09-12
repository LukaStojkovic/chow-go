import React from"react";
import { motion } from"framer-motion";
import { Button } from"@/components/ui/button";
import { Card } from"@/components/ui/card";
import { Home, UtensilsCrossed, Frown } from"lucide-react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background relative overflow-hidden">
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ y: [0, 80, 0], x: [0, -40, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease:"linear" }}
          className="absolute top-20 -left-32 w-96 h-96    rounded-full blur-3xl opacity-20 dark:opacity-15"
        />
        <motion.div
          animate={{ y: [0, -60, 0], x: [0, 50, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease:"linear" }}
          className="absolute bottom-20 -right-32 w-80 h-80    rounded-full blur-3xl opacity-15 dark:opacity-10"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl w-full"
      >
        <Card className="bg-card/80 backdrop-blur-xl border border-border/30 shadow-2xl rounded-3xl overflow-hidden">
          <div className="p-8 md:p-16 text-center space-y-8">
            <div className="flex justify-center">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="relative"
              >
                <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center shadow-xl">
                  <Frown className="w-16 h-16 text-primary-foreground" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-2 w-12 h-12 bg-destructive rounded-full flex items-center justify-center"
                >
                  <span className="text-destructive-foreground font-bold text-xl">4</span>
                </motion.div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  className="absolute -top-2 -left-2 w-12 h-12 bg-destructive rounded-full flex items-center justify-center"
                >
                  <span className="text-destructive-foreground font-bold text-xl">4</span>
                </motion.div>
              </motion.div>
            </div>

            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-extrabold">
                Oops!
              </h1>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground ">
                Page Not Found
              </h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Looks like this page took a wrong turn at the kitchen. Don’t
                worry — your food is still on the way!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                className="font-semibold h-14 px-8"
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
              className="mt-12 p-6    rounded-2xl border border-primary"
            >
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-primary" />
                <em>
                  Fun fact: The average pizza delivery is faster than this page
                  load!
                </em>
              </p>
            </motion.div>
          </div>
        </Card>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()}{""}
            <span className="font-semibold text-primary">Chow & Go</span>.
            Still hungry?{""}
            <Link to="/" className="underline hover:text-primary">
              Order now
            </Link>
            .
          </p>
        </div>
      </motion.div>
    </div>
  );
}
