import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Sparkles, 
  Gift, 
  MessageCircle, 
  Send, 
  User, 
  Layers
} from 'lucide-react';
import { getDirectChannelLink } from '../utils/whatsapp';

export const MobileBottomNav = ({
  cartCount = 0,
  onOpenCart,
  onOpenSpinWheel,
  onOpenCustomerAccount,
  onScrollToCatalog,
  settings = {}
}) => {
  const isTelegram = settings.orderChannel === 'telegram';
  const directLink = getDirectChannelLink(
    settings,
    `Hello ${settings.storeName || 'Radhika Kurti Collection'}! I would like to inquire about your Women Fashion collection.`
  );

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-[#ebdcc7]/90 px-2 py-1.5 flex md:hidden items-center justify-around shadow-[0_-4px_25px_rgba(0,0,0,0.08)]">
      
      {/* 1. Explore Catalog */}
      <button
        type="button"
        onClick={onScrollToCatalog}
        className="flex flex-col items-center gap-0.5 p-1 text-stone-600 hover:text-brand-950 active:scale-95 transition-all cursor-pointer"
      >
        <Sparkles size={18} className="text-amber-700" />
        <span className="text-[10px] font-bold tracking-tight">Explore</span>
      </button>

      {/* 2. Spin & Win Prize Wheel */}
      <button
        type="button"
        onClick={onOpenSpinWheel}
        className="flex flex-col items-center gap-0.5 p-1 text-stone-600 hover:text-rose-900 active:scale-95 transition-all cursor-pointer relative"
      >
        <div className="relative">
          <Gift size={18} className="text-rose-600 animate-bounce" />
          <span className="absolute -top-1 -right-2 bg-amber-400 text-stone-950 text-[8px] font-black px-1 rounded-full shadow-2xs">
            WIN
          </span>
        </div>
        <span className="text-[10px] font-extrabold text-rose-700 tracking-tight">Spin & Win</span>
      </button>

      {/* 3. Central Highlighted Cart / Bag */}
      <button
        type="button"
        onClick={onOpenCart}
        className="flex flex-col items-center -mt-4 group cursor-pointer"
      >
        <motion.div
          whileTap={{ scale: 0.9 }}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#700b1d] via-[#540614] to-[#2e0108] text-gold-100 flex items-center justify-center shadow-lg shadow-rose-950/40 border-2 border-gold-300 relative"
        >
          <ShoppingBag size={20} className="text-gold-200" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-gradient-to-r from-amber-400 to-gold-500 text-stone-950 text-[10px] font-black rounded-full flex items-center justify-center shadow-md px-1 leading-none">
              {cartCount}
            </span>
          )}
        </motion.div>
        <span className="text-[10px] font-extrabold text-[#700b1d] tracking-tight mt-0.5">
          Cart {cartCount > 0 ? `(${cartCount})` : ''}
        </span>
      </button>

      {/* 4. Direct WhatsApp / Telegram Inquiry */}
      <a
        href={directLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-0.5 p-1 text-stone-600 hover:text-emerald-700 active:scale-95 transition-all"
        title="Direct Order / Chat"
      >
        {isTelegram ? (
          <Send size={18} className="text-sky-500" />
        ) : (
          <MessageCircle size={18} className="text-emerald-600" />
        )}
        <span className="text-[10px] font-bold tracking-tight">
          {isTelegram ? 'Telegram' : 'WhatsApp'}
        </span>
      </a>

      {/* 5. Customer Profile / Account */}
      <button
        type="button"
        onClick={onOpenCustomerAccount}
        className="flex flex-col items-center gap-0.5 p-1 text-stone-600 hover:text-brand-950 active:scale-95 transition-all cursor-pointer"
      >
        <User size={18} className="text-stone-700" />
        <span className="text-[10px] font-bold tracking-tight">Account</span>
      </button>

    </div>
  );
};
