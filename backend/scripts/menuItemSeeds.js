import mongoose from "mongoose";

import dotenv from "dotenv";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";

dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

const menuData = [
  {
    name: "Margherita Pizza",
    description:
      "Classic Italian pizza with tomato sauce, fresh mozzarella, and basil",
    price: 14.99,
    category: "Pizza",
    imageUrls: [
      "https://media.gettyimages.com/id/1414575281/photo/a-delicious-and-tasty-italian-pizza-margherita-with-tomatoes-and-buffalo-mozzarella.jpg?s=612x612&w=gi&k=20&c=_ZfrImbgXOOdZP7wtNL8-4fN846uEcxqNP1AtBIsOuo=",
      "https://media.istockphoto.com/id/1393150881/photo/italian-pizza-margherita-with-cheese-and-tomato-sauce-on-the-board-on-grey-table-macro-close.jpg?s=612x612&w=0&k=20&c=kL0Vhg2XKBjEl__iG8sFv31WTiahdpLc3rTDtNZuD2g=",
    ],
  },
  {
    name: "Pepperoni Pizza",
    description: "Loaded with pepperoni and melted mozzarella cheese",
    price: 16.99,
    category: "Pizza",
    imageUrls: [
      "https://media.istockphoto.com/id/521403691/photo/hot-homemade-pepperoni-pizza.jpg?s=612x612&w=0&k=20&c=PaISuuHcJWTEVoDKNnxaHy7L2BTUkyYZ06hYgzXmTbo=",
      "https://media.istockphoto.com/id/1442417585/photo/person-getting-a-piece-of-cheesy-pepperoni-pizza.jpg?s=612x612&w=0&k=20&c=k60TjxKIOIxJpd4F4yLMVjsniB4W1BpEV4Mi_nb4uJU=",
    ],
  },
  {
    name: "BBQ Chicken Pizza",
    description: "Grilled chicken, BBQ sauce, red onions, and mozzarella",
    price: 17.99,
    category: "Pizza",
    imageUrls: [
      "https://media.istockphoto.com/id/503700873/photo/bbq-chicken-pizza.jpg?s=612x612&w=0&k=20&c=BPm7WhuqfeZ-WFJGLYR9pcJa8uxCjPemXWdnUdzQv18=",
      "https://media.istockphoto.com/id/484538935/photo/homemade-barbecue-chicken-pizza.jpg?s=612x612&w=0&k=20&c=gbLA26zs0o76Ahk3UmmZyf3tyosmp6xz0qgCFxjW3Ao=",
    ],
  },
  {
    name: "Veggie Supreme",
    description: "Bell peppers, olives, mushrooms, onions, and fresh tomatoes",
    price: 15.99,
    category: "Pizza",
    imageUrls: [
      "https://media.istockphoto.com/id/842082336/photo/homemade-veggie-pizza-with-mushrooms-peppers.jpg?s=612x612&w=0&k=20&c=op1vZnGjlB_c3w6Z-ohPo0wn4QveujVKZu4vTZCOWnc=",
      "https://static.vecteezy.com/system/resources/previews/024/342/930/large_2x/delicious-veggie-supreme-pizza-toppings-loaded-with-extra-fresh-ingredients-on-wooden-cutting-board-foodgraphy-generative-ai-photo.jpg",
    ],
  },
  {
    name: "Classic Cheeseburger",
    description:
      "Juicy beef patty, cheddar cheese, lettuce, tomato, and pickles",
    price: 12.99,
    category: "Burgers",
    imageUrls: [
      "https://www.shutterstock.com/image-photo/classic-cheeseburger-french-fries-on-600nw-2528149479.jpg",
      "https://thumbs.dreamstime.com/b/classic-cheeseburger-lettuce-tomato-sesame-seed-bun-food-photography-concept-356083921.jpg",
    ],
  },
  {
    name: "Bacon Deluxe Burger",
    description:
      "Beef patty with crispy bacon, cheddar cheese, and house special sauce",
    price: 14.99,
    category: "Burgers",
    imageUrls: [
      "https://media.istockphoto.com/id/520215281/photo/bacon-burger.jpg?s=612x612&w=0&k=20&c=oeN1zlDU0_CiXXbSaH9ugzdUqaUmaUXUJXmLn-pw4jM=",
      "https://media.istockphoto.com/id/593297080/photo/juicy-gourmet-cheeseburger.jpg?s=612x612&w=0&k=20&c=qZ17Y7cvxm03cn8sOIYWDDQqO-HPw_aQsahX4gswhVo=",
    ],
  },
  {
    name: "Mushroom Swiss Burger",
    description: "Sautéed mushrooms, Swiss cheese, and caramelized onions",
    price: 13.99,
    category: "Burgers",
    imageUrls: [
      "https://www.littlefiggy.com/wp-content/uploads/2021/08/Hamburger-with-mushrooms-and-cheese.jpg",
      "https://media.gettyimages.com/id/182712922/photo/swiss-mushroom-burger.jpg?s=612x612&w=gi&k=20&c=WrXriqe2-kDK93mjvsPZjsPCipxMp0bbqsgQTm126jA=",
    ],
  },
  {
    name: "Vegan Beyond Burger",
    description: "Plant-based patty, avocado, and vegan cheese",
    price: 15.99,
    category: "Burgers",
    imageUrls: [
      "https://media-cdn.tripadvisor.com/media/photo-s/1b/f2/b4/dd/beyond-meat-burger-probably.jpg",
      "https://ca-times.brightspotcdn.com/dims4/default/e8e10ad/2147483647/strip/true/crop/6720x4480+0+0/resize/1200x800!/quality/75/?url=https%3A%2F%2Fcalifornia-times-brightspot.s3.amazonaws.com%2F00%2F78%2Fd24812b147298c627c087b4605da%2Fla-photos-1staff-471414-fi-1105-beyone-meat-03-cmc.jpg",
    ],
  },
  {
    name: "Caesar Salad",
    description: "Romaine lettuce, parmesan, croutons, and Caesar dressing",
    price: 10.99,
    category: "Salads",
    imageUrls: [
      "https://media.istockphoto.com/id/534139231/photo/healthy-grilled-chicken-caesar-salad.jpg?s=612x612&w=0&k=20&c=TR_sE5S5ChmjFywg3dh_J5V_ha-BcwgTU26BvsgbsjY=",
      "https://media.istockphoto.com/id/1337799015/photo/caesar-salad.jpg?s=612x612&w=0&k=20&c=ensriYgRJ9SJctMu3kl7rKn1RPEEBikbkmnAy0JfbSg=",
    ],
  },
  {
    name: "Spaghetti Carbonara",
    description: "Traditional Italian pasta with eggs, pancetta, and parmesan",
    price: 16.99,
    category: "Pasta",
    imageUrls: [
      "https://media.istockphoto.com/id/1581084025/photo/plate-with-spaghetti-carbonara-on-a-laid-table.jpg?s=612x612&w=0&k=20&c=8tKlSwoS2e0TE4N7Hb2wgQnCtnY89hHCQ2WytnWU1ug=",
      "https://media.istockphoto.com/id/177413384/photo/pasta-with-carbonara.jpg?s=612x612&w=0&k=20&c=hhcHoS983ksQwXtVE_RYOA7RgjIxMxZxQiZ_T77l2wE=",
    ],
  },
];

async function seedMenuItems() {
  await connectDB();

  try {
    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      console.error("No restaurant found! Create one first.");
      process.exit(1);
    }

    console.log(`Seeding 30 menu items for restaurant: ${restaurant._id}`);

    const itemsToInsert = menuData.map((item) => ({
      ...item,
      restaurant: restaurant._id,
      owner: restaurant.ownerId,
      available: Math.random() > 0.15,
    }));

    await MenuItem.insertMany(itemsToInsert);
    console.log("Successfully seeded 30 menu items with real images!");
  } catch (error) {
    console.error("Seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedMenuItems();
