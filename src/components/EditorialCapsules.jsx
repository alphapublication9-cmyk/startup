import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Crown } from 'lucide-react';

export const EditorialCapsules = ({ onSelectCategory }) => {
  const capsules = [
    {
      id: 'capsule-1',
      category: 'Sarees',
      image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80',
      tag: 'TIMELESS CLASSICS',
      title: 'The Royal Silk Edit',
      desc: 'Pure Katan, Banarasi & Organza handloom sarees woven with pure metallic zari threads.',
      cta: 'Explore Capsule'
    },
    {
      id: 'capsule-2',
      category: 'Kurtis & Suits',
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
      tag: 'SIGNATURE CUTS',
      title: 'Flared Anarkalis & Sets',
      desc: 'Flowing silhouettes with intricate gota patti, mirror work and resham thread embroidery.',
      cta: 'Shop The Silhouette'
    },
    {
      id: 'capsule-3',
      category: 'Lehenga Choli',
      image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
      tag: 'BRIDAL & OCCASION',
      title: 'The Grand Celebration',
      desc: 'Statement bridal lehengas and velvet ensembles designed for unforgettable moments.',
      cta: 'View Wedding Edition'
    }
  ];

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

        {/* 3-Column Editorial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {capsules.map((capsule, idx) => (
            <motion.div 
              key={capsule.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              whileHover={{ y: -8 }}
              onClick={() => onSelectCategory(capsule.category)}
              className="group relative h-[450px] rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-500 cursor-pointer border border-[#ebdcc7]"
            >
              <img
                src={capsule.image}
                alt={capsule.title}
                className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-transparent flex flex-col justify-end p-6 text-white">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300">
                  {capsule.tag}
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mt-1">
                  {capsule.title}
                </h3>
                <p className="text-xs text-stone-300 mt-1 line-clamp-2">
                  {capsule.desc}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-amber-300 group-hover:translate-x-2 transition-transform">
                  <span>{capsule.cta}</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
