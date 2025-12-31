import React from "react";
import { Plus, ShoppingBag } from "lucide-react";

const MenuCategory = ({ categoryGroup }) => {
  const categoryName =
    categoryGroup.category.charAt(0).toUpperCase() +
    categoryGroup.category.slice(1);

  return (
    <section id={categoryGroup.category} className="scroll-mt-36">
      <h3 className="mb-5 text-xl font-bold flex items-center gap-2">
        {categoryName}
        <span className="text-sm font-normal text-gray-500">
          ({categoryGroup.items.length} items)
        </span>
      </h3>
      <div className="grid gap-5 md:grid-cols-2">
        {categoryGroup.items.map((item) => (
          <div
            key={item._id}
            className="group flex cursor-pointer justify-between gap-4 rounded-xl border border-transparent bg-white p-4 shadow-sm transition-all hover:border-blue-100 hover:shadow-md dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-gray-50">
                  {item.name}
                </h4>
                {item.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2 dark:text-gray-400">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="mt-3 font-bold text-lg text-gray-900 dark:text-gray-100">
                ${item.price.toFixed(2)}
              </div>
            </div>

            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-zinc-800">
              {item.imageUrls && item.imageUrls[0] ? (
                <img
                  src={item.imageUrls[0]}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">
                  <ShoppingBag className="h-10 w-10 opacity-20" />
                </div>
              )}
              <button className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg transition-transform active:scale-95 hover:shadow-xl dark:bg-zinc-800">
                <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MenuCategory;
