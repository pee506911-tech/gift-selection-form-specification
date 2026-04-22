import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Lock, Gift as GiftIcon, Maximize2, X } from 'lucide-react';
import type { Gift } from '../domain/types';

interface GiftCardProps {
  gift: Gift;
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
}

export default function GiftCard({ gift, isSelected, onSelect, disabled }: GiftCardProps) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const isUnavailable = gift.status === 'selected' && !isSelected;
  const isInactive = gift.status === 'inactive';
  const cardDisabled = disabled || isUnavailable || isInactive;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={cardDisabled ? {} : { y: -4 }}
      className={`
        relative rounded-xl border-2 overflow-hidden transition-colors duration-200
        ${isSelected ? 'border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-100' : ''}
        ${isUnavailable ? 'border-gray-200 bg-gray-50 opacity-70' : ''}
        ${isInactive ? 'border-gray-100 bg-gray-50 opacity-50' : ''}
        ${!cardDisabled && !isSelected ? 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md cursor-pointer' : ''}
      `}
      onClick={() => !cardDisabled && onSelect()}
    >
      {/* Status Badge */}
      <div className="absolute top-3 left-3 z-10">
        {isSelected ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white shadow-sm">
            <Check size={12} /> Selected by you
          </span>
        ) : isUnavailable ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500 text-white shadow-sm">
            <Lock size={12} /> Already selected
          </span>
        ) : isInactive ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-400 text-white shadow-sm">
            Inactive
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white shadow-sm">
            <GiftIcon size={12} /> Available
          </span>
        )}
      </div>

      {/* Gift Code */}
      <div className="absolute top-3 right-3 z-10">
        <span className="px-2 py-0.5 rounded text-xs font-mono bg-black/50 text-white backdrop-blur-sm">
          {gift.code}
        </span>
      </div>

      {/* Image */}
      <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative group">
        <img
          src={gift.imageKey ? `/api/images/${gift.imageKey}` : '/placeholder.png'}
          alt={gift.name}
          className={`w-full h-48 object-cover transition-transform duration-300 ${cardDisabled ? '' : 'group-hover:scale-105'}`}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/400x300/e2e8f0/64748b?text=${encodeURIComponent(gift.name)}`;
          }}
        />
        {/* Fullscreen button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowFullscreen(true);
          }}
          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/50 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          title="View full screen"
        >
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className={`font-semibold text-base mb-1 ${isUnavailable || isInactive ? 'text-gray-500' : 'text-gray-900'}`}>
          {gift.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2">{gift.description}</p>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-xl pointer-events-none" />
      )}

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {showFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowFullscreen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowFullscreen(false)}
                className="absolute -top-10 right-0 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>
              <img
                src={gift.imageKey ? `/api/images/${gift.imageKey}` : '/placeholder.png'}
                alt={gift.name}
                className="w-full h-full max-h-[85vh] object-contain rounded-lg"
              />
              <div className="mt-3 text-center">
                <h3 className="text-white font-semibold text-lg">{gift.name}</h3>
                {gift.description && (
                  <p className="text-white/70 text-sm mt-1">{gift.description}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
