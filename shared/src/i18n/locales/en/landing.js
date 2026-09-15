/** The marketing page: hero, feature grid, proof points and footer. */

export default {
  hero: {
    badge: "Food delivery revolutionized",
    headline: "Craving food?",
    headlineAccent: "We'll handle it.",
    subheadline:
      "Order from the best local restaurants with easy, on-demand delivery. Fresh food, delivered straight to your doorstep in minutes.",
    portalGreeting: "Welcome back, {{name}}",
    portalBody:
      "Access your administration portal to manage orders, menus, and deliveries.",
    portalSeller: "Go to seller portal",
    portalCourier: "Go to courier dashboard",
  },

  features: {
    heading: "Explore our menu",
    subheading: "Discover delicious dishes from top-rated restaurants near you.",
    viewAll: "View all categories",
    items: {
      pizza: { title: "Gourmet pizza", desc: "Italian classics handmade" },
      burgers: { title: "Juicy burgers", desc: "100% Angus beef patties" },
      sushi: { title: "Fresh sushi", desc: "Daily fresh catch" },
      pasta: { title: "Pasta delights", desc: "Authentic creamy sauces" },
      tacos: { title: "Tasty tacos", desc: "Spicy and crunchy mix" },
      desserts: { title: "Sweet desserts", desc: "Decadent chocolate treats" },
    },
  },

  pros: {
    headingBefore: "Why choose",
    headingAfter: "?",
    subheading: "Experience the best food delivery service",
    fast: {
      title: "Lightning fast",
      description:
        "Get your food delivered in 30 minutes or less. We prioritize speed without compromising quality.",
    },
    restaurants: {
      title: "Top restaurants",
      description:
        "Order from the best restaurants in your area. Curated selection of quality establishments.",
    },
    secure: {
      title: "Secure & safe",
      description:
        "Your data and payments are protected with industry-leading security measures.",
    },
    tracking: {
      title: "Real-time tracking",
      description:
        "Track your order in real time from kitchen to your doorstep. Never wonder where your food is.",
    },
    quality: {
      title: "Premium quality",
      description:
        "Only the finest ingredients and most trusted restaurants. Quality guaranteed.",
    },
    prices: {
      title: "Best prices",
      description:
        "Competitive prices with exclusive deals and discounts. More value for your money.",
    },
  },

  stats: {
    sectionLabel: "Chow & Go by the numbers",
    rating: "App rating",
    customers: "Active customers",
    ordersDaily: "Orders every day",
    averageDelivery: "Average delivery",
  },

  reputation: {
    customers: "<0>{{count}}</0> happy customers",
    averageDelivery: "<0>{{minutes}} min</0> avg. delivery",
  },

  footer: {
    tagline:
      "The smartest way to order food. Real-time tracking, AI recommendations, and fast delivery from your favourite local spots.",
    privacy: "Privacy policy",
    terms: "Terms of service",
    cookies: "Cookie settings",
  },
};
