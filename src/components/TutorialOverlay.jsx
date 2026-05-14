import { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const TutorialOverlay = ({ steps, currentStep, onNext, onPrev, onClose }) => {
  const [targetRect, setTargetRect] = useState(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const updateTargetRect = useCallback(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    if (!step || !step.target) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(step.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      const isVisible = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );

      if (!isVisible) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          const newRect = el.getBoundingClientRect();
          setTargetRect(newRect);
        }, 350);
      } else {
        setTargetRect(rect);
      }
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    const timeout = setTimeout(updateTargetRect, 300);
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);
    const interval = setInterval(updateTargetRect, 600);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [updateTargetRect]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === 'Enter') onNext();
      if (e.key === 'ArrowLeft' && currentStep > 0) onPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, currentStep]);

  const getMaskPath = () => {
    const { width, height } = windowSize;
    if (!targetRect) {
      return `M0,0 H${width} V${height} H0 Z`;
    }

    const pad = 10;
    const r = 10;
    const x = Math.max(0, targetRect.left - pad);
    const y = Math.max(0, targetRect.top - pad);
    const w = targetRect.width + pad * 2;
    const h = targetRect.height + pad * 2;

    return `
      M0,0 H${width} V${height} H0 Z
      M${x + r},${y}
      h${w - 2 * r} a${r},${r} 0 0 1 ${r},${r}
      v${h - 2 * r} a${r},${r} 0 0 1 -${r},${r}
      h-${w - 2 * r} a${r},${r} 0 0 1 -${r},-${r}
      v-${h - 2 * r} a${r},${r} 0 0 1 ${r},-${r}
      z
    `;
  };

  const getDialogStyle = () => {
    const isMobile = windowSize.width < 768;
    const dialogWidth = isMobile ? windowSize.width - 32 : 360;

    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${dialogWidth}px`,
        maxWidth: 'calc(100vw - 2rem)'
      };
    }

    const padding = 16;
    const spaceBelow = windowSize.height - targetRect.bottom;
    const spaceAbove = targetRect.top;

    let top = targetRect.bottom + padding;
    let left = targetRect.left + (targetRect.width / 2) - (dialogWidth / 2);

    if (spaceBelow < 220 && spaceAbove > 220) {
      top = targetRect.top - padding - 200;
    }

    if (left < padding) left = padding;
    if (left + dialogWidth > windowSize.width - padding) {
      left = windowSize.width - dialogWidth - padding;
    }
    if (top < padding) top = padding;

    return {
      top: `${top}px`,
      left: `${left}px`,
      width: `${dialogWidth}px`,
      maxWidth: 'calc(100vw - 2rem)'
    };
  };

  if (!step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const isCentered = !targetRect;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99999, pointerEvents: 'none' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
        <path
          d={getMaskPath()}
          fill="rgba(0, 0, 0, 0.72)"
          fillRule="evenodd"
          style={{ transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', pointerEvents: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        />
      </svg>
      
      {targetRect && (
        <div style={{
          position: 'absolute',
          top: targetRect.top - 10,
          left: targetRect.left - 10,
          width: targetRect.width + 20,
          height: targetRect.height + 20,
          borderRadius: '12px',
          boxShadow: '0 0 0 3px var(--color-primary), 0 0 30px rgba(99, 102, 241, 0.4), 0 0 60px rgba(99, 102, 241, 0.15)',
          pointerEvents: 'none',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          animation: 'tutorial-pulse 2s ease-in-out infinite'
        }} />
      )}

      <div
        className="glass-card"
        style={{
          position: 'absolute',
          padding: '1.75rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--glass-border-hover)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          borderRadius: 'var(--radius-xl)',
          pointerEvents: 'auto',
          transition: 'top 0.4s cubic-bezier(0.16, 1, 0.3, 1), left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          animation: 'tutorial-dialog-enter 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          ...getDialogStyle()
        }}
      >
        {/* Progress Bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', borderRadius: '12px 12px 0 0', overflow: 'hidden', background: 'var(--bg-elevated)' }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
            transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 0 8px var(--color-primary)'
          }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
          <h3 style={{ 
            fontSize: isCentered ? '1.3rem' : '1.1rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)',
            lineHeight: 1.3,
            flex: 1,
            paddingRight: '0.5rem'
          }}>{step.title}</h3>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--glass-border)', 
              cursor: 'pointer', 
              color: 'var(--text-muted)',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s'
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <p style={{ 
          fontSize: '0.88rem', 
          color: 'var(--text-secondary)', 
          lineHeight: '1.65', 
          marginBottom: '1.5rem' 
        }}>
          {step.content}
        </p>

        {/* Step Dots */}
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '1rem' }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === currentStep ? '18px' : '6px',
              height: '6px',
              borderRadius: '3px',
              background: i === currentStep 
                ? 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))' 
                : i < currentStep 
                  ? 'var(--color-primary)' 
                  : 'var(--glass-border)',
              opacity: i < currentStep ? 0.5 : 1,
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: i === currentStep ? '0 0 6px var(--color-primary)' : 'none'
            }} />
          ))}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: '600', color: 'var(--text-muted)', letterSpacing: '0.02em' }}>
            {currentStep + 1} / {steps.length}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isFirst && (
              <button onClick={onPrev} className="btn btn-outline" style={{ padding: '0.45rem 0.75rem', minHeight: 'auto', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <ChevronLeft size={15} /> Kembali
              </button>
            )}
            {isFirst && (
              <button onClick={onClose} className="btn btn-outline" style={{ padding: '0.45rem 0.75rem', minHeight: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Lewati
              </button>
            )}
            {!isLast ? (
              <button onClick={onNext} className="btn btn-primary" style={{ padding: '0.45rem 1rem', minHeight: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                Lanjut <ChevronRight size={15} />
              </button>
            ) : (
              <button onClick={onClose} className="btn btn-success" style={{ padding: '0.45rem 1rem', minHeight: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}>
                Selesai <Check size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes tutorial-pulse {
          0%, 100% { box-shadow: 0 0 0 3px var(--color-primary), 0 0 30px rgba(99, 102, 241, 0.4), 0 0 60px rgba(99, 102, 241, 0.15); }
          50% { box-shadow: 0 0 0 5px var(--color-primary), 0 0 40px rgba(99, 102, 241, 0.5), 0 0 80px rgba(99, 102, 241, 0.2); }
        }
        @keyframes tutorial-dialog-enter {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default TutorialOverlay;
