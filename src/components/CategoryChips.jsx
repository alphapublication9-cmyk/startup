import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export const CategoryChips = ({ categories, selectedCategory, onSelectCategory, products }) => {
  const getProductCount = (categoryName) => {
    if (categoryName === "All") return products.length;
    return products.filter(p => p.category && p.category.trim().toLowerCase() === categoryName.trim().toLowerCase()).length;
  };

  // Convert categories list to standard objects with name, icon, image
  const categoryList = [
    { id: 'all', name: 'All', icon: '✨', description: 'All Women Fashion' },
    ...categories.map((cat, idx) => {
      if (typeof cat === 'string') {
        return { id: `cat-${idx}`, name: cat, icon: '👗', description: cat };
      }
      return cat;
    })
  ];

  return (
    <div className="container mx-auto px-4 mb-8">
      
      {/* Category Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs uppercase tracking-widest font-bold text-stone-600 flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-600" />
          <span>Women's Fashion Collections</span>
        </h2>
        <span className="text-xs text-stone-500 font-medium">
          Showing {getProductCount(selectedCategory)} Items
        </span>
      </div>

      {/* Horizontal Pill Scroller */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0">
        {categoryList.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          const count = getProductCount(cat.name);

          return (
            <motion.button
              key={cat.id || cat.name}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectCategory(cat.name)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all duration-300 border shadow-xs cursor-pointer ${
                isSelected
                  ? 'royal-maroon-bg text-gold-100 border-gold-400/50 shadow-md scale-105'
                  : 'bg-white/95 text-stone-700 border-[#ebdcc7] hover:border-[#700b1d]/40 hover:bg-rose-50/40'
              }`}
            >
              <span className="text-sm">{cat.icon || '👗'}</span>
              <span>{cat.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isSelected ? 'bg-gold-400 text-stone-900' : 'bg-stone-100 text-stone-600'
              }`}>
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>

    </div>
  );
};
