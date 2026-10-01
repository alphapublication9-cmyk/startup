import React from 'react';
import { Crown, MessageCircle, Phone, Mail, MapPin, Heart, Lock, ShieldCheck, Truck, RotateCcw, Sparkles, Send } from 'lucide-react';
import { cleanTelegramHandle, getDirectChannelLink } from '../utils/whatsapp';

export const Footer = ({ onOpenAdmin, settings = {}, onSelectCategory, categories = [] }) => {
  const isTelegram = settings.orderChannel === 'telegram';
  const channelLabel = isTelegram ? 'Telegram' : 'WhatsApp';
  const directLink = getDirectChannelLink(settings, "Hello! I have an inquiry regarding your Women Ethnic collection.");

  return (
    <footer className="bg-[#f7efe4] text-stone-700 pt-14 pb-8 border-t border-[#e5d3be] mt-16">
      <div className="container mx-auto px-4">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 flex items-center justify-center shrink-0 drop-shadow-md">
                <img 
                  src={settings.logoUrl || "/logo.png"} 
                  alt={settings.storeName || "RADHIKA KURTI COLLECTION"} 
                  className="w-full h-full object-contain filter drop-shadow-xs" 
                />
              </div>
              <div>
                <span className="font-heading text-lg sm:text-xl font-black tracking-wider text-stone-900 block leading-tight">
                  {settings.storeName || "RADHIKA KURTI COLLECTION"}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#700b1d] font-extrabold">
                  Luxury Design & Ethnic Fashion
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Experience the pinnacle of Indian ethnic elegance and women's fashion. Handcrafted designer Kurtis, Sarees, Lehengas, Western wear, and festive ensembles made with love and precision.
            </p>

            <div className="pt-2">
              <a
                href={directLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-full text-xs font-extrabold transition-all shadow-sm ${
                  isTelegram ? 'bg-sky-500 hover:bg-sky-600' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isTelegram ? <Send size={15} /> : <MessageCircle size={15} />}
                <span>
                  Chat on {channelLabel} ({isTelegram ? `@${cleanTelegramHandle(settings.telegramUsername)}` : settings.whatsappNumber})
                </span>
              </a>
            </div>
          </div>

          {/* Quick Category Links */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-extrabold tracking-widest text-amber-950 flex items-center gap-1.5">
              <span>Women Collections</span>
              <Sparkles size={13} className="text-amber-600" />
            </h4>
            <ul className="space-y-2 text-xs text-stone-600 font-medium">
              {categories.slice(0, 7).map((cat) => {
                const name = typeof cat === 'string' ? cat : cat.name;
                return (
                  <li key={name}>
                    <button
                      onClick={() => {
                        onSelectCategory(name);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                      className="hover:text-amber-900 hover:translate-x-1 transition-all text-left cursor-pointer flex items-center gap-1.5"
                    >
                      <span className="text-amber-700">•</span>
                      <span>{name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Customer Care & Assurance */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-extrabold tracking-widest text-amber-950">
              Customer Assurance
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-600">
              <li className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-white border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 shadow-xs">
                  <ShieldCheck size={13} />
                </div>
                <span>100% Authentic Handloom & Silks</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-white border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 shadow-xs">
                  <Truck size={13} />
                </div>
                <span>Pan-India Fast Doorstep Delivery</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-white border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 shadow-xs">
                  <RotateCcw size={13} />
                </div>
                <span>7-Day Easy Size Replacement</span>
              </li>
              <li className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-white border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 shadow-xs">
                  {isTelegram ? <Send size={13} /> : <Phone size={13} />}
                </div>
                <span>Direct {channelLabel} Order Tracking</span>
              </li>
            </ul>
          </div>

          {/* Contact & Admin Portal */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-extrabold tracking-widest text-amber-950">
              Store Support
            </h4>
            <div className="space-y-2 text-xs text-stone-600">
              {isTelegram ? (
                <p className="flex items-center gap-2">
                  <Send size={14} className="text-sky-700" />
                  <span>Telegram: <strong>@{cleanTelegramHandle(settings.telegramUsername)}</strong></span>
                </p>
              ) : (
                <p className="flex items-center gap-2">
                  <Phone size={14} className="text-amber-800" />
                  <span>WhatsApp: <strong>{settings.whatsappNumber}</strong></span>
                </p>
              )}
              <p className="flex items-center gap-2">
                <Mail size={14} className="text-amber-800" />
                <span>Email: {settings.supportEmail || "support@auraethnic.com"}</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin size={14} className="text-amber-800" />
                <span>Boutique: Jaipur • Mumbai • Delhi</span>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Copyright Strip */}
        <div className="pt-6 border-t border-[#e2cfb9] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} {settings.storeName || "AURA ETHNIC"}. All Rights Reserved.</p>
          <p className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart size={13} className="text-rose-600 fill-rose-600" />
            <span>for Indian Ethnic Couture</span>
          </p>
        </div>

      </div>
    </footer>
  );
};
