import React, { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import useGetRestaurantsInfo from "@/hooks/Restaurants/useGetRestaurantsInfo";
import useGetRestaurantMenuByCategory from "@/hooks/Restaurants/useGetRestaurantMenuByCategory";
import Spinner from "@/components/Spinner";
import RestaurantHeader from "@/components/Restaurant/RestaurantHeader";
import MenuNavigation from "@/components/Restaurant/MenuNavigation";
import MenuCategory from "@/components/Restaurant/MenuCategory";
import RestaurantInfoModal from "@/components/Restaurant/RestaurantInfoModal";

export default function RestaurantPage() {
  const { restaurantId } = useParams();
  const { restaurantData, isLoading } = useGetRestaurantsInfo(restaurantId);
  const { menu, isLoading: isLoadingMenu } =
    useGetRestaurantMenuByCategory(restaurantId);

  const [searchQuery, setSearchQuery] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);

  const categories = useMemo(() => {
    if (!menu || menu.length === 0) return [];
    const cats = menu.map((cat) => cat.category);

    return cats.map((cat) => ({
      slug: cat,
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
    }));
  }, [menu]);

  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].slug);
    }
  }, [categories]);

  const filteredMenu = useMemo(() => {
    if (!menu) return [];
    if (!searchQuery) return menu;

    const lowerQuery = searchQuery.toLowerCase();
    return menu
      .map((categoryGroup) => ({
        ...categoryGroup,
        items: categoryGroup.items.filter(
          (item) =>
            item.name.toLowerCase().includes(lowerQuery) ||
            item.description?.toLowerCase().includes(lowerQuery)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [menu, searchQuery]);

  const scrollToCategory = (categorySlug) => {
    setActiveCategory(categorySlug);
    const element = document.getElementById(categorySlug);
    if (element) {
      const offset = 140;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const displayMenu = searchQuery ? filteredMenu : menu;
  if (isLoading || isLoadingMenu) return <Spinner fullScreen />;

  return (
    <div className="min-h-screen bg-white pb-24 text-gray-900 dark:bg-zinc-950 dark:text-gray-100">
      <main className="container mx-auto max-w-4xl px-4">
        <RestaurantHeader
          restaurantData={restaurantData}
          onShowInfoModal={() => setShowInfoModal(true)}
        />

        <MenuNavigation
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          categories={categories}
          activeCategory={activeCategory}
          scrollToCategory={scrollToCategory}
        />

        <div className="mt-8 space-y-12">
          {displayMenu && displayMenu.length > 0 ? (
            displayMenu.map((categoryGroup) => (
              <MenuCategory
                key={categoryGroup.category}
                categoryGroup={categoryGroup}
              />
            ))
          ) : (
            <div className="text-center py-12 text-gray-500">
              {searchQuery
                ? "No items found matching your search."
                : "No menu items available."}
            </div>
          )}
        </div>
      </main>

      <RestaurantInfoModal
        showInfoModal={showInfoModal}
        setShowInfoModal={setShowInfoModal}
        restaurantData={restaurantData}
      />
    </div>
  );
}
