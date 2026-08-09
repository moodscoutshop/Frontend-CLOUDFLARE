import React, { useEffect, useMemo, useState } from 'react';

const slideSets = [
  {
    label: 'Analyzing Texture...',
    image:
      'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=600',
    results: [
      {
        name: 'Bouclé Accent Chair',
        meta: 'West Elm • $249',
        match: '95%',
        image:
          'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=200',
      },
      {
        name: 'Terracotta Vase',
        meta: 'Lulu & Georgia • $85',
        match: '88%',
        image:
          'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&q=80&w=200',
      },
    ],
  },
  {
    label: 'Mapping Silhouette...',
    image:
      'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&q=80&w=600',
    results: [
      {
        name: 'Terracotta Vase',
        meta: 'Lulu & Georgia • $85',
        match: '88%',
        image:
          'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&q=80&w=200',
      },
      {
        name: 'Ceramic Table Lamp',
        meta: 'Arteriors • $310',
        match: '91%',
        image:
          'https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&q=80&w=200',
      },
    ],
  },
  {
    label: 'Extracting Palette...',
    image:
      'https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&q=80&w=600',
    results: [
      {
        name: 'Stonewashed Linen Throw',
        meta: 'West Elm • $69',
        match: '93%',
        image:
          'https://images.unsplash.com/photo-1581539250439-c96689b516dd?auto=format&fit=crop&q=80&w=200',
      },
      {
        name: 'Abstract Rug',
        meta: 'Ruggable • $215',
        match: '88%',
        image:
          'https://images.unsplash.com/photo-1575414003591-ece8d0416c7a?auto=format&fit=crop&q=80&w=200',
      },
    ],
  },
];

function matchWidth(match) {
  const parsed = Number.parseInt(match, 10);
  return Number.isNaN(parsed) ? '0%' : `${parsed}%`;
}

/**
 * Spacing matches the dark prototype (~65% camera / snug results).
 * Colors are theme-dynamic:
 * - Light: previous purple accents + light results panel
 * - Dark: gold accents + void results panel
 */
export default function HeroPhoneMockup() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [resultsVisible, setResultsVisible] = useState(true);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setResultsVisible(false);

      window.setTimeout(() => {
        setActiveSlide((prev) => (prev + 1) % slideSets.length);
        setResultsVisible(true);
      }, 300);
    }, 4000);

    return () => window.clearInterval(intervalId);
  }, []);

  const sliderTransform = useMemo(
    () => `translateX(-${activeSlide * (100 / slideSets.length)}%)`,
    [activeSlide]
  );

  return (
    <div className="relative z-0 flex justify-center lg:justify-end">
      <div className="phone-frame relative h-[505px] w-[248px] overflow-hidden rounded-[3rem] bg-white dark:bg-cosmic-void sm:h-[650px] sm:w-[320px]">
        <div className="absolute inset-x-0 top-0 z-50 flex h-8 justify-between px-8 pt-4 text-[10px] text-white opacity-80">
          <span>9:41</span>
          <div className="flex gap-1.5">
            <span className="material-symbols-outlined text-[12px]">signal_cellular_alt</span>
            <span className="material-symbols-outlined text-[12px]">wifi</span>
            <span className="material-symbols-outlined text-[12px]">battery_full</span>
          </div>
        </div>

        <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#0C0A18] font-sans dark:bg-void">
          <div className="relative h-[65%] w-full overflow-hidden bg-[#181530] dark:bg-surface-bright">
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-8">
              <div className="relative h-full w-full rounded-xl border-2 border-white/20">
                <div className="phone-accent-border absolute left-0 top-0 h-8 w-8 rounded-tl-lg border-l-4 border-t-4" />
                <div className="phone-accent-border absolute right-0 top-0 h-8 w-8 rounded-tr-lg border-r-4 border-t-4" />
                <div className="phone-accent-border absolute bottom-0 left-0 h-8 w-8 rounded-bl-lg border-b-4 border-l-4" />
                <div className="phone-accent-border absolute bottom-0 right-0 h-8 w-8 rounded-br-lg border-b-4 border-r-4" />
              </div>
            </div>

            <div
              className="absolute inset-0 flex transition-transform duration-700 ease-in-out"
              style={{ width: `${slideSets.length * 100}%`, transform: sliderTransform }}
            >
              {slideSets.map((slide) => (
                <div
                  key={slide.label}
                  className="flex h-full w-full items-center justify-center bg-cover bg-center"
                  style={{ backgroundImage: `url("${slide.image}")` }}
                >
                  <div className="rounded-full border border-white/10 bg-black/40 px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm dark:bg-void/40">
                    {slide.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="phone-accent-scan animate-landing-scan pointer-events-none absolute inset-x-0 z-20 h-1 blur-md" />
          </div>

          {/* Light: previous lavender results panel; Dark: void panel */}
          <div className="relative z-30 flex flex-1 flex-col overflow-hidden bg-surface-container-low p-4 dark:bg-void">
            <div className="mb-4 flex items-center justify-between">
              <span className="phone-accent-text text-[10px] font-bold uppercase tracking-widest">
                Vibe-Match Results
              </span>
              <span className="text-[10px] text-on-surface-variant dark:text-text-muted">
                324 Found
              </span>
            </div>

            <div
              className="space-y-3 transition-opacity duration-500"
              style={{ opacity: resultsVisible ? 1 : 0 }}
            >
              {slideSets[activeSlide].results.map((item) => (
                <div
                  key={`${slideSets[activeSlide].label}-${item.name}`}
                  className="animate-landing-fade-in flex items-center gap-3 rounded-xl border border-black/5 bg-surface-bright p-2 shadow-sm dark:border-white/5 dark:bg-surface dark:shadow-none"
                >
                  <div
                    className="h-14 w-14 shrink-0 rounded-lg bg-surface-container bg-cover bg-center dark:bg-surface-bright"
                    style={{ backgroundImage: `url("${item.image}")` }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-bold text-on-surface dark:[color:rgb(var(--c-phone-accent))]">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-on-surface-variant dark:text-text-muted">
                      {item.meta}
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-outline/10 dark:bg-white/10">
                      <div
                        className="phone-accent-bg h-full"
                        style={{ width: matchWidth(item.match) }}
                      />
                    </div>
                  </div>
                  <div className="phone-accent-text text-[10px] font-bold">{item.match}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-surface-raised dark:bg-cosmic-void" />
      </div>

      <div className="absolute -right-12 top-1/2 -z-10 h-64 w-64 rounded-full bg-electric-purple/5 blur-[80px] dark:bg-electric-purple/10" />
    </div>
  );
}
