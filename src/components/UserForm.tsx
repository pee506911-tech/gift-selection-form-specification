import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChevronLeft,
  AlertCircle,
  Loader2,
  Gift as GiftIcon,
  User,
  ArrowRight,
  RefreshCw,
  Lock,
  Timer,
  Maximize2,
  X,
} from 'lucide-react';

/* ─── Hardcoded CMS Data ─── */
interface Gift {
  id: string;
  name: string;
  imageKey: string;
  status: 'available' | 'selected' | 'inactive';
}

const CMS_GIFTS: Gift[] = [
  { id: '1', name: 'gif 1', imageKey: '1.png', status: 'available' },
  { id: '2', name: 'gif 2', imageKey: '2.png', status: 'available' },
  { id: '3', name: 'gif 3', imageKey: '3.png', status: 'available' },
  { id: '4', name: 'gif 4', imageKey: '4.png', status: 'available' },
  { id: '5', name: 'gif 5', imageKey: '5.png', status: 'available' },
  { id: '6', name: 'gif 6', imageKey: '6.png', status: 'available' },
  { id: '7', name: 'gif 7', imageKey: '7.png', status: 'available' },
  { id: '8', name: 'gif 8', imageKey: '8.jpg', status: 'available' },
  { id: '9', name: 'gif 9', imageKey: '9.jpg', status: 'available' },
  { id: '10', name: 'gif 10', imageKey: '10.jpg', status: 'available' },
  { id: '11', name: 'gif 11', imageKey: '11.jpg', status: 'available' },
  { id: '12', name: 'gif 12', imageKey: '12.jpg', status: 'available' },
  { id: '13', name: 'gif 13', imageKey: '13.jpg', status: 'available' },
  { id: '14', name: 'gif 14', imageKey: '14.jpg', status: 'available' },
  { id: '15', name: 'gif 15', imageKey: '15.jpg', status: 'available' },
  { id: '16', name: 'gif 16', imageKey: '16.jpg', status: 'available' },
  { id: '17', name: 'gif 17', imageKey: '17.jpg', status: 'available' },
  { id: '18', name: 'gif 18', imageKey: '18.jpg', status: 'available' },
  { id: '19', name: 'gif 19', imageKey: '19.jpg', status: 'available' },
  { id: '20', name: 'gif 20', imageKey: '20.jpg', status: 'available' },
  { id: '21', name: 'gif 21', imageKey: '21.jpg', status: 'available' },
  { id: '22', name: 'gif 22', imageKey: '22.jpg', status: 'available' },
  { id: '23', name: 'gif 23', imageKey: '23.jpg', status: 'available' },
  { id: '24', name: 'gif 24', imageKey: '24.jpg', status: 'available' },
  { id: '25', name: 'gif 25', imageKey: '25.jpg', status: 'available' },
  { id: '26', name: 'gif 26', imageKey: '26.jpg', status: 'available' },
  { id: '27', name: 'gif 27', imageKey: '27.jpg', status: 'available' },
  { id: '28', name: 'gif 28', imageKey: '28.jpg', status: 'available' },
  { id: '29', name: 'gif 29', imageKey: '29.jpg', status: 'available' },
  { id: '30', name: 'gif 30', imageKey: '30.jpg', status: 'available' },
];

// Simulated submission storage (in-memory for demo)
const selectedGiftIds = new Set<string>();
const submissions: Array<{ id: string; nickname: string; giftId: string; giftNameSnapshot: string; createdAt: string }> = [];

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 15);

/* ─── Jotform-style constants ─── */
const JF_BLUE = '#2e69ff';
const JF_BLUE_HOVER = '#1a5fff';
const JF_TEXT = '#2c3345';
const JF_LABEL = '#57647e';
const JF_BORDER = '#c3cad8';
const JF_BG = '#f3f3fe';
const JF_INPUT_BG = '#ffffff';
const JF_RED = '#f23a3c';
const JF_GREEN = '#18b815';

/* ─── Types ─── */
interface Step1Data {
  nickname: string;
}

interface Step2Data {
  selectedGiftId: string | null;
}

interface UserFormProps {
  slug?: string;
}

interface JustTakenGift {
  giftId: string;
  nickname: string;
  timestamp: number;
}

/* ─── Jotform-style Input ─── */
function JFInput({
  label,
  value,
  onChange,
  placeholder,
  error,
  maxLength,
  required = false,
  autoFocus = false,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  required?: boolean;
  autoFocus?: boolean;
  icon?: React.ElementType;
}) {
  return (
    <div className="mb-5">
      <label
        className="block text-sm font-semibold mb-2"
        style={{ color: JF_TEXT }}
      >
        {label}
        {required && <span style={{ color: JF_RED }}> *</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: JF_LABEL }}
          />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          autoFocus={autoFocus}
          className="w-full transition-all duration-150 outline-none"
          style={{
            padding: Icon ? '10px 12px 10px 36px' : '10px 12px',
            fontSize: 16,
            borderRadius: 4,
            border: `1px solid ${error ? JF_RED : JF_BORDER}`,
            backgroundColor: JF_INPUT_BG,
            color: JF_TEXT,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? JF_RED : JF_BLUE;
            e.currentTarget.style.boxShadow = error
              ? '0 0 0 3px rgba(242,58,60,0.1)'
              : '0 0 0 3px rgba(46,105,255,0.1)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? JF_RED : JF_BORDER;
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>
      {error && (
        <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: JF_RED }}>
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

/* ─── Jotform-style Button ─── */
function JFButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}) {
  const isPrimary = variant === 'primary';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-medium text-sm transition-all duration-150 select-none ${className}`}
      style={{
        padding: '10px 24px',
        borderRadius: 3,
        backgroundColor: isPrimary
          ? disabled
            ? '#a0aec0'
            : JF_BLUE
          : '#ffffff',
        color: isPrimary ? '#ffffff' : JF_TEXT,
        border: isPrimary ? 'none' : `1px solid ${JF_BORDER}`,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled && !loading ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading && isPrimary) {
          e.currentTarget.style.backgroundColor = JF_BLUE_HOVER;
        }
      }}
      onMouseLeave={(e) => {
        if (isPrimary) {
          e.currentTarget.style.backgroundColor = disabled ? '#a0aec0' : JF_BLUE;
        }
      }}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

/* ─── Jotform-style Progress Bar ─── */
function JFProgressBar({
  currentStep,
  totalSteps,
  stepLabels,
}: {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        {/* Connecting line background */}
        <div
          className="absolute top-4 left-0 right-0 h-0.5 -z-10"
          style={{ backgroundColor: '#e5e7eb' }}
        />
        {/* Active connecting line */}
        <div
          className="absolute top-4 left-0 h-0.5 -z-10 transition-all duration-500"
          style={{
            backgroundColor: JF_BLUE,
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
          }}
        />
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          return (
            <div key={stepNum} className="flex flex-col items-center z-10">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300"
                style={{
                  backgroundColor: isCompleted
                    ? JF_BLUE
                    : isActive
                      ? '#ffffff'
                      : '#ffffff',
                  color: isCompleted
                    ? '#ffffff'
                    : isActive
                      ? JF_BLUE
                      : JF_LABEL,
                  border: `2px solid ${isCompleted || isActive ? JF_BLUE : JF_BORDER}`,
                }}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  stepNum
                )}
              </div>
              <span
                className="text-xs mt-2 font-medium"
                style={{
                  color: isActive || isCompleted ? JF_TEXT : JF_LABEL,
                }}
              >
                {stepLabels[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Jotform-style Gift Card (Image Choice style) with Real-time Animation ─── */
function JFGiftCard({
  gift,
  isSelected,
  isTaken,
  justTakenBy,
  onSelect,
}: {
  gift: Gift;
  isSelected: boolean;
  isTaken: boolean;
  justTakenBy?: string;
  onSelect: () => void;
}) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const imageUrl = `/images/${gift.imageKey}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: isTaken ? 0.4 : 1, 
        scale: isTaken ? 0.95 : 1,
        filter: isTaken ? 'grayscale(80%) blur(1px)' : 'none'
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={() => !isTaken && onSelect()}
      className="relative group"
      style={{
        cursor: isTaken ? 'not-allowed' : 'pointer',
      }}
    >
      {/* Just Taken Alert Overlay */}
      <AnimatePresence>
        {justTakenBy && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute -top-2 left-0 right-0 z-20 flex justify-center"
          >
            <div
              className="px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5"
              style={{ 
                backgroundColor: JF_RED, 
                color: '#ffffff',
                boxShadow: '0 4px 12px rgba(242, 58, 60, 0.3)'
              }}
            >
              <Timer className="w-3 h-3" />
              Just selected by {justTakenBy}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="rounded-md overflow-hidden transition-all duration-300"
        style={{
          border: `2px solid ${
            isSelected ? JF_BLUE : isTaken ? '#e5e7eb' : JF_BORDER
          }`,
          backgroundColor: isTaken ? '#f9fafb' : '#ffffff',
          boxShadow: justTakenBy ? `0 0 0 3px ${JF_RED}40` : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isTaken && !isSelected) {
            e.currentTarget.style.borderColor = '#a0aec0';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isTaken && !isSelected) {
            e.currentTarget.style.borderColor = JF_BORDER;
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt={gift.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                `https://placehold.co/300x225/e5e7eb/57647e?text=${encodeURIComponent(gift.name)}`;
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
          
          {/* Selected checkmark overlay */}
          {isSelected && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: JF_BLUE }}
            >
              <Check className="w-4 h-4 text-white" />
            </motion.div>
          )}
          
          {/* Taken overlay */}
          {isTaken && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-gray-900/30 flex items-center justify-center"
            >
              <div
                className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  color: JF_LABEL,
                }}
              >
                <Lock className="w-3 h-3" />
                Taken
              </div>
            </motion.div>
          )}
        </div>

        {/* Info - just name */}
        <div className="p-3">
          <p
            className="text-sm font-semibold leading-tight"
            style={{ color: isTaken ? '#9ca3af' : JF_TEXT }}
          >
            {gift.name}
          </p>
        </div>
      </div>

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
                src={imageUrl}
                alt={gift.name}
                className="w-full h-full max-h-[85vh] object-contain rounded-lg"
              />
              <div className="mt-3 text-center">
                <h3 className="text-white font-semibold text-lg">{gift.name}</h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function UserForm({ slug = 'gift-selection' }: UserFormProps) {
  const [step, setStep] = useState(1);
  const [step1, setStep1] = useState<Step1Data>({ nickname: '' });
  const [step2, setStep2] = useState<Step2Data>({ selectedGiftId: null });
  const [gifts, setGifts] = useState<Gift[]>(CMS_GIFTS);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{
    nickname: string;
    gift: Gift;
  } | null>(null);
  const [justTakenGifts, setJustTakenGifts] = useState<Map<string, JustTakenGift>>(new Map());
  const [mySelectedGiftWasTaken, setMySelectedGiftWasTaken] = useState(false);
  
  // Track previous taken gifts for animation detection
  const prevTakenRef = useRef<Set<string>>(new Set());
  
  // Simulated real-time updates (simulates other users selecting gifts)
  useEffect(() => {
    // Simulate another user selecting a gift every 15-45 seconds (for demo)
    const simulateOtherUserSelection = () => {
      const availableGifts = gifts.filter(g => g.status === 'available' && !selectedGiftIds.has(g.id));
      if (availableGifts.length > 0 && Math.random() > 0.7) {
        const randomGift = availableGifts[Math.floor(Math.random() * availableGifts.length)];
        const randomNickname = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan'][Math.floor(Math.random() * 5)];
        
        selectedGiftIds.add(randomGift.id);
        
        // Update gifts state
        setGifts(prev => prev.map(g => 
          g.id === randomGift.id ? { ...g, status: 'selected' } : g
        ));
        
        // Show "just taken" animation
        setJustTakenGifts(prev => new Map(prev.set(randomGift.id, {
          giftId: randomGift.id,
          nickname: randomNickname,
          timestamp: Date.now()
        })));
        
        // Check if this was the user's selected gift
        if (step2.selectedGiftId === randomGift.id) {
          setMySelectedGiftWasTaken(true);
        }
        
        // Clear "just taken" after 4 seconds
        setTimeout(() => {
          setJustTakenGifts(prev => {
            const next = new Map(prev);
            next.delete(randomGift.id);
            return next;
          });
        }, 4000);
      }
      
      // Schedule next simulation
      const nextDelay = 15000 + Math.random() * 30000;
      setTimeout(simulateOtherUserSelection, nextDelay);
    };
    
    const timeout = setTimeout(simulateOtherUserSelection, 20000);
    return () => clearTimeout(timeout);
  }, [gifts, step2.selectedGiftId]);

  /* Derived */
  const takenGiftIds = new Set(gifts.filter(g => g.status === 'selected' || selectedGiftIds.has(g.id)).map(g => g.id));
  const availableGifts = gifts.filter(g => g.status === 'available' && !selectedGiftIds.has(g.id));
  const takenGifts = gifts.filter(g => g.status === 'selected' || selectedGiftIds.has(g.id));
  const activeGifts = [...availableGifts, ...takenGifts];
  const availableCount = availableGifts.length;
  const selectedGift = gifts.find((g) => g.id === step2.selectedGiftId);

  /* Validation */
  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {};
    const nick = step1.nickname.trim();
    if (!nick) e.nickname = 'This field is required.';
    else if (nick.length > 50) e.nickname = 'Maximum 50 characters allowed.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {};
    if (!step2.selectedGiftId) e.gift = 'Please select a gift.';
    else if (takenGiftIds.has(step2.selectedGiftId)) {
      e.gift = 'This gift was just selected by someone else. Please choose another.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* Navigation */
  const goNext = () => {
    if (step === 1 && validateStep1()) {
      setErrors({});
      setStep(2);
    }
  };

  const goBack = () => {
    setErrors({});
    setSubmitError('');
    setMySelectedGiftWasTaken(false);
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    if (!step2.selectedGiftId || !selectedGift) return;

    // Check if gift is still available
    if (takenGiftIds.has(step2.selectedGiftId)) {
      setSubmitError('Sorry, this gift was just selected by someone else. Please choose another gift.');
      setStep2({ selectedGiftId: null });
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Record submission
    selectedGiftIds.add(step2.selectedGiftId);
    submissions.push({
      id: generateId(),
      nickname: step1.nickname.trim(),
      giftId: step2.selectedGiftId,
      giftNameSnapshot: selectedGift.name,
      createdAt: new Date().toISOString(),
    });
    
    // Update gift status
    setGifts(prev => prev.map(g => 
      g.id === step2.selectedGiftId ? { ...g, status: 'selected' } : g
    ));
    
    setSuccessData({ nickname: step1.nickname.trim(), gift: selectedGift });
    setSuccess(true);
    setSubmitting(false);
  };

  const resetForm = () => {
    setStep(1);
    setStep1({ nickname: '' });
    setStep2({ selectedGiftId: null });
    setErrors({});
    setSubmitError('');
    setSuccess(false);
    setSuccessData(null);
    setMySelectedGiftWasTaken(false);
  };

  /* Success state */
  if (success && successData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 py-12"
        style={{ backgroundColor: JF_BG }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[690px] rounded-lg p-10 text-center"
          style={{
            backgroundColor: '#ffffff',
            border: `1px solid ${JF_BORDER}`,
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: '#dcfce7' }}
          >
            <Check className="w-8 h-8" style={{ color: JF_GREEN }} />
          </motion.div>

          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: JF_TEXT }}
          >
            Thank You!
          </h2>
          <p className="text-sm mb-6" style={{ color: JF_LABEL }}>
            Your submission has been received.
          </p>

          <div
            className="rounded-md p-4 mb-6 text-left"
            style={{ backgroundColor: '#f8fafc', border: `1px solid ${JF_BORDER}` }}
          >
            <div className="flex gap-4">
              <img
                src={`/images/${successData.gift.imageKey}`}
                alt={successData.gift.name}
                className="w-20 h-20 object-cover rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://placehold.co/80x80/e5e7eb/57647e?text=${encodeURIComponent(
                      successData.gift.name
                    )}`;
                }}
              />
              <div>
                <p className="text-base font-semibold" style={{ color: JF_TEXT }}>
                  {successData.gift.name}
                </p>
                <p className="text-xs mt-1" style={{ color: JF_LABEL }}>
                  Selected by: {successData.nickname}
                </p>
              </div>
            </div>
          </div>

          <JFButton onClick={resetForm}>
            <RefreshCw className="w-4 h-4" />
            Submit Another Response
          </JFButton>
        </motion.div>
      </div>
    );
  }

  /* Main form */
  return (
    <div
      className="min-h-screen px-4 py-8 md:py-12"
      style={{ backgroundColor: JF_BG }}
    >
      <div
        className="w-full max-w-[690px] mx-auto rounded-lg"
        style={{
          backgroundColor: '#ffffff',
          border: `1px solid ${JF_BORDER}`,
        }}
      >
        {/* Form Header */}
        <div
          className="px-8 pt-8 pb-2"
          style={{ borderBottom: `1px solid ${JF_BORDER}` }}
        >
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: JF_TEXT }}
          >
            Choose Your Gift
          </h1>
          <p className="text-sm mb-6" style={{ color: JF_LABEL }}>
            Please enter your nickname and select one available gift.
          </p>

          {/* Progress */}
          <JFProgressBar
            currentStep={step}
            totalSteps={3}
            stepLabels={['Your Info', 'Select Gift', 'Review']}
          />
        </div>

        {/* Form Body */}
        <div className="px-8 py-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <JFInput
                  label="Nickname"
                  value={step1.nickname}
                  onChange={(v) => {
                    setStep1({ nickname: v });
                    if (errors.nickname) setErrors((p) => ({ ...p, nickname: '' }));
                  }}
                  placeholder="Enter your nickname"
                  error={errors.nickname}
                  maxLength={50}
                  required
                  autoFocus
                  icon={User}
                />

                <div className="flex justify-end mt-6">
                  <JFButton onClick={goNext}>
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </JFButton>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                {/* Warning if user's selected gift was taken */}
                <AnimatePresence>
                  {mySelectedGiftWasTaken && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 rounded-md p-3 flex items-start gap-2"
                      style={{
                        backgroundColor: '#fef2f2',
                        border: `1px solid #fecaca`,
                      }}
                    >
                      <AlertCircle
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: JF_RED }}
                      />
                      <p className="text-xs" style={{ color: JF_RED }}>
                        <strong>Heads up!</strong> Your selected gift was just taken by someone else. 
                        Please select a different gift.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Stats */}
                <div
                  className="flex items-center gap-4 mb-4 text-xs"
                  style={{ color: JF_LABEL }}
                >
                  <span>
                    <strong style={{ color: JF_TEXT }}>{availableCount}</strong> of{' '}
                    <strong style={{ color: JF_TEXT }}>{activeGifts.length}</strong>{' '}
                    available
                  </span>
                  <span>•</span>
                  <span>
                    <strong style={{ color: JF_TEXT }}>
                      {activeGifts.length - availableCount}
                    </strong>{' '}
                    selected
                  </span>
                  {step2.selectedGiftId && !mySelectedGiftWasTaken && (
                    <>
                      <span>•</span>
                      <span style={{ color: JF_BLUE }} className="font-semibold">
                        1 selected by you
                      </span>
                    </>
                  )}
                </div>

                {/* Error */}
                {errors.gift && (
                  <p
                    className="text-xs mb-4 flex items-center gap-1"
                    style={{ color: JF_RED }}
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.gift}
                  </p>
                )}

                {/* Gift Grid - Available first, then taken */}
                <motion.div 
                  layout
                  className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6"
                >
                  <AnimatePresence mode="popLayout">
                    {/* Available gifts first */}
                    {availableGifts.map((gift) => (
                      <JFGiftCard
                        key={gift.id}
                        gift={gift}
                        isSelected={step2.selectedGiftId === gift.id}
                        isTaken={false}
                        justTakenBy={justTakenGifts.get(gift.id)?.nickname}
                        onSelect={() => {
                          setStep2({ selectedGiftId: gift.id });
                          setMySelectedGiftWasTaken(false);
                          if (errors.gift) setErrors((p) => ({ ...p, gift: '' }));
                        }}
                      />
                    ))}
                    {/* Taken gifts at the end, dimmed */}
                    {takenGifts.map((gift) => (
                      <JFGiftCard
                        key={gift.id}
                        gift={gift}
                        isSelected={step2.selectedGiftId === gift.id}
                        isTaken={true}
                        justTakenBy={justTakenGifts.get(gift.id)?.nickname}
                        onSelect={() => {}}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>

                {/* Buttons */}
                <div className="flex justify-between items-center mt-6 pt-4" style={{ borderTop: `1px solid ${JF_BORDER}` }}>
                  <JFButton variant="secondary" onClick={goBack}>
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </JFButton>
                  <JFButton
                    onClick={() => {
                      if (validateStep2()) setStep(3);
                    }}
                    disabled={!step2.selectedGiftId}
                  >
                    Review Selection
                    <ArrowRight className="w-4 h-4" />
                  </JFButton>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <h3
                  className="text-lg font-bold mb-4"
                  style={{ color: JF_TEXT }}
                >
                  Review Your Selection
                </h3>

                {/* Nickname summary */}
                <div
                  className="rounded-md p-4 mb-4"
                  style={{
                    backgroundColor: '#f8fafc',
                    border: `1px solid ${JF_BORDER}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-xs font-medium mb-1"
                        style={{ color: JF_LABEL }}
                      >
                        Nickname
                      </p>
                      <p className="text-base font-semibold" style={{ color: JF_TEXT }}>
                        {step1.nickname.trim()}
                      </p>
                    </div>
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs font-medium hover:underline"
                      style={{ color: JF_BLUE }}
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Gift summary */}
                {selectedGift && (
                  <div
                    className="rounded-md p-4 mb-6"
                    style={{
                      backgroundColor: '#f8fafc',
                      border: `1px solid ${JF_BORDER}`,
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <p
                        className="text-xs font-medium"
                        style={{ color: JF_LABEL }}
                      >
                        Selected Gift
                      </p>
                      <button
                        onClick={() => setStep(2)}
                        className="text-xs font-medium hover:underline"
                        style={{ color: JF_BLUE }}
                      >
                        Change
                      </button>
                    </div>
                    <div className="flex gap-4">
                      <img
                        src={`/images/${selectedGift.imageKey}`}
                        alt={selectedGift.name}
                        className="w-24 h-24 object-cover rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            `https://placehold.co/96x96/e5e7eb/57647e?text=${encodeURIComponent(
                              selectedGift.name
                            )}`;
                        }}
                      />
                      <div>
                        <p
                          className="text-base font-semibold"
                          style={{ color: JF_TEXT }}
                        >
                          {selectedGift.name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conflict warning */}
                {selectedGift && takenGiftIds.has(selectedGift.id) && (
                  <div
                    className="rounded-md p-3 mb-4 flex items-start gap-2"
                    style={{
                      backgroundColor: '#fef2f2',
                      border: `1px solid #fecaca`,
                    }}
                  >
                    <AlertCircle
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: JF_RED }}
                    />
                    <p className="text-xs" style={{ color: JF_RED }}>
                      This gift was just selected by someone else. Please go back and
                      choose another gift.
                    </p>
                  </div>
                )}

                {/* Submit error */}
                {submitError && (
                  <div
                    className="rounded-md p-3 mb-4 flex items-start gap-2"
                    style={{
                      backgroundColor: '#fef2f2',
                      border: `1px solid #fecaca`,
                    }}
                  >
                    <AlertCircle
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: JF_RED }}
                    />
                    <p className="text-xs" style={{ color: JF_RED }}>
                      {submitError}
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex justify-between items-center mt-6 pt-4" style={{ borderTop: `1px solid ${JF_BORDER}` }}>
                  <JFButton variant="secondary" onClick={goBack} disabled={submitting}>
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </JFButton>
                  <JFButton
                    onClick={handleSubmit}
                    loading={submitting}
                    disabled={
                      !selectedGift || takenGiftIds.has(selectedGift.id)
                    }
                  >
                    <Check className="w-4 h-4" />
                    Confirm & Submit
                  </JFButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs mt-4" style={{ color: '#9ca3af' }}>
        Gift Selection Form
      </p>
    </div>
  );
}
