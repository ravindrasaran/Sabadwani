import React, { useState, useEffect, useRef } from "react";

interface RippleCircle {
  x: number;
  y: number;
  size: number;
  id: number;
}

interface RippleProps {
  color?: string;
  duration?: number;
}

export const Ripple: React.FC<RippleProps> = ({
  color = "rgba(230, 138, 0, 0.15)", // Default matches the beautiful golden accent theme color
  duration = 600,
}) => {
  const [ripples, setRipples] = useState<RippleCircle[]>([]);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = elementRef.current?.parentElement;
    if (!parent) return;

    // Set CSS overflow and position styles on parent if not already safe
    const computedStyle = window.getComputedStyle(parent);
    if (computedStyle.position === "static") {
      parent.style.position = "relative";
    }
    // Note: Do not override overflow if it's already specified to allow visual customization,
    // but default to 'hidden' to prevent layout break.
    if (computedStyle.overflow !== "hidden") {
      parent.style.overflow = "hidden";
    }

    const triggerRipple = (e: MouseEvent | TouchEvent) => {
      const rect = parent.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;

      if ("touches" in e) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // The diameter of the ripple circle needs to cover the entire element boundaries safely
      const size = Math.max(rect.width, rect.height) * 2;
      const id = Date.now() + Math.random();

      setRipples((prev) => [...prev, { x, y, size, id }]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((item) => item.id !== id));
      }, duration);
    };

    parent.addEventListener("mousedown", triggerRipple, { passive: true });
    parent.addEventListener("touchstart", triggerRipple, { passive: true });

    return () => {
      parent.removeEventListener("mousedown", triggerRipple);
      parent.removeEventListener("touchstart", triggerRipple);
    };
  }, [duration]);

  return (
    <div
      ref={elementRef}
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none animate-ripple"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: color,
            animationDuration: `${duration}ms`,
          }}
        />
      ))}
    </div>
  );
};

export default Ripple;
