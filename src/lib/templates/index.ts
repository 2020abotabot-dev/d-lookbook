import type { TemplateDefinition } from './types';

// ── Template Registry ─────────────────────────────────────────────────────────

const COLLECTION: TemplateDefinition = {
  id: 'collection',
  name: 'Collection',
  description: 'Classic product grid with category filtering — inspired by MRL-SS27.',
  defaultGridLayout: '3-col',
  sectionSpacing: 'normal',
  cardAspect: '3/4',
  cardInfoLevel: 'detailed',
  navStyle: 'sticky-top',
  showFilterBar: true,
  heroHeight: '200vh',
  animation: {
    preset: 'expressive',
    scrollEffect: 'clip',
    heroEffect: 'video-scroll',
    cardHover: 'scale',
    stagger: true,
  },
};

const LIFESTYLE: TemplateDefinition = {
  id: 'lifestyle',
  name: 'Lifestyle',
  description: 'Hero-heavy with editorial blocks between product sections.',
  defaultGridLayout: '2-col',
  sectionSpacing: 'generous',
  cardAspect: '4/3',
  cardInfoLevel: 'standard',
  navStyle: 'floating',
  showFilterBar: false,
  heroHeight: '100vh',
  animation: {
    preset: 'standard',
    scrollEffect: 'parallax',
    heroEffect: 'parallax',
    cardHover: 'lift',
    stagger: true,
  },
};

const MINIMAL: TemplateDefinition = {
  id: 'minimal',
  name: 'Minimal',
  description: 'Clean single-column scroll with focus on typography.',
  defaultGridLayout: '4-col',
  sectionSpacing: 'compact',
  cardAspect: '1/1',
  cardInfoLevel: 'minimal',
  navStyle: 'minimal',
  showFilterBar: true,
  heroHeight: '80vh',
  animation: {
    preset: 'minimal',
    scrollEffect: 'fade',
    heroEffect: 'static',
    cardHover: 'none',
    stagger: false,
  },
};

const CINEMATIC: TemplateDefinition = {
  id: 'cinematic',
  name: 'Cinematic',
  description: 'Immersive scroll-driven experience — video hero, horizontal side-scroll panels, sticky chapter sections. Inspired by MRL-SS27.',
  defaultGridLayout: '3-col',
  sectionSpacing: 'generous',
  cardAspect: '3/4',
  cardInfoLevel: 'standard',
  navStyle: 'floating',
  showFilterBar: false,
  heroHeight: '200vh',
  animation: {
    preset: 'expressive',
    scrollEffect: 'clip',
    heroEffect: 'video-scroll',
    cardHover: 'scale',
    stagger: true,
  },
};

const REGISTRY: Record<string, TemplateDefinition> = {
  collection: COLLECTION,
  lifestyle:  LIFESTYLE,
  minimal:    MINIMAL,
  cinematic:  CINEMATIC,
};

export function getTemplate(id: string): TemplateDefinition {
  return REGISTRY[id] ?? COLLECTION;
}

export function getAllTemplates(): TemplateDefinition[] {
  return Object.values(REGISTRY);
}

export type { TemplateDefinition };
