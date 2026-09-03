import React from "react";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  ShoppingBag,
} from "lucide-react";
import Logo from "./Navbar/Logo";

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border pt-16 pb-8 ">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <Logo />
            </div>
            <p className="mb-6 max-w-sm text-muted-foreground ">
              The smartest way to order food. Real-time tracking, AI
              recommendations, and fast delivery from your favorite local spots.
            </p>
            <div className="flex gap-4">
              {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="rounded-full bg-muted p-2 text-muted-foreground hover:bg-primary-subtle hover:text-primary transition-colors "
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {["Company", "Product", "Legal"].map((category) => (
            <div key={category}>
              <h4 className="mb-6 font-bold text-foreground ">
                {category}
              </h4>
              <ul className="space-y-4 text-sm text-muted-foreground ">
                {[1, 2, 3, 4].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      {category} Link {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 border-t border-border pt-8 ">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Chow & Go. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-foreground ">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-foreground ">
                Terms of Service
              </a>
              <a href="#" className="hover:text-foreground ">
                Cookie Settings
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
