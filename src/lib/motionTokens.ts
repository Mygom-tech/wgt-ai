/**
 * Motion design tokens - single source of truth for all animations.
 * Dark typography hero: blur cascade + ScrambleText + magnetic CTA.
 */

export const motion = {
  // ─── Durations (seconds) ─────────────────────────────────────────────────
  duration: {
    fast: 0.25,
    normal: 0.5,
    slow: 0.7,
    reveal: 0.6,
    stagger: 0.035,
    staggerFast: 0.06,
  },

  // ─── Easings ─────────────────────────────────────────────────────────────
  ease: {
    out: 'power3.out',
    inOut: 'power2.inOut',
    bounce: 'back.out(1.7)',
    smooth: 'power2.out',
    reveal: 'expo.out',
    blurReveal: 'hero.blurReveal',
    magnetSnap: 'hero.magnetSnap',
  },

  // ─── Hero entrance timeline (seconds from t=0) ──────────────────────────
  hero: {
    ambient: 0.0,
    ambientDuration: 0.6,
    eyebrow: 0.2,
    eyebrowDuration: 0.4,
    heading: 0.4,
    headingCharDuration: 0.6,
    headingCharStagger: 0.035,
    subtitle: 1.2,
    subtitleDuration: 2.5,
    subtitleRevealDelay: 0.5,
    proofPoints: 1.4,
    proofDuration: 0.35,
    proofStagger: 0.06,
    cta: 1.8,
    ctaDuration: 0.5,
    trustRow: 2.4,
    trustDuration: 0.5,
  },

  // ─── Interaction tuning ──────────────────────────────────────────────────
  interaction: {
    parallaxIntensity: 4, // px - cursor parallax max shift
    cursorGlowSize: 300, // px - glow radius
    cursorGlowOpacity: 0.08, // 0–1
    cursorGlowLag: 0.8, // seconds - cursor follow lag
    magnetRadius: 120, // px - magnetic pull radius
    magnetStrength: 0.35, // 0–1 - pull strength
  },

  // ─── Visual tuning ──────────────────────────────────────────────────────
  visual: {
    grainOpacity: 0.035, // 0–1 - CSS grain overlay
    blurStart: 18, // px - char blur cascade start
    yStart: 30, // px - char vertical offset
  },
} as const
