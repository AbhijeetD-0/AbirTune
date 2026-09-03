import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RotateCw, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  isRefreshing: boolean;
  children: React.ReactNode;
  threshold?: number;
  maxPull?: number;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  isRefreshing,
  children,
  threshold = 64,
  maxPull = 88,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const pullDistanceRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const isPullingRef = useRef(false);
  const isCandidateRef = useRef(false);
  const isRefreshingRef = useRef(isRefreshing);
  isRefreshingRef.current = isRefreshing;

  // Track dragging state to prevent unwanted text selection or clicks while pulling
  const hasPulledRef = useRef(false);

  // Dampened physics calculation
  const calculateDistance = (dy: number) => {
    if (dy <= 0) return 0;
    // Non-linear resistance curve that feels like iOS / Android native pull
    return Math.min(maxPull, Math.pow(dy, 0.8) * 1.6);
  };

  const handleStart = useCallback((clientY: number, clientX: number, target: EventTarget | null) => {
    if (isRefreshingRef.current) return;

    // Only allow pull-to-refresh if window/container is scrolled to the absolute top
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const containerScrollTop = containerRef.current ? containerRef.current.scrollTop : 0;

    if (scrollTop > 2 || containerScrollTop > 2) {
      isCandidateRef.current = false;
      return;
    }

    // Ignore if clicking on interactive elements (buttons, inputs, links)
    if (target instanceof HTMLElement) {
      const isInteractive = target.closest('button, a, input, select, textarea, [role="button"], .no-pull');
      if (isInteractive) {
        isCandidateRef.current = false;
        return;
      }
    }

    startYRef.current = clientY;
    startXRef.current = clientX;
    isCandidateRef.current = true;
    isPullingRef.current = false;
    hasPulledRef.current = false;
  }, []);

  const handleMove = useCallback(
    (clientY: number, clientX: number, e?: TouchEvent | MouseEvent) => {
      if (!isCandidateRef.current || isRefreshingRef.current) return;

      const deltaY = clientY - startYRef.current;
      const deltaX = clientX - startXRef.current;

      // Check for horizontal scroll dominance to avoid interfering with horizontal carousels
      if (!isPullingRef.current) {
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
          isCandidateRef.current = false;
          return;
        }

        if (deltaY > 6 && deltaY > Math.abs(deltaX) * 1.1) {
          isPullingRef.current = true;
          setIsDragging(true);
        } else {
          return;
        }
      }

      if (isPullingRef.current) {
        if (deltaY > 0) {
          if (e && e.cancelable) {
            e.preventDefault();
          }
          hasPulledRef.current = true;
          const dist = calculateDistance(deltaY);
          pullDistanceRef.current = dist;
          setPullDistance(dist);
        } else {
          pullDistanceRef.current = 0;
          setPullDistance(0);
        }
      }
    },
    [maxPull]
  );

  const handleEnd = useCallback(() => {
    if (!isCandidateRef.current && !isPullingRef.current) return;

    isCandidateRef.current = false;
    setIsDragging(false);

    if (isPullingRef.current) {
      isPullingRef.current = false;
      const currentDist = pullDistanceRef.current;
      const shouldTrigger = currentDist >= threshold && !isRefreshingRef.current;

      if (shouldTrigger) {
        pullDistanceRef.current = 54;
        setPullDistance(54); // Hold at comfortable height while refreshing
        // Safely trigger onRefresh outside the current React render/state cycle
        window.setTimeout(() => {
          onRefresh();
        }, 0);
      } else {
        pullDistanceRef.current = 0;
        setPullDistance(0); // Snap back
      }
    }
  }, [onRefresh, threshold]);

  // Sync pull distance when isRefreshing changes
  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
    if (!isRefreshing) {
      pullDistanceRef.current = 0;
      setPullDistance(0);
    } else {
      pullDistanceRef.current = 54;
      setPullDistance(54);
    }
  }, [isRefreshing]);

  // Touch event listeners attached directly to enable passive: false for e.preventDefault()
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleStart(e.touches[0].clientY, e.touches[0].clientX, e.target);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientY, e.touches[0].clientX, e);
      }
    };

    const onTouchEnd = () => {
      handleEnd();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [handleStart, handleMove, handleEnd]);

  // Mouse Drag support for desktop and preview testing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let isMouseDown = false;

    const onMouseDown = (e: MouseEvent) => {
      // Only main left click and within top viewport region
      if (e.button !== 0 || e.clientY > 360) return;
      isMouseDown = true;
      handleStart(e.clientY, e.clientX, e.target);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      handleMove(e.clientY, e.clientX, e);
    };

    const onMouseUp = () => {
      if (isMouseDown) {
        isMouseDown = false;
        handleEnd();
      }
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleStart, handleMove, handleEnd]);

  const isReady = pullDistance >= threshold;
  const progress = Math.min(1, pullDistance / threshold);

  return (
    <div ref={containerRef} className="relative w-full overflow-visible touch-pan-y">
      {/* Native-style Pull Indicator */}
      <div
        id="pull-to-refresh-indicator"
        className="pointer-events-none absolute left-0 right-0 top-0 flex justify-center z-30 transition-opacity duration-200"
        style={{
          transform: `translateY(${Math.max(0, pullDistance - 42)}px)`,
          opacity: pullDistance > 10 || isRefreshing ? 1 : 0,
        }}
      >
        <div
          className={`flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-2xl border shadow-2xl transition-all duration-200 ${
            isReady || isRefreshing
              ? 'bg-[#181818]/95 border-[#ff2d55]/50 shadow-[#ff2d55]/25 ring-1 ring-[#ff2d55]/40 text-white scale-100'
              : 'bg-[#121212]/90 border-white/10 text-zinc-300 scale-95'
          }`}
        >
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            {isRefreshing ? (
              <RotateCw className="w-4 h-4 text-[#ff2d55] animate-spin" />
            ) : (
              <ArrowDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isReady ? 'text-[#ff2d55] -rotate-180 scale-110' : 'text-zinc-400'
                }`}
                style={{
                  transform: isReady ? 'rotate(180deg)' : `rotate(${progress * 180}deg)`,
                }}
              />
            )}
          </div>
          <span className="text-[12px] font-semibold tracking-tight select-none">
            {isRefreshing
              ? 'Updating music...'
              : isReady
              ? 'Release to refresh'
              : 'Pull down to refresh'}
          </span>
        </div>
      </div>

      {/* Content Container translated down smoothly during pull/refresh */}
      <div
        id="pull-to-refresh-content"
        style={{
          transform: `translate3d(0, ${pullDistance}px, 0)`,
          transition: isDragging
            ? 'none'
            : 'transform 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
};
