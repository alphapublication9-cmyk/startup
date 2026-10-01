import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Flame, Crown, Heart, Gift, Zap } from 'lucide-react';

const STORY_ITEMS = [
  {
    id: 'story-1',
    title: 'New Drops',
    tag: 'NEW IN',
    category: 'Kurtis & Suits',
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80',
    isLive: true
  },
  {
    id: 'story-2',
    title: 'Silk Sarees',
    tag: 'HANDLOOM',
    category: 'Sarees',
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=300&q=80',
    isLive: false
  },
  {
    id: 'story-3',
    title: 'Royal Bridal',
    tag: 'WEDDING',
    category: 'Lehenga Choli',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=300&q=80',
    isLive: true
  },
  {
    id: 'story-4',
    title: 'Western Luxe',
    tag: 'TRENDING',
    category: 'Western Dresses',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=300&q=80',
    isLive: false
  },
  {
    id: 'story-5',
    title: 'Co-ord Sets',
    tag: 'FUSION',
    category: 'Co-ord & Indo-Western',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80',
    isLive: false
  },
  {
    id: 'story-6',
    title: 'Festive Deals',
    tag: 'FLAT 50%',
    category: 'All',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=300&q=80',
    isLive: true
  }
];

export const StoryReels = ({ onSelectCategory }) => {
  return (
    <div className="py-3 sm:py-4 bg-[#fcfaf7] border-b border-[#ebdcc7]/50">
      <div className="container mx-auto px-3 sm:px-4">
        
        <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto pb-1.5 px-1 scrollbar-none justify-start md:justify-center">
          {STORY_ITEMS.map((story, idx) => (
            <motion.button
              key={story.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.06, duration: 0.4 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => onSelectCategory(story.category)}
              className="flex flex-col items-center gap-1.5 group shrink-0 cursor-pointer"
            >
              {/* Animated Gradient Ring */}
              <div className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-amber-600 via-gold-400 to-brand-900 group-hover:rotate-12 transition-transform duration-500 shadow-md">
                
                {/* Inner white border gap */}
                <div className="p-0.5 rounded-full bg-white">
                  <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full overflow-hidden relative">
                    <img
                      src={story.image}
                      alt={story.title}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80';
                      }}
                      className="w-full h-full object-cover object-top group-hover:scale-115 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                  </div>
                </div>

                {/* Mini Live / Hot Badge */}
                {story.isLive && (
                  <motion.span 
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-tighter shadow-sm border border-white"
                  >
                    HOT
                  </motion.span>
                )}
              </div>

              {/* Title & Tag */}
              <div className="text-center">
                <span className="text-[11px] sm:text-xs font-bold text-stone-800 group-hover:text-amber-900 block leading-tight">
                  {story.title}
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-700 block">
                  {story.tag}
                </span>
              </div>
            </motion.button>
          ))}
        </div>

      </div>
    </div>
  );
};
