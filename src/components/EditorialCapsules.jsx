import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Crown } from 'lucide-react';
import { normalizeImageUrl } from '../utils/imageUrl';
import { DEFAULT_EDITORIAL_CAPSULES } from '../data/initialSettings';

export const EditorialCapsules = ({ onSelectCategory, settings = {} }) => {
  const capsules = Array.isArray(settings?.editorialCapsules) && settings.editorialCapsules.length > 0
    ? settings.editorialCapsules
    : DEFAULT_EDITORIAL_CAPSULES;

  return (
    <section className="py-12 bg-[#faf7f2]">
      <div className="container mx-auto px-4 space-y-8">
        
        {/* Section Title */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-2 max-w-xl mx-auto"
        >
          <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-[#700b1d] block">
            LIMITED EDITION CAPSULES
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            The Haute Couture Lookbook
          </h2>
          <p className="text-xs text-stone-500 font-light leading-relaxed">
            Curated silhouettes reflecting the intersection of centuries-old Indian artisan heritage and contemporary international runway fashion.
          </p>
        </motion.div>

        {/* Dynamic Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {capsules.map((capsule, idx) => {
            const capsuleImg = normalizeImageUrl(capsule.image) || 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80';
            return (
              <motion.div 
                key={capsule.id || idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                whileHover={{ y: -8 }}
                onClick={() => onSelectCategory(capsule.category || 'Kurtis & Suits')}
                className="group relative h-[450px] rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-500 cursor-pointer border border-[#ebdcc7]"
              >
                <img
                  src={capsuleImg}
                  alt={capsule.title}
                  className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700 ease-out"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent flex flex-col justify-end p-6 text-white">
                  {capsule.tag && (
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                      {capsule.tag}
                    </span>
                  )}
                  <h3 className="font-serif text-2xl font-bold text-white mt-1">
                    {capsule.title}
                  </h3>
                  {capsule.desc && (
                    <p className="text-xs text-stone-300 mt-1 line-clamp-2 leading-relaxed">
                      {capsule.desc}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-amber-300 group-hover:translate-x-2 transition-transform">
                    <span>{capsule.cta || "Explore Capsule"}</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
