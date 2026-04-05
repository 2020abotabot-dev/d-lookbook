// ── Template Engine Types ──────────────────────────────────────────────────────
// A template is a JSON definition controlling every visual aspect of a published
// lookbook. Tenant branding (colors, fonts) is applied on top at render time.

export interface AnimationConfig {
  /** Overall animation intensity */
  preset: 'minimal' | 'standard' | 'expressive';
  /** How product cards / section text enters on scroll */
  scrollEffect: 'none' | 'fade' | 'clip' | 'parallax';
  /** Hero background behaviour */
  heroEffect: 'static' | 'scale' | 'video-scroll' | 'parallax';
  /** Card hover interaction */
  cardHover: 'none' | 'scale' | 'lift';
  /** Whether to stagger child elements on entrance */
  stagger: boolean;
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;

  // ── Layout ──
  /** Default column count for product grids */
  defaultGridLayout: '2-col' | '3-col' | '4-col' | 'masonry';
  /** Vertical gap between sections */
  sectionSpacing: 'compact' | 'normal' | 'generous';

  // ── Product card ──
  /** Image aspect ratio — CSS aspect-ratio value */
  cardAspect: '1/1' | '3/4' | '4/3' | '16/9';
  /** How much product info to show on the card */
  cardInfoLevel: 'minimal' | 'standard' | 'detailed';

  // ── Navigation ──
  navStyle: 'sticky-top' | 'floating' | 'minimal';
  /** Show category filter bar by default */
  showFilterBar: boolean;

  // ── Hero ──
  /** Initial hero height */
  heroHeight: '60vh' | '80vh' | '100vh' | '200vh';

  // ── Animations ──
  animation: AnimationConfig;
}
