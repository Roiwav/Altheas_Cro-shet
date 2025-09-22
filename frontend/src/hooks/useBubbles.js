// src/hooks/useBubbles.js
import { useEffect } from 'react';

/**
 * Adds floating gradient bubble particles inside a container with the given class name.
 * - Colors match system brand: purple ⇄ pink.
 * - Respects dark mode by relying on container background.
 * - Cleans up on unmount.
 *
 * @param {string} containerClass - e.g. 'login-container' (without leading dot)
 * @param {object} opts
 * @param {number} [opts.count=20] - number of bubbles to spawn
 * @param {[number, number]} [opts.sizeRange=[6,16]] - min/max size in px
 * @param {[number, number]} [opts.durationRange=[10,20]] - min/max float duration in s
 * @param {number} [opts.opacity=0.2] - bubble opacity
 */
export default function useBubbles(
  containerClass,
  {
    count = 20,
    sizeRange = [6, 16],
    durationRange = [10, 20],
    opacity = 0.2,
  } = {}
) {
  useEffect(() => {
    const container = document.querySelector(`.${containerClass}`);
    if (!container) return;

    // Ensure keyframes exist once
    const STYLE_ID = 'bubbles-float-keyframes';
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `@keyframes floatBubble { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(-1000px) rotate(720deg); opacity: 0; } }`;
      document.head.appendChild(style);
    }

    const created = [];
    const [minSize, maxSize] = sizeRange;
    const [minDur, maxDur] = durationRange;

    const spawn = () => {
      if (document.hidden) return; // avoid offscreen work
      for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        const size = Math.random() * (maxSize - minSize) + minSize;
        el.className = 'absolute rounded-full';
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.left = `${Math.random() * 100}%`;
        el.style.top = `${Math.random() * 100}%`;
        el.style.opacity = String(opacity);
        // Brand gradient
        el.style.background = 'linear-gradient(90deg, rgba(168,85,247,1) 0%, rgba(236,72,153,1) 100%)';
        el.style.filter = 'blur(0.3px)';
        el.style.animation = `floatBubble ${Math.random() * (maxDur - minDur) + minDur}s linear infinite`;
        container.appendChild(el);
        created.push(el);
      }
    };

    // Defer to idle
    const idleId = window.requestIdleCallback ? window.requestIdleCallback(spawn) : setTimeout(spawn, 0);

    return () => {
      if (window.cancelIdleCallback && typeof idleId === 'number') {
        try { window.cancelIdleCallback(idleId); } catch { /* ignore if not supported */ }
      } else if (typeof idleId === 'number') {
        clearTimeout(idleId);
      }
      created.forEach((el) => el.remove());
    };
  }, [containerClass, count, sizeRange, durationRange, opacity]);
}
