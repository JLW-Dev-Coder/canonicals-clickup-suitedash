---
slug: 29355_Stacks_Pages_CSS
module_type: stack-css
sd_item_id: 29355
platform: tpp
cu_page_id: 80djf-701697
cu_url: 'https://app.clickup.com/8402511/v/dc/80djf-83497/80djf-701697'
cu_parent_page_id: 80djf-701517
cu_path: >-
  Item 29355 - Tax Prep Setup > Deal > Item: 29355 - Stacks > 29355_Stacks_Pages
  > 29355_Stacks_Pages_CSS
last_synced: '2026-05-08'
last_editor: JLW
status: live
parent_stack_slug: 29355_Stacks_Pages
---
<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,500;1,600&family=Inter:wght@400;500;600;700&display=swap');

:root {
  --tpp-rose:           #E91E63;
  --tpp-rose-deep:      #C2185B;
  --tpp-rose-glow:      rgba(233, 30, 99, 0.45);
  --tpp-crimson:        #8B1538;
  --tpp-crimson-deep:   #5C0D24;
  --tpp-blush:          #FFE5EC;
  --tpp-blush-tint:     rgba(255, 229, 236, 0.6);
  --tpp-noir:           #1A0B14;
  --tpp-champagne:      #F5E6D3;
  --tpp-champagne-deep: #EBD7BE;
  --tpp-ivory:          #FFFAF4;
  --tpp-gold-leaf:      #D4A574;
  --tpp-gold-bright:    #E8C088;

  --tpp-text:           #2A1820;
  --tpp-text-muted:     #6B5260;
  --tpp-text-on-dark:   #F5E6D3;
  --tpp-text-on-rose:   #FFFFFF;

  --tpp-border:         rgba(139, 21, 56, 0.14);
  --tpp-border-strong:  rgba(139, 21, 56, 0.30);
  --tpp-border-rose:    rgba(233, 30, 99, 0.35);

  --tpp-font-display:   "Cormorant Garamond", "Playfair Display", Georgia, serif;
  --tpp-font-body:      "Inter", "Helvetica Neue", Arial, sans-serif;
  --tpp-radius-sm:      8px;
  --tpp-radius-md:      14px;
  --tpp-radius-lg:      24px;

  --tpp-shadow-sm:      0 2px 12px rgba(139, 21, 56, 0.08);
  --tpp-shadow-md:      0 16px 40px rgba(139, 21, 56, 0.14);
  --tpp-shadow-lg:      0 28px 70px rgba(139, 21, 56, 0.22);
  --tpp-shadow-rose:    0 16px 50px rgba(233, 30, 99, 0.30);

  --tpp-ease-out:       cubic-bezier(0.16, 1, 0.3, 1);
  --tpp-ease-in-out:    cubic-bezier(0.65, 0, 0.35, 1);
  --tpp-dur-fast:       180ms;
  --tpp-dur-base:       400ms;
  --tpp-dur-slow:       800ms;
  --tpp-dur-reveal:     900ms;
}

/* Reset within scope only */
.tpp-lp, .tpp-lp * { box-sizing: border-box; }
.tpp-lp {
  font-family: var(--tpp-font-body);
  color: var(--tpp-text);
  background: var(--tpp-champagne);
  line-height: 1.55;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.tpp-lp a,
.tpp-lp a:link,
.tpp-lp a:visited,
.tpp-lp a:hover,
.tpp-lp a:focus,
.tpp-lp a:active { color: inherit; text-decoration: none !important; }
.tpp-lp a *,
.tpp-lp a span,
.tpp-lp a em,
.tpp-lp a small,
.tpp-lp a h1,
.tpp-lp a h2,
.tpp-lp a h3,
.tpp-lp a h4,
.tpp-lp a p,
.tpp-lp a div { text-decoration: none !important; border-bottom: 0 !important; }
.tpp-lp img { max-width: 100%; display: block; }
.tpp-wrap { width: 100%; max-width: 1180px; margin: 0 auto; padding: 0 24px; }
.tpp-narrow { max-width: 880px; }

/* Header */
.tpp-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(245, 230, 211, 0.85);
  backdrop-filter: saturate(140%) blur(12px);
  -webkit-backdrop-filter: saturate(140%) blur(12px);
  border-bottom: 1px solid var(--tpp-border);
  transition: background var(--tpp-dur-base) ease, box-shadow var(--tpp-dur-base) ease;
}
.tpp-header.is-scrolled {
  background: rgba(245, 230, 211, 0.95);
  box-shadow: var(--tpp-shadow-sm);
}
.tpp-header .tpp-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  gap: 32px;
}
.tpp-nav {
  display: flex;
  align-items: center;
  gap: 28px;
  flex: 1;
  justify-content: center;
}
.tpp-nav a {
  font-family: var(--tpp-font-body);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.4px;
  color: var(--tpp-noir) !important;
  position: relative;
  padding: 6px 0;
  transition: color var(--tpp-dur-base) ease;
}
.tpp-nav a::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--tpp-rose), var(--tpp-crimson));
  transition: width var(--tpp-dur-base) var(--tpp-ease-out), left var(--tpp-dur-base) var(--tpp-ease-out);
  border-radius: 2px;
}
.tpp-nav a:hover {
  color: var(--tpp-rose) !important;
}
.tpp-nav a:hover::after {
  width: 100%;
  left: 0;
}
.tpp-brand-mark { display: inline-flex; flex-direction: column; gap: 2px; }
.tpp-brand-name {
  font-family: var(--tpp-font-display);
  font-size: 26px;
  font-weight: 600;
  color: var(--tpp-crimson);
  letter-spacing: 0.3px;
  line-height: 1;
}
.tpp-brand-tag {
  font-family: var(--tpp-font-body);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.8px;
  color: var(--tpp-rose);
}
.tpp-header-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, var(--tpp-rose), var(--tpp-crimson));
  color: var(--tpp-text-on-rose);
  padding: 12px 22px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.4px;
  position: relative;
  overflow: hidden;
  transition: transform var(--tpp-dur-base) var(--tpp-ease-out),
              box-shadow var(--tpp-dur-base) var(--tpp-ease-out);
  box-shadow: var(--tpp-shadow-sm);
  animation: tpp-wiggle 5s var(--tpp-ease-in-out) infinite;
  animation-delay: -2.5s;
  transform-origin: center center;
}
.tpp-header-cta::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, var(--tpp-rose-deep), var(--tpp-crimson-deep));
  opacity: 0;
  transition: opacity var(--tpp-dur-base) ease;
  z-index: 0;
}
.tpp-header-cta > * { position: relative; z-index: 1; }
.tpp-header-cta:hover {
  transform: translateY(-2px);
  box-shadow: var(--tpp-shadow-rose);
  animation-play-state: paused;
}
.tpp-header-cta:hover::before { opacity: 1; }

/* Hero */
.tpp-hero {
  position: relative;
  overflow: hidden;
  padding: 96px 0 96px;
  background: linear-gradient(135deg, var(--tpp-champagne) 0%, var(--tpp-blush) 60%, var(--tpp-champagne-deep) 100%);
}
.tpp-hero::before {
  content: "";
  position: absolute;
  inset: 24px;
  border: 2px solid rgba(139, 21, 56, 0.25);
  border-radius: 20px;
  pointer-events: none;
  z-index: 1;
}
.tpp-hero::after {
  content: "";
  position: absolute;
  inset: 40px;
  border: 1px solid rgba(212, 165, 116, 0.35);
  border-radius: 14px;
  pointer-events: none;
  z-index: 1;
}

/* Breathing background gradient */
.tpp-hero-breath {
  position: absolute;
  inset: -10%;
  background:
    radial-gradient(ellipse 60% 50% at 22% 18%, rgba(233, 30, 99, 0.18) 0%, transparent 60%),
    radial-gradient(ellipse 50% 60% at 78% 82%, rgba(139, 21, 56, 0.20) 0%, transparent 60%),
    radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255, 229, 236, 0.55) 0%, transparent 70%);
  z-index: 0;
  animation: tpp-breath 14s var(--tpp-ease-in-out) infinite;
}
@keyframes tpp-breath {
  0%, 100% { transform: scale(1) translate(0, 0); opacity: 1; }
  50%      { transform: scale(1.08) translate(-1.5%, 1%); opacity: 0.85; }
}

.tpp-hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
  z-index: 0;
}
.tpp-hero-orb.tpp-one {
  width: 360px; height: 360px;
  top: -100px; left: -120px;
  background: var(--tpp-rose-glow);
}
.tpp-hero-orb.tpp-two {
  width: 420px; height: 420px;
  bottom: -160px; right: -140px;
  background: rgba(139, 21, 56, 0.32);
}
.tpp-hero-orb.tpp-three {
  width: 240px; height: 240px;
  top: 30%; right: 30%;
  background: rgba(212, 165, 116, 0.30);
}

.tpp-hero .tpp-wrap {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 72px;
  align-items: center;
}

.tpp-hero-kicker {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2.4px;
  text-transform: uppercase;
  color: var(--tpp-noir);
  background: var(--tpp-ivory);
  padding: 10px 22px 10px 18px;
  border-radius: 999px;
  margin-bottom: 28px;
  border: 1.5px solid var(--tpp-crimson);
  box-shadow: 0 2px 12px rgba(139, 21, 56, 0.10);
}
.tpp-hero-kicker::before {
  content: "";
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--tpp-rose);
  flex: 0 0 auto;
  box-shadow: 0 0 0 3px rgba(233, 30, 99, 0.18);
}

.tpp-h1 {
  font-family: var(--tpp-font-display);
  font-size: clamp(44px, 5.6vw, 72px);
  font-weight: 600;
  color: var(--tpp-noir);
  line-height: 1.02;
  letter-spacing: -0.8px;
  margin: 0 0 26px;
}
.tpp-h1 span { display: block; }
.tpp-accent {
  color: var(--tpp-rose);
  font-style: italic;
  font-weight: 600;
  -webkit-text-fill-color: var(--tpp-rose);
}
.tpp-accent-rose {
  color: var(--tpp-rose);
  font-style: italic;
}

.tpp-lede {
  font-size: 19px;
  color: var(--tpp-text-muted);
  margin: 0 0 36px;
  max-width: 540px;
  line-height: 1.6;
}

.tpp-hero-ctas {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 32px;
}

.tpp-lp .tpp-btn-primary,
.tpp-lp .tpp-btn-primary:link,
.tpp-lp .tpp-btn-primary:visited,
.tpp-lp .tpp-btn-primary:hover,
.tpp-lp .tpp-btn-primary:focus,
.tpp-lp .tpp-btn-primary:active,
.tpp-lp .tpp-btn-primary span,
.tpp-lp .tpp-btn-primary > *,
.tpp-lp .tpp-header-cta,
.tpp-lp .tpp-header-cta:link,
.tpp-lp .tpp-header-cta:visited,
.tpp-lp .tpp-header-cta:hover,
.tpp-lp .tpp-header-cta:focus,
.tpp-lp .tpp-header-cta:active,
.tpp-lp .tpp-header-cta span,
.tpp-lp .tpp-header-cta > * { color: #FFFFFF !important; }

/* Primary CTA — gradient pill with shimmer sweep on hover */
.tpp-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, var(--tpp-rose), var(--tpp-crimson));
  color: var(--tpp-text-on-rose);
  padding: 18px 32px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.4px;
  position: relative;
  overflow: hidden;
  transition: transform var(--tpp-dur-base) var(--tpp-ease-out),
              box-shadow var(--tpp-dur-base) var(--tpp-ease-out);
  box-shadow: var(--tpp-shadow-sm);
  animation: tpp-wiggle 5s var(--tpp-ease-in-out) infinite;
  transform-origin: center center;
}
@keyframes tpp-wiggle {
  0%, 100% { transform: translateY(0)    rotate(0deg); }
  15%      { transform: translateY(-10px) rotate(-6deg); }
  35%      { transform: translateY(8px)  rotate(5deg); }
  55%      { transform: translateY(-6px) rotate(-4deg); }
  75%      { transform: translateY(5px)  rotate(3deg); }
  90%      { transform: translateY(-2px) rotate(-1deg); }
}
.tpp-btn-primary::before {
  content: "";
  position: absolute;
  top: 0; left: -120%;
  width: 60%; height: 100%;
  background: linear-gradient(120deg, transparent 0%, rgba(255, 255, 255, 0.45) 50%, transparent 100%);
  transition: left 700ms var(--tpp-ease-out);
  pointer-events: none;
}
.tpp-btn-primary > * { position: relative; z-index: 1; }
.tpp-btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: var(--tpp-shadow-rose);
  animation-play-state: paused;
}
.tpp-btn-primary:hover::before { left: 130%; }

.tpp-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  color: var(--tpp-crimson);
  padding: 18px 28px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 15px;
  border: 1.5px solid var(--tpp-crimson);
  transition: background var(--tpp-dur-base) ease, color var(--tpp-dur-base) ease;
}
.tpp-btn-secondary:hover {
  background: var(--tpp-crimson);
  color: var(--tpp-text-on-rose);
}

.tpp-arrow { transition: transform var(--tpp-dur-base) var(--tpp-ease-out); display: inline-block; }
.tpp-btn-primary:hover .tpp-arrow,
.tpp-btn-secondary:hover .tpp-arrow,
.tpp-header-cta:hover .tpp-arrow,
.tpp-arrow-link:hover .tpp-arrow,
.tpp-book-here:hover .tpp-arrow {
  transform: translateX(5px);
}

.tpp-hero-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 13px;
  color: var(--tpp-text-muted);
}
.tpp-check {
  color: var(--tpp-rose);
  font-weight: 700;
  margin-right: 6px;
  font-size: 14px;
}

/* Hero photo / avatar frame */
.tpp-hero-photo {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}
.tpp-photo-frame {
  position: relative;
  width: 100%;
  max-width: 460px;
  aspect-ratio: 4 / 5;
  border-radius: var(--tpp-radius-lg);
  overflow: visible;
  box-shadow: var(--tpp-shadow-lg);
  background: linear-gradient(135deg, var(--tpp-rose) 0%, var(--tpp-crimson) 50%, var(--tpp-gold-leaf) 100%);
  padding: 10px;
  transition: transform var(--tpp-dur-base) var(--tpp-ease-out);
}
.tpp-photo-frame::before {
  content: "";
  position: absolute;
  inset: 10px;
  border-radius: calc(var(--tpp-radius-lg) - 6px);
  background: var(--tpp-ivory);
  z-index: 0;
}
.tpp-photo-frame:hover { transform: translateY(-6px) scale(1.01); }

.tpp-photo-glow {
  position: absolute;
  inset: 22px;
  border-radius: calc(var(--tpp-radius-lg) - 12px);
  overflow: hidden;
  background:
    radial-gradient(circle at 30% 20%, rgba(233, 30, 99, 0.18), transparent 60%),
    radial-gradient(circle at 70% 90%, rgba(139, 21, 56, 0.22), transparent 60%);
  z-index: 0;
  animation: tpp-glow-rotate 18s linear infinite;
}
@keyframes tpp-glow-rotate {
  0%   { transform: rotate(0deg) scale(1); }
  50%  { transform: rotate(180deg) scale(1.1); }
  100% { transform: rotate(360deg) scale(1); }
}
.tpp-photo-frame img {
  position: absolute;
  top: 7px;
  left: 22px;
  right: 22px;
  bottom: 37px;
  width: calc(100% - 44px);
  height: calc(100% - 44px);
  object-fit: cover;
  object-position: center 20%;
  border-radius: calc(var(--tpp-radius-lg) - 12px);
  z-index: 1;
}
.tpp-photo-tag {
  position: absolute;
  top: 22px; left: 30px;
  z-index: 3;
  background: var(--tpp-noir);
  color: var(--tpp-text-on-dark);
  padding: 10px 18px;
  border-radius: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2.2px;
  text-transform: uppercase;
  border: 1.5px solid var(--tpp-gold-leaf);
  box-shadow: 0 4px 16px rgba(26, 11, 20, 0.25);
}
.tpp-photo-badge {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  background: var(--tpp-ivory);
  padding: 16px 22px;
  border-radius: var(--tpp-radius-md);
  box-shadow: var(--tpp-shadow-md);
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  border: 1.5px solid var(--tpp-gold-leaf);
}
.tpp-stars {
  color: var(--tpp-gold-leaf);
  font-size: 18px;
  letter-spacing: 2px;
}
.tpp-label-text {
  font-size: 10px;
  font-weight: 700;
  color: var(--tpp-text-muted);
  letter-spacing: 1.2px;
  text-transform: uppercase;
  text-align: center;
}

/* Scroll cue */
.tpp-hero-scroll {
  position: absolute;
  bottom: 32px; left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  opacity: 0.85;
}
.tpp-scroll-line {
  width: 32px;
  height: 32px;
  background-color: transparent;
  background-image: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='%238B1538' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M16 6 L16 24'/%3E%3Cpath d='M8 17 L16 25 L24 17'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  animation: tpp-scroll-arrow 2.4s var(--tpp-ease-in-out) infinite;
  transform-origin: center;
}
@keyframes tpp-scroll-arrow {
  0%, 100% { transform: translateY(0); opacity: 0.55; }
  50%      { transform: translateY(8px); opacity: 1; }
}
.tpp-scroll-text {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2.4px;
  text-transform: uppercase;
  color: var(--tpp-crimson);
}

/* Stats bar — dark band with animated counters */
.tpp-stats {
  background: var(--tpp-noir);
  color: var(--tpp-text-on-dark);
  padding: 56px 0;
  border-top: 1px solid rgba(212, 165, 116, 0.20);
  border-bottom: 1px solid rgba(212, 165, 116, 0.20);
}
.tpp-stats .tpp-wrap {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
}
.tpp-stat {
  text-align: center;
  position: relative;
}
.tpp-stat:not(:last-child)::after {
  content: "";
  position: absolute;
  right: -16px; top: 50%;
  transform: translateY(-50%);
  width: 1px; height: 60%;
  background: linear-gradient(to bottom, transparent, var(--tpp-gold-leaf), transparent);
  opacity: 0.4;
}
.tpp-stat-num {
  font-family: var(--tpp-font-display);
  font-size: clamp(40px, 5vw, 60px);
  font-weight: 600;
  line-height: 1;
  background: linear-gradient(135deg, var(--tpp-rose) 0%, var(--tpp-gold-bright) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}
.tpp-stat-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: rgba(245, 230, 211, 0.70);
}

/* Section base */
.tpp-section { padding: 112px 0; }
.tpp-section-head {
  text-align: center;
  max-width: 760px;
  margin: 0 auto 72px;
}
.tpp-section-kicker {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2.4px;
  text-transform: uppercase;
  color: var(--tpp-rose);
  margin-bottom: 18px;
}
.tpp-h2 {
  font-family: var(--tpp-font-display);
  font-size: clamp(34px, 4.2vw, 52px);
  font-weight: 600;
  color: var(--tpp-noir);
  line-height: 1.08;
  letter-spacing: -0.5px;
  margin: 0 0 20px;
}
.tpp-h2 em {
  background: linear-gradient(120deg, var(--tpp-rose) 0%, var(--tpp-crimson) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-style: italic;
  font-weight: 600;
}
.tpp-section-head p {
  font-size: 17px;
  color: var(--tpp-text-muted);
  margin: 0;
  line-height: 1.6;
}
.tpp-h3 {
  font-family: var(--tpp-font-display);
  font-size: 28px;
  font-weight: 600;
  color: var(--tpp-noir);
  margin: 0 0 14px;
  line-height: 1.2;
}
.tpp-card-h-accent {
  color: var(--tpp-rose);
  font-style: italic;
  font-weight: 500;
}
.tpp-h3-large {
  font-family: var(--tpp-font-display);
  font-size: clamp(36px, 4.2vw, 54px);
  font-weight: 600;
  color: var(--tpp-noir);
  margin: 0 0 18px;
  line-height: 1.08;
  letter-spacing: -0.5px;
  text-wrap: balance;
  padding: 4px 0 8px 0;
}
.tpp-h3-large em {
  display: block;
  font-style: italic;
  background: linear-gradient(120deg, var(--tpp-rose) 0%, var(--tpp-crimson) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  padding: 4px 16px 8px 0;
  margin-top: 4px;
}
.tpp-h4 {
  font-family: var(--tpp-font-body);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  color: var(--tpp-rose);
  margin: 0 0 18px;
}

/* Service tier cards */
.tpp-types {
  background: var(--tpp-ivory);
  border-top: 1px solid var(--tpp-border);
  border-bottom: 1px solid var(--tpp-border);
}
.tpp-type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
}
.tpp-type-card {
  position: relative;
  display: block;
  background: var(--tpp-ivory);
  border: 1px solid var(--tpp-border);
  border-radius: var(--tpp-radius-lg);
  padding: 40px 32px 36px;
  transition: transform var(--tpp-dur-slow) var(--tpp-ease-out),
              box-shadow var(--tpp-dur-slow) var(--tpp-ease-out),
              border-color var(--tpp-dur-base) ease;
  overflow: hidden;
}
.tpp-card-shimmer {
  position: absolute;
  top: 0; left: -120%;
  width: 60%; height: 100%;
  background: linear-gradient(120deg, transparent 0%, rgba(233, 30, 99, 0.10) 50%, transparent 100%);
  transition: left var(--tpp-dur-slow) var(--tpp-ease-out);
  pointer-events: none;
}
.tpp-type-card:hover {
  transform: translateY(-10px);
  box-shadow: var(--tpp-shadow-lg);
  border-color: var(--tpp-border-rose);
}
.tpp-type-card:hover .tpp-card-shimmer { left: 130%; }

.tpp-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  color: var(--tpp-crimson);
  background: var(--tpp-blush-tint);
  border: 1px solid var(--tpp-border-rose);
  padding: 6px 14px;
  border-radius: 999px;
  margin-bottom: 22px;
}
.tpp-price {
  font-family: var(--tpp-font-display);
  font-weight: 600;
  color: var(--tpp-noir);
  margin: 14px 0 18px;
  line-height: 1.15;
  display: flex;
  align-items: baseline;
  gap: 2px;
}
.tpp-price-currency { font-size: 24px; color: var(--tpp-rose); transform: translateY(-12px); }
.tpp-price-amount {
  font-size: 56px;
  line-height: 1.1;
  display: inline-block;
  padding-bottom: 4px;
  background: linear-gradient(135deg, var(--tpp-noir) 0%, var(--tpp-crimson) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -1px;
}
.tpp-price small {
  font-family: var(--tpp-font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--tpp-text-muted);
  letter-spacing: 0.2px;
  margin-left: 6px;
}
.tpp-type-card p {
  color: var(--tpp-text-muted);
  font-size: 15px;
  margin: 0 0 28px;
  min-height: 70px;
  line-height: 1.6;
}
.tpp-arrow-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--tpp-crimson);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.3px;
  transition: color var(--tpp-dur-base) ease, gap var(--tpp-dur-base) var(--tpp-ease-out);
}
.tpp-type-card:hover .tpp-arrow-link {
  color: var(--tpp-rose);
  gap: 12px;
}

/* 8-phase rail with animated draw-on connector line */
.tpp-how {
  background: var(--tpp-champagne);
  position: relative;
}
.tpp-how::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 10% 30%, rgba(233, 30, 99, 0.06), transparent 50%),
    radial-gradient(circle at 90% 70%, rgba(212, 165, 116, 0.10), transparent 50%);
  pointer-events: none;
}
.tpp-how .tpp-wrap { position: relative; }

.tpp-phase-rail {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 16px;
  position: relative;
  padding-top: 8px;
}
.tpp-phase-line {
  position: absolute;
  top: 30px;
  left: 6%;
  width: 88%;
  height: 4px;
  z-index: 0;
  overflow: visible;
}
.tpp-phase-line line {
  stroke: url(#tpp-phase-grad);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 1100;
  stroke-dashoffset: 1100;
  transition: stroke-dashoffset 1800ms var(--tpp-ease-out);
}
.tpp-phase-rail.is-drawn .tpp-phase-line line {
  stroke-dashoffset: 0;
}

.tpp-phase {
  position: relative;
  z-index: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tpp-num {
  width: 60px; height: 60px;
  border-radius: 50%;
  background: var(--tpp-ivory);
  border: 2px solid var(--tpp-crimson);
  color: var(--tpp-crimson);
  font-family: var(--tpp-font-display);
  font-size: 24px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: var(--tpp-shadow-sm);
  transition: transform var(--tpp-dur-base) var(--tpp-ease-out),
              background var(--tpp-dur-base) ease,
              color var(--tpp-dur-base) ease,
              box-shadow var(--tpp-dur-base) ease;
}
.tpp-phase:hover .tpp-num {
  background: linear-gradient(135deg, var(--tpp-rose), var(--tpp-crimson));
  color: var(--tpp-text-on-rose);
  border-color: transparent;
  transform: scale(1.12) translateY(-4px);
  box-shadow: var(--tpp-shadow-rose);
}
.tpp-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--tpp-text);
  line-height: 1.35;
  letter-spacing: 0.2px;
}

/* Booking form */
.tpp-book {
  background: linear-gradient(180deg, var(--tpp-champagne) 0%, var(--tpp-champagne-deep) 100%);
  border-top: 1px solid var(--tpp-border);
  border-bottom: 1px solid var(--tpp-border);
  position: relative;
  overflow: hidden;
}
.tpp-form-card {
  position: relative;
  background: var(--tpp-ivory);
  border: 1px solid var(--tpp-border);
  border-radius: var(--tpp-radius-lg);
  padding: 64px 56px;
  box-shadow: var(--tpp-shadow-md);
}
.tpp-form-glow {
  position: absolute;
  width: 320px; height: 320px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--tpp-rose-glow) 0%, transparent 70%);
  top: 40px; right: 40px;
  pointer-events: none;
  filter: blur(60px);
  opacity: 0.85;
  z-index: 0;
}
.tpp-form-head,
.tpp-form-embed {
  position: relative;
  z-index: 1;
}
.tpp-form-head {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
}
.tpp-sub {
  font-size: 16px;
  color: var(--tpp-text-muted);
  margin: 0;
  line-height: 1.6;
}
.tpp-form-embed { min-height: 200px; position: relative; }

/* "Now Booking" tilted ribbon banner — extends past form card edge */
.tpp-form-badge {
  position: absolute;
  top: -16px;
  right: -28px;
  z-index: 5;
  width: 180px;
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--tpp-rose) 0%, var(--tpp-crimson) 100%);
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
  text-align: center;
  color: #FFFFFF !important;
  font-family: var(--tpp-font-display);
  line-height: 1;
  box-shadow: 0 14px 32px rgba(139, 21, 56, 0.32);
  transform: rotate(14deg);
  transform-origin: center center;
  animation: tpp-badge-wobble 5.5s var(--tpp-ease-in-out) infinite;
  pointer-events: none;
  /* Symmetric pennant: fishtail notches on both ends */
  clip-path: polygon(
    0% 0%,
    100% 0%,
    93% 50%,
    100% 100%,
    0% 100%,
    7% 50%
  );
}
.tpp-form-badge::before {
  content: "";
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: 14px;
  right: 14px;
  border-top: 1px dashed rgba(255, 229, 236, 0.55);
  border-bottom: 1px dashed rgba(255, 229, 236, 0.55);
  pointer-events: none;
}
.tpp-form-badge-line-1 {
  font-size: 16px;
  font-weight: 500;
  font-style: italic;
  color: #FFFFFF !important;
  letter-spacing: 0.5px;
  text-transform: lowercase;
  opacity: 0.92;
}
.tpp-form-badge-line-2 {
  font-size: 24px;
  font-weight: 600;
  font-style: italic;
  color: #FFFFFF !important;
  letter-spacing: 0.6px;
}
@keyframes tpp-badge-wobble {
  0%, 100% { transform: rotate(14deg) translateY(0); }
  25%      { transform: rotate(11deg) translateY(-3px); }
  50%      { transform: rotate(16deg) translateY(0); }
  75%      { transform: rotate(12deg) translateY(-2px); }
}
@media (max-width: 560px) {
  .tpp-form-badge {
    width: 130px;
    padding: 9px 12px;
    top: 18px;
    right: 12px;
  }
  .tpp-form-badge-line-1 { font-size: 12px; }
  .tpp-form-badge-line-2 { font-size: 16px; }
}
@media (prefers-reduced-motion: reduce) {
  .tpp-form-badge { animation: none !important; }
}


.tpp-form-sd {
  position: relative;
  z-index: 1;
}
.tpp-form-sd label,
.tpp-form-sd .control-label,
.tpp-form-sd legend {
  font-family: var(--tpp-font-body) !important;
  font-size: 11px !important;
  font-weight: 700 !important;
  letter-spacing: 1.6px !important;
  text-transform: uppercase !important;
  color: var(--tpp-rose) !important;
  margin-bottom: 8px !important;
  display: block !important;
}
.tpp-form-sd input[type="text"],
.tpp-form-sd input[type="email"],
.tpp-form-sd input[type="tel"],
.tpp-form-sd input[type="url"],
.tpp-form-sd input[type="number"],
.tpp-form-sd input[type="password"],
.tpp-form-sd input[type="date"],
.tpp-form-sd input[type="time"],
.tpp-form-sd input[type="search"],
.tpp-form-sd select,
.tpp-form-sd textarea,
.tpp-form-sd .form-control {
  font-family: var(--tpp-font-body) !important;
  font-size: 16px !important;
  color: var(--tpp-text) !important;
  background: var(--tpp-champagne) !important;
  border: 1px solid var(--tpp-border) !important;
  border-radius: var(--tpp-radius-md) !important;
  padding: 14px 18px !important;
  width: 100% !important;
  height: auto !important;
  transition: border-color var(--tpp-dur-base) ease, box-shadow var(--tpp-dur-base) ease, background var(--tpp-dur-base) ease !important;
  box-shadow: none !important;
}
.tpp-form-sd input::placeholder,
.tpp-form-sd textarea::placeholder { color: var(--tpp-text-muted) !important; opacity: 0.7 !important; }
.tpp-form-sd input:focus,
.tpp-form-sd select:focus,
.tpp-form-sd textarea:focus,
.tpp-form-sd .form-control:focus {
  outline: none !important;
  border-color: var(--tpp-rose) !important;
  background: var(--tpp-ivory) !important;
  box-shadow: 0 0 0 3px var(--tpp-rose-glow) !important;
}
.tpp-form-sd textarea { min-height: 120px !important; resize: vertical !important; }

.tpp-form-sd .form-group,
.tpp-form-sd .field,
.tpp-form-sd .form-field {
  margin-bottom: 22px !important;
}

.tpp-form-sd input[type="checkbox"],
.tpp-form-sd input[type="radio"] {
  width: auto !important;
  margin-right: 8px !important;
  accent-color: var(--tpp-rose);
}

.tpp-form-sd button,
.tpp-form-sd input[type="submit"],
.tpp-form-sd .btn-primary,
.tpp-form-sd .btn {
  font-family: var(--tpp-font-body) !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 10px !important;
  background: linear-gradient(135deg, var(--tpp-rose), var(--tpp-crimson)) !important;
  color: #FFFFFF !important;
  padding: 16px 32px !important;
  border: none !important;
  border-radius: 999px !important;
  font-weight: 600 !important;
  font-size: 15px !important;
  letter-spacing: 0.4px !important;
  cursor: pointer !important;
  box-shadow: var(--tpp-shadow-sm) !important;
  transition: transform var(--tpp-dur-base) var(--tpp-ease-out), box-shadow var(--tpp-dur-base) var(--tpp-ease-out) !important;
  text-transform: none !important;
  width: auto !important;
  height: auto !important;
}
.tpp-form-sd button:hover,
.tpp-form-sd input[type="submit"]:hover,
.tpp-form-sd .btn-primary:hover,
.tpp-form-sd .btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--tpp-shadow-rose) !important;
}

.tpp-form-sd .help-block,
.tpp-form-sd .form-text,
.tpp-form-sd small {
  font-size: 12px !important;
  color: var(--tpp-text-muted) !important;
  margin-top: 6px !important;
  letter-spacing: 0 !important;
  text-transform: none !important;
  font-weight: 400 !important;
}

.tpp-form-sd .has-error input,
.tpp-form-sd .has-error select,
.tpp-form-sd .has-error textarea,
.tpp-form-sd .is-invalid {
  border-color: var(--tpp-crimson) !important;
}
.tpp-form-sd .help-block.error,
.tpp-form-sd .invalid-feedback {
  color: var(--tpp-crimson) !important;
}

/* Switchery iOS-style toggle (SD uses this for boolean fields) */
.tpp-lp .sd-switchery-wrapper,
.tpp-form-sd .sd-switchery-wrapper {
  display: flex !important;
  align-items: center !important;
  gap: 14px !important;
  margin: 8px 0 !important;
  line-height: 1 !important;
}
.tpp-lp .sd-switchery-wrapper label,
.tpp-form-sd .sd-switchery-wrapper label {
  margin: 0 !important;
  cursor: pointer !important;
  flex: 1 !important;
  line-height: 1.2 !important;
  display: flex !important;
  align-items: center !important;
}
.tpp-lp .switchery,
.tpp-form-sd .switchery {
  flex: 0 0 auto !important;
  width: 44px !important;
  height: 24px !important;
  min-height: 24px !important;
  max-height: 24px !important;
  box-sizing: border-box !important;
  border-radius: 999px !important;
  border: 1px solid transparent !important;
  transition: background-color 300ms var(--tpp-ease-out), border-color 300ms ease, box-shadow 300ms ease !important;
  position: relative !important;
  cursor: pointer !important;
  vertical-align: middle !important;
  display: inline-block !important;
  align-self: center !important;
  padding: 0 !important;
}
.tpp-lp .switchery > small,
.tpp-form-sd .switchery > small {
  width: 20px !important;
  height: 20px !important;
  min-height: 20px !important;
  max-height: 20px !important;
  top: 1px !important;
  bottom: auto !important;
  background: #FFFFFF !important;
  background-color: #FFFFFF !important;
  border-radius: 50% !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25) !important;
  position: absolute !important;
  box-sizing: border-box !important;
  margin: 0 !important;
  transform: none !important;
  transition: left 220ms var(--tpp-ease-out) !important;
}
/* Default/off state — neutral champagne track */
.tpp-lp .switchery,
.tpp-form-sd .switchery {
  background: var(--tpp-champagne-deep) !important;
  background-color: var(--tpp-champagne-deep) !important;
  border-color: var(--tpp-border) !important;
  box-shadow: inset 0 1px 3px rgba(139, 21, 56, 0.10) !important;
}
/* Active/on state — checkbox-driven, reliable across all states */
.tpp-lp input[type="checkbox"]:checked + .switchery,
.tpp-form-sd input[type="checkbox"]:checked + .switchery {
  background: linear-gradient(135deg, var(--tpp-crimson) 0%, var(--tpp-crimson-deep) 100%) !important;
  background-color: var(--tpp-crimson-deep) !important;
  border-color: transparent !important;
  box-shadow: 0 2px 10px rgba(92, 13, 36, 0.35), inset 0 1px 2px rgba(0, 0, 0, 0.15) !important;
}



/* Locations */
.tpp-locations { background: var(--tpp-champagne); }
.tpp-loc-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 28px;
}
.tpp-loc-card {
  background: var(--tpp-ivory);
  border: 1px solid var(--tpp-border);
  border-radius: var(--tpp-radius-lg);
  padding: 40px 36px;
  transition: transform var(--tpp-dur-base) var(--tpp-ease-out),
              box-shadow var(--tpp-dur-base) var(--tpp-ease-out);
  position: relative;
  overflow: hidden;
}
.tpp-loc-card::before {
  content: "";
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 3px;
  background: linear-gradient(90deg, var(--tpp-rose), var(--tpp-crimson), var(--tpp-gold-leaf));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--tpp-dur-slow) var(--tpp-ease-out);
}
.tpp-loc-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--tpp-shadow-md);
}
.tpp-loc-card:hover::before { transform: scaleX(1); }
.tpp-pin {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
  color: var(--tpp-rose);
  margin-bottom: 14px;
}
.tpp-dot {
  display: inline-block;
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--tpp-rose);
  box-shadow: 0 0 0 4px rgba(233, 30, 99, 0.18);
  animation: tpp-dot-pulse 2.4s var(--tpp-ease-in-out) infinite;
}
@keyframes tpp-dot-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(233, 30, 99, 0.18); }
  50%      { box-shadow: 0 0 0 8px rgba(233, 30, 99, 0.05); }
}
.tpp-addr {
  font-size: 15px;
  color: var(--tpp-text);
  margin: 14px 0 10px;
  line-height: 1.6;
}
.tpp-phone {
  font-size: 14px;
  color: var(--tpp-text-muted);
  margin: 0 0 24px;
}
.tpp-book-here {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--tpp-crimson);
  font-weight: 600;
  font-size: 14px;
  transition: color var(--tpp-dur-base) ease, gap var(--tpp-dur-base) var(--tpp-ease-out);
}
.tpp-book-here:hover {
  color: var(--tpp-rose);
  gap: 12px;
}

/* QR strip with interactive flip card */
.tpp-qr-strip {
  background: linear-gradient(135deg, var(--tpp-noir) 0%, var(--tpp-crimson-deep) 100%);
  color: var(--tpp-text-on-dark);
  padding: 96px 0;
  position: relative;
  overflow: hidden;
}
.tpp-qr-bg-glow {
  position: absolute;
  width: 720px; height: 720px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(233, 30, 99, 0.20) 0%, transparent 70%);
  top: -240px; left: -240px;
  pointer-events: none;
  filter: blur(60px);
  animation: tpp-bg-drift 22s var(--tpp-ease-in-out) infinite;
}
@keyframes tpp-bg-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(120px, 80px) scale(1.15); }
}
.tpp-qr-strip .tpp-wrap {
  position: relative;
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 80px;
  align-items: center;
}
.tpp-qr-strip .tpp-h2-on-dark { color: #F5E6D3 !important; }
.tpp-qr-strip .tpp-kicker-on-dark { color: #E8C088 !important; }
.tpp-qr-strip .tpp-qr-copy p { color: rgba(245, 230, 211, 0.92) !important; }
.tpp-qr-strip .tpp-qr-step { color: rgba(245, 230, 211, 0.92) !important; }
.tpp-qr-strip .tpp-step-num { color: #FFFFFF !important; }
.tpp-cta-strip .tpp-h2-on-dark { color: #F5E6D3 !important; }
.tpp-cta-strip p { color: rgba(245, 230, 211, 0.85) !important; }

.tpp-footer { color: rgba(245, 230, 211, 0.78) !important; }
.tpp-footer .tpp-foot-brand { color: #F5E6D3 !important; }
.tpp-footer .tpp-foot-brand-tag { color: var(--tpp-rose) !important; }
.tpp-footer p { color: rgba(245, 230, 211, 0.78) !important; }
.tpp-footer .tpp-h4 { color: #E8C088 !important; }
.tpp-footer a,
.tpp-footer a:link,
.tpp-footer a:visited { color: rgba(245, 230, 211, 0.78) !important; }
.tpp-footer a:hover,
.tpp-footer a:focus { color: var(--tpp-rose) !important; }
.tpp-footer .tpp-contact-line { color: rgba(245, 230, 211, 0.78) !important; }
.tpp-footer .tpp-contact-line strong { color: #E8C088 !important; }
.tpp-footer .tpp-socials a,
.tpp-footer .tpp-socials a:link,
.tpp-footer .tpp-socials a:visited { color: #E8C088 !important; }
.tpp-footer .tpp-socials a:hover { color: #FFFFFF !important; }
.tpp-footer .tpp-copy-bar { color: rgba(245, 230, 211, 0.55) !important; }

.tpp-kicker-on-dark {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2.4px;
  text-transform: uppercase;
  color: var(--tpp-gold-bright);
  margin-bottom: 18px;
}
.tpp-h2-on-dark {
  font-family: var(--tpp-font-display);
  font-size: clamp(32px, 3.8vw, 46px);
  font-weight: 600;
  color: var(--tpp-text-on-dark);
  line-height: 1.15;
  margin: 0 0 22px;
  letter-spacing: -0.3px;
}
.tpp-qr-copy p {
  font-size: 16px;
  color: rgba(245, 230, 211, 0.80);
  margin: 0 0 32px;
  line-height: 1.6;
}
.tpp-qr-steps { display: flex; flex-direction: column; gap: 14px; }
.tpp-qr-step {
  display: flex; align-items: center; gap: 16px;
  font-size: 15px;
  color: rgba(245, 230, 211, 0.92);
}
.tpp-step-num {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--tpp-rose), var(--tpp-crimson));
  color: var(--tpp-text-on-rose);
  font-weight: 700;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tpp-qr-card {
  perspective: 1200px;
  width: 320px;
  max-width: 100%;
  margin-left: auto;
  cursor: pointer;
}
.tpp-qr-card-inner {
  position: relative;
  width: 100%;
  height: 320px;
  aspect-ratio: 1;
  transform-style: preserve-3d;
  transition: transform 900ms var(--tpp-ease-out);
}
.tpp-qr-card.is-flipped .tpp-qr-card-inner { transform: rotateY(180deg); }
.tpp-qr-card-front,
.tpp-qr-card-back {
  position: absolute;
  inset: 0;
  background: var(--tpp-ivory);
  border-radius: var(--tpp-radius-lg);
  padding: 28px;
  text-align: center;
  box-shadow: var(--tpp-shadow-lg);
  -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.tpp-qr-card-front img {
  width: 100%;
  max-width: 220px;
  height: auto;
  min-height: 180px;
  object-fit: contain;
  margin-bottom: 14px;
  display: block;
}
.tpp-qr-label {
  font-family: var(--tpp-font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--tpp-crimson);
}
.tpp-qr-card-back {
  transform: rotateY(180deg);
  background: linear-gradient(135deg, var(--tpp-rose) 0%, var(--tpp-crimson) 100%);
  color: var(--tpp-text-on-rose);
  gap: 10px;
}
.tpp-qr-back-mark {
  font-family: var(--tpp-font-display);
  font-size: 28px;
  font-weight: 600;
  line-height: 1.1;
  padding: 0 24px;
}
.tpp-qr-back-tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2.4px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.85);
}

/* Testimonials */
.tpp-testimonials {
  background: var(--tpp-ivory);
  border-top: 1px solid var(--tpp-border);
}
.tpp-test-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
}
.tpp-test-card {
  background: var(--tpp-champagne);
  border: 1px solid var(--tpp-border);
  border-radius: var(--tpp-radius-md);
  padding: 32px 22px;
  text-align: center;
  transition: transform var(--tpp-dur-base) var(--tpp-ease-out),
              box-shadow var(--tpp-dur-base) var(--tpp-ease-out);
}
.tpp-test-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--tpp-shadow-md);
}
.tpp-test-avatar {
  width: 64px; height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--tpp-rose) 0%, var(--tpp-crimson) 100%);
  color: var(--tpp-text-on-rose);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--tpp-font-display);
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 14px;
  letter-spacing: 0.5px;
  box-shadow: var(--tpp-shadow-sm);
}
.tpp-stars-row {
  color: var(--tpp-gold-leaf);
  font-size: 14px;
  letter-spacing: 2px;
  margin-bottom: 10px;
}
.tpp-test-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--tpp-text);
}

/* CTA strip */
.tpp-cta-strip {
  background: var(--tpp-noir);
  color: var(--tpp-text-on-dark);
  padding: 96px 24px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.tpp-cta-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 50%, rgba(233, 30, 99, 0.18) 0%, transparent 50%),
    radial-gradient(circle at 80% 50%, rgba(139, 21, 56, 0.30) 0%, transparent 50%);
  pointer-events: none;
}
.tpp-cta-strip .tpp-wrap { position: relative; }
.tpp-cta-strip .tpp-h2-on-dark { max-width: 760px; margin: 0 auto 18px; }
.tpp-cta-strip p {
  font-size: 17px;
  color: rgba(245, 230, 211, 0.78);
  max-width: 620px;
  margin: 0 auto 36px;
  line-height: 1.6;
}
.tpp-cta-btn {
  background: linear-gradient(135deg, var(--tpp-rose), var(--tpp-gold-bright));
}
.tpp-cta-btn:hover { background: linear-gradient(135deg, var(--tpp-rose-deep), var(--tpp-rose)); }

/* Footer */
.tpp-footer {
  background: var(--tpp-crimson-deep);
  color: rgba(245, 230, 211, 0.78);
  padding: 72px 0 0;
  font-size: 14px;
}
.tpp-footer .tpp-wrap {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1.2fr 1fr;
  gap: 48px;
  padding-bottom: 56px;
}
.tpp-foot-brand {
  font-family: var(--tpp-font-display);
  font-size: 26px;
  font-weight: 600;
  color: var(--tpp-text-on-dark);
  margin-bottom: 16px;
  line-height: 1.1;
}
.tpp-foot-brand-tag {
  font-family: var(--tpp-font-body);
  display: block;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.8px;
  color: var(--tpp-rose);
  margin-top: 6px;
}
.tpp-footer p {
  margin: 0 0 16px;
  line-height: 1.6;
}
.tpp-footer .tpp-h4 { color: var(--tpp-gold-bright); margin-bottom: 20px; }
.tpp-footer a {
  display: block;
  color: rgba(245, 230, 211, 0.78);
  margin-bottom: 12px;
  transition: color var(--tpp-dur-fast) ease, transform var(--tpp-dur-fast) ease;
  position: relative;
}
.tpp-footer a:hover {
  color: var(--tpp-rose);
  transform: translateX(4px);
}
.tpp-contact-line { margin: 0 0 18px; line-height: 1.55; }
.tpp-contact-line strong {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: var(--tpp-gold-bright);
  margin-bottom: 4px;
}
.tpp-socials { display: flex; gap: 12px; }
.tpp-socials a {
  width: 42px; height: 42px;
  border-radius: 50%;
  background: rgba(212, 165, 116, 0.14);
  color: var(--tpp-gold-bright);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  margin: 0;
  border: 1px solid rgba(212, 165, 116, 0.20);
  transition: background var(--tpp-dur-base) ease,
              color var(--tpp-dur-base) ease,
              border-color var(--tpp-dur-base) ease,
              transform var(--tpp-dur-base) var(--tpp-ease-out);
}
.tpp-socials a:hover {
  background: var(--tpp-rose);
  color: var(--tpp-text-on-rose);
  border-color: var(--tpp-rose);
  transform: translateY(-3px);
}
.tpp-copy-bar {
  border-top: 1px solid rgba(212, 165, 116, 0.16);
  padding: 24px 24px;
  text-align: center;
  font-size: 12px;
  color: rgba(245, 230, 211, 0.55);
  letter-spacing: 0.4px;
}

/* Reveal animations — held hidden ONLY when JS confirms it can release them */
.tpp-lp.tpp-js .tpp-reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity var(--tpp-dur-reveal) var(--tpp-ease-out),
              transform var(--tpp-dur-reveal) var(--tpp-ease-out);
  will-change: opacity, transform;
}
.tpp-lp.tpp-js .tpp-reveal.tpp-in {
  opacity: 1;
  transform: translateY(0);
}
.tpp-delay-1 { transition-delay: 100ms; }
.tpp-delay-2 { transition-delay: 200ms; }
.tpp-delay-3 { transition-delay: 300ms; }
.tpp-delay-4 { transition-delay: 400ms; }
.tpp-delay-5 { transition-delay: 500ms; }
.tpp-delay-6 { transition-delay: 600ms; }
.tpp-delay-7 { transition-delay: 700ms; }

/* Hero stagger — only hidden when JS is active */
.tpp-lp.tpp-js .tpp-stagger {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity var(--tpp-dur-reveal) var(--tpp-ease-out),
              transform var(--tpp-dur-reveal) var(--tpp-ease-out);
}
.tpp-lp.tpp-js.tpp-loaded .tpp-stagger { opacity: 1; transform: translateY(0); }

/* Hero stagger sequence (released after .tpp-loaded class is added) */
.tpp-lp.tpp-js.tpp-loaded .tpp-hero-kicker          { transition-delay: 100ms; }
.tpp-lp.tpp-js.tpp-loaded .tpp-h1 .tpp-stagger:nth-of-type(1) { transition-delay: 220ms; }
.tpp-lp.tpp-js.tpp-loaded .tpp-h1 .tpp-stagger:nth-of-type(2) { transition-delay: 360ms; }
.tpp-lp.tpp-js.tpp-loaded .tpp-lede                 { transition-delay: 520ms; }
.tpp-lp.tpp-js.tpp-loaded .tpp-hero-ctas            { transition-delay: 660ms; }
.tpp-lp.tpp-js.tpp-loaded .tpp-hero-trust           { transition-delay: 800ms; }

/* Responsive */
@media (max-width: 960px) {
  .tpp-nav { display: none; }
  .tpp-hero { padding: 72px 0 80px; }
  .tpp-hero .tpp-wrap { grid-template-columns: 1fr; gap: 48px; }
  .tpp-hero-photo { order: -1; max-width: 380px; margin: 0 auto; }
  .tpp-hero-scroll { display: none; }
  .tpp-section { padding: 80px 0; }
  .tpp-stats .tpp-wrap { grid-template-columns: repeat(2, 1fr); gap: 40px; }
  .tpp-stat:nth-child(2)::after { display: none; }
  .tpp-type-grid { grid-template-columns: 1fr; }
  .tpp-phase-rail { grid-template-columns: repeat(4, 1fr); row-gap: 32px; }
  .tpp-phase-line { display: none; }
  .tpp-form-card { padding: 44px 28px; }
  .tpp-loc-grid { grid-template-columns: 1fr; }
  .tpp-qr-strip .tpp-wrap { grid-template-columns: 1fr; gap: 48px; }
  .tpp-qr-card { margin: 0 auto; }
  .tpp-test-grid { grid-template-columns: repeat(2, 1fr); }
  .tpp-footer .tpp-wrap { grid-template-columns: 1fr 1fr; gap: 36px; }
}
@media (max-width: 560px) {
  .tpp-header-cta { padding: 10px 16px; font-size: 12px; }
  .tpp-h1 { font-size: 40px; }
  .tpp-h2 { font-size: 32px; }
  .tpp-hero-ctas { flex-direction: column; align-items: stretch; }
  .tpp-btn-primary, .tpp-btn-secondary { justify-content: center; }
  .tpp-stats .tpp-wrap { grid-template-columns: 1fr; gap: 32px; }
  .tpp-stat::after { display: none !important; }
  .tpp-phase-rail { grid-template-columns: repeat(2, 1fr); }
  .tpp-test-grid { grid-template-columns: 1fr; }
  .tpp-footer .tpp-wrap { grid-template-columns: 1fr; }
}

/* Honor reduced-motion preference */
@media (prefers-reduced-motion: reduce) {
  .tpp-hero-breath,
  .tpp-photo-glow,
  .tpp-qr-bg-glow,
  .tpp-dot,
  .tpp-scroll-line { animation: none !important; }
  .tpp-lp.tpp-js .tpp-reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
  .tpp-lp.tpp-js .tpp-stagger { opacity: 1 !important; transform: none !important; transition: none !important; }
  .tpp-phase-line line { stroke-dashoffset: 0 !important; transition: none !important; }
  .tpp-btn-primary::before,
  .tpp-card-shimmer { display: none; }
  .tpp-btn-primary,
  .tpp-header-cta { animation: none !important; }
}
</style>

## Change log

| Date | Change | Author |
|------|--------|--------|
| 2026-05-08 | H3 layout fix: removed `.tpp-h3-line-1` and `.tpp-h3-line-2` rules, ported their visual properties to `.tpp-h3-large em` (now `display: block` for two-line layout) | JLW |
| 2026-05-08 | Added `<style>` wrapper tags inline per module-config rule update | JLW |
| 2026-05-08 | Added `text-wrap: balance` to `.tpp-h3-large` to prevent the "Want a landing page like / this" three-line wrap on the booking section headline. Spec: `style-spec/sd-pages.md`. | JLW |
| 2026-05-08 | Widened `.tpp-narrow` from `max-width: 760px` to `880px` so "Want a landing page like this" fits on one line at the form-card headline (54px clamp). Pairs with the `text-wrap: balance` from cb24cd0 (kept as fallback). `.tpp-narrow` is the form section's wrap; only declared/used here. Spec: `style-spec/sd-pages.md`. | JLW |
