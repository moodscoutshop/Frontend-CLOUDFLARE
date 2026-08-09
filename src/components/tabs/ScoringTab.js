import React, { useState } from 'react';
import { TrendingUp, Sparkles, ChevronDown, ChevronUp, Info, ShieldCheck, ExternalLink } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';

/**
 * ScoringTab - Match Scoring System explanation
 * Informative and visual presentation of how products are scored
 */
export function ScoringTab() {
  const { 
    analysisData
  } = useSearch();
  
  const [expandedSection, setExpandedSection] = useState(null);
  
  // Scoring tab loads immediately after analysis
  const isComplete = analysisData !== null;
  
  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };
  
  // Scoring components data
  const scoringComponents = [
    {
      id: 'content',
      name: 'Content Match',
      weight: '35%',
      priority: 'Highest Priority',
      color: 'blue',
      icon: 'C',
      description: 'Checks if the product contains the actual objects, materials, and features you\'re looking for. We compare your Pinterest keywords against eBay\'s Item Specifics (Material, Type, Style) and product descriptions.',
      example: 'Your board has "oak wood", "handmade", "rustic table" → Product with Material: Oak, Type: Handmade, Style: Rustic = High content score ✅'
    },
    {
      id: 'color',
      name: 'Color Match',
      weight: '25%',
      priority: 'High Priority',
      color: 'green',
      icon: 'L',
      description: 'Ensures the product\'s color palette matches your board\'s aesthetic. We check eBay\'s Color attribute and understand synonyms (e.g., "Burgundy" matches "Red").',
      example: 'Your board palette: "Navy", "Gold", "Cream" → Product with Color: Navy Blue or gold accents in description = High color score 🎨'
    },
    {
      id: 'category',
      name: 'Category Match',
      weight: '25%',
      priority: 'High Priority',
      color: 'orange',
      icon: 'Cat',
      description: 'Verifies the product type is correct based on your board\'s focus. We match against eBay\'s category hierarchy (e.g., "Home & Garden → Kitchen → Cookware").',
      example: 'Your board focuses on "Home Decor" → Product in Home & Garden → Decor category = High category score 🏠'
    },
    {
      id: 'theme',
      name: 'Theme Match',
      weight: '15%',
      priority: 'Standard Priority',
      color: 'amber',
      icon: 'T',
      description: 'Captures the aesthetic mood and style of your collection. We check Theme, Genre, Franchise, and Character fields to match the overall vibe.',
      example: 'Your board has "Harry Potter" theme → Product with Franchise: Harry Potter or Character: Hogwarts = High theme score ✨'
    }
  ];
  
  const colorStyles = {
    blue: {
      bg: 'from-blue-100 to-blue-200 dark:from-blue-900/55 dark:to-blue-800/40',
      border: 'border-blue-100 dark:border-blue-400/30',
      text: 'text-blue-600 dark:text-blue-300',
      badge: 'bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
      example: 'bg-blue-50 border-blue-100 text-blue-800 dark:bg-blue-500/15 dark:border-blue-400/30 dark:text-blue-200'
    },
    green: {
      bg: 'from-green-100 to-green-200 dark:from-green-900/55 dark:to-green-800/40',
      border: 'border-green-100 dark:border-green-400/30',
      text: 'text-green-600 dark:text-green-300',
      badge: 'bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-300',
      example: 'bg-green-50 border-green-100 text-green-800 dark:bg-green-500/15 dark:border-green-400/30 dark:text-green-200'
    },
    orange: {
      bg: 'from-orange-100 to-orange-200 dark:from-orange-900/55 dark:to-orange-800/40',
      border: 'border-orange-100 dark:border-orange-400/30',
      text: 'text-orange-600 dark:text-orange-300',
      badge: 'bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
      example: 'bg-orange-50 border-orange-100 text-orange-800 dark:bg-orange-500/15 dark:border-orange-400/30 dark:text-orange-200'
    },
    amber: {
      bg: 'from-amber-100 to-amber-200 dark:from-amber-900/55 dark:to-amber-800/40',
      border: 'border-amber-100 dark:border-amber-400/30',
      text: 'text-amber-600 dark:text-amber-300',
      badge: 'bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
      example: 'bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-500/15 dark:border-amber-400/30 dark:text-amber-200'
    }
  };
  
  return (
    <div className="py-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-blue rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-on-primary-strong" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">Match Scoring System</h2>
            <p className="text-sm text-on-surface-variant">How we calculate product relevance</p>
          </div>
        </div>
        
        {isComplete && (
          <div className="flex items-center gap-2 text-sm text-primary bg-primary/15 px-3 py-1.5 rounded-full">
            <span>✓</span>
            <span>Ready</span>
          </div>
        )}
      </div>
      
      {/* Introduction */}
      <div className="bg-accent-blue/10 rounded-lg p-4 sm:p-6 mb-8 border border-accent-blue/30">
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-accent-blue flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-on-surface mb-2">Understanding Your Match Scores</h3>
            <p className="text-on-surface-variant leading-relaxed">
              Every product gets a <strong>Match Score (0-100%)</strong> based on how well it aligns with your Pinterest aesthetic.
              We analyze four key dimensions and weight them to prioritize what matters most: getting the <em>right item</em> with the <em>right vibe</em>.
            </p>
          </div>
        </div>
      </div>
      
      {/* Scoring Components Grid */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-8">
        {scoringComponents.map((component) => {
          const styles = colorStyles[component.color];
          const isExpanded = expandedSection === component.id;
          
          return (
            <div
              key={component.id}
              className={`
                bg-surface-elevated rounded-lg shadow-md border ${styles.border} 
                hover:shadow-xl transition-all duration-300 overflow-hidden
              `}
            >
              {/* Header - Always Visible */}
              <button
                onClick={() => toggleSection(component.id)}
                className="w-full p-4 sm:p-6 text-left"
              >
                <div className="flex items-start gap-3 sm:gap-4 mb-3">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${styles.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-base sm:text-xl font-bold ${styles.text}`}>{component.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg sm:text-xl font-bold text-on-surface mb-1">{component.name}</h4>
                    <span className={`inline-block text-xs sm:text-sm ${styles.badge} px-2 sm:px-3 py-1 rounded-full font-semibold`}>
                      {component.weight} Weight ({component.priority})
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-on-surface-variant" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-on-surface-variant" />
                    )}
                  </div>
                </div>
                
                {/* Short Description */}
                <p className={`text-on-surface-variant text-sm sm:text-base leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                  {component.description}
                </p>
              </button>
              
              {/* Expanded Example */}
              {isExpanded && (
                <div className={`px-4 sm:px-6 pb-4 sm:pb-6 animate-fade-in`}>
                  <div className={`${styles.example} rounded-lg p-3 sm:p-4 border`}>
                    <p className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2">Example:</p>
                    <p className="text-xs sm:text-sm text-on-surface-variant">{component.example}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Formula Summary */}
      <div className="bg-surface-elevated rounded-lg p-4 sm:p-6 border border-outline/10 shadow-md">
        <div className="flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-accent-blue flex-shrink-0 mt-1" />
          <div>
            <h5 className="font-bold text-on-surface mb-2">How We Calculate Final Scores</h5>
            <div className="bg-surface-container-low rounded-lg p-3 sm:p-4 mb-4 font-mono text-xs sm:text-sm text-on-surface-variant overflow-x-auto">
              <span className="text-blue-600 dark:text-blue-300">Content</span> × 0.35 + 
              <span className="text-green-600 dark:text-green-300"> Color</span> × 0.25 + 
              <span className="text-orange-600 dark:text-orange-300"> Category</span> × 0.25 + 
              <span className="text-amber-600 dark:text-amber-300"> Theme</span> × 0.15 = 
              <span className="text-primary font-bold"> Final Score</span>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              We prioritize <strong>Content + Category (60%)</strong> to ensure you get the <em>right product type</em>,
              then add <strong>Color + Theme (40%)</strong> for the perfect <em>aesthetic match</em>.
              Our AI checks official eBay Item Specifics first, falling back to smart text analysis when needed.
            </p>
          </div>
        </div>
      </div>
      
      {/* Visual Score Breakdown */}
      <div className="mt-8">
        <h4 className="font-bold text-on-surface mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Weight Distribution
        </h4>
        <div className="flex rounded-full overflow-hidden h-6 sm:h-8 shadow-inner bg-surface-container-low">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-400 dark:from-blue-700 dark:to-blue-600 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: '35%' }}
          >
            35%
          </div>
          <div
            className="bg-gradient-to-r from-green-500 to-green-400 dark:from-green-800 dark:to-green-700 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: '25%' }}
          >
            25%
          </div>
          <div
            className="bg-gradient-to-r from-orange-500 to-orange-400 dark:from-orange-800 dark:to-orange-700 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: '25%' }}
          >
            25%
          </div>
          <div
            className="bg-gradient-to-r from-amber-500 to-amber-400 dark:from-amber-900 dark:to-amber-800 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: '15%' }}
          >
            15%
          </div>
        </div>
        <div className="flex mt-2 text-xs text-on-surface-variant">
          <span className="text-center" style={{ width: '35%' }}>Content</span>
          <span className="text-center" style={{ width: '25%' }}>Color</span>
          <span className="text-center" style={{ width: '25%' }}>Category</span>
          <span className="text-center" style={{ width: '15%' }}>Theme</span>
        </div>
      </div>

      {/* Visual Example — Scoring Badge on Product Card */}
      <div className="mt-8">
        <div className="bg-surface-elevated rounded-xl p-5 sm:p-7 border border-outline/10 shadow-md">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 bg-accent-blue rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              <TrendingUp className="w-5 h-5 text-on-primary-strong" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface mb-1">Understanding Match Score Badges</h3>
              <p className="text-sm text-on-surface-variant">Every product card displays a match score badge showing how well it aligns with your aesthetic.</p>
            </div>
          </div>

          {/* Skeleton product card mockup for scoring badge */}
          <div className="border border-outline/10 rounded-lg p-4 bg-surface-container-low flex flex-col">
            <p className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Visual Example — Where to find the scoring badge on a product card</p>
            <div className="flex-1 flex items-center justify-center">
              <div className="max-w-[220px] w-full">
                <div className="bg-surface-elevated rounded-lg shadow border border-outline/10 overflow-hidden">
                  {/* Skeleton image area */}
                  <div className="aspect-square relative bg-surface-container-low">
                    {/* Animated skeleton shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-surface-section via-surface-bright to-surface-section animate-pulse" />
                    {/* Condition badge placeholder (faded) */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className="inline-block bg-outline text-on-surface-variant text-[10px] font-semibold px-2 py-0.5 rounded opacity-50">
                        Condition
                      </span>
                    </div>
                    {/* Scoring badge — highlighted */}
                    <div className="absolute top-2 right-2 z-10">
                      <span className="relative inline-flex items-center gap-1 bg-surface-elevated/90 backdrop-blur-sm px-2 py-0.5 rounded shadow-md ring-2 ring-accent-blue/40 ring-offset-1 ring-offset-background">
                        <TrendingUp className="w-2.5 h-2.5 text-accent-blue" />
                        <span className="text-[10px] font-semibold text-accent-blue">87.5%</span>
                      </span>
                      {/* Dotted arrow pointing up to scoring badge */}
                      <div className="mt-1 flex items-start justify-end mr-1">
                        <div className="flex flex-col items-start">
                          <svg width="60" height="36" viewBox="0 0 60 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <polygon points="30,0 26,7 34,7" fill="oklch(var(--c-accent-blue))"/>
                            <path d="M30 34 Q30 26 30 8" stroke="oklch(var(--c-accent-blue))" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3"/>
                          </svg>
                          <span className="text-[9px] font-semibold text-accent-blue ml-1">Match Score</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Skeleton text area */}
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-surface-container-low rounded w-[85%]" />
                    <div className="h-3 bg-surface-container-low rounded w-[60%]" />
                    <div className="h-4 bg-surface-container-low rounded w-[35%] mt-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Precision Search Section */}
      <div className="mt-8">
        <div className="bg-gradient-to-br from-primary/15 via-primary/10 to-shadow-amber/10 rounded-xl p-5 sm:p-7 border border-outline/10 shadow-md">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
              <Sparkles className="w-5 h-5 text-on-primary-strong" />
            </div>
            <div className="w-full">
              <h3 className="text-lg font-bold text-on-surface mb-1">Precision Search Mode</h3>
              <p className="text-on-surface-variant leading-relaxed mb-5">
                Precision Search tells the AI to generate <strong>highly specific, detailed descriptions</strong> instead of general terms.
                This can dramatically improve match accuracy for niche or specific items, but may return fewer results if exact products aren't available on eBay.
              </p>

              {/* Side-by-side keyword comparison */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Standard mode */}
                <div className="bg-surface-container-low rounded-lg p-4 border border-outline/10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-on-surface-variant/50" />
                    <h4 className="text-sm font-semibold text-on-surface-variant">Standard Search</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <span className="text-outline mt-0.5">•</span>
                      <span>blue ceramic vase</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-outline mt-0.5">•</span>
                      <span>wooden side table</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-outline mt-0.5">•</span>
                      <span>modern wall art</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-outline mt-0.5">•</span>
                      <span>brass table lamp</span>
                    </li>
                  </ul>
                  <p className="text-xs text-on-surface-variant/60 mt-3 italic">
                    Broader terms → More results, wider variety
                  </p>
                </div>

                {/* Precision mode */}
                <div className="bg-primary/20 rounded-lg p-4 border border-outline/10 shadow-md">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_6px_rgba(235,157,42,0.5)]" />
                    <h4 className="text-sm font-bold text-border-amber">Precision Search</h4>
                  </div>
                  <ul className="space-y-2 text-sm text-on-surface-variant">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>handmade cobalt blue stoneware ikebana vase 8 inch</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>mid-century walnut round accent table hairpin legs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>abstract minimalist line art print black frame set of 3</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>art deco brushed brass arc desk lamp linen shade</span>
                    </li>
                  </ul>
                  <p className="text-xs text-border-amber mt-3 italic font-medium">
                    Specific terms → Fewer but more accurate results
                  </p>
                </div>
              </div>

              <p className="text-sm text-on-surface-variant mt-5 leading-relaxed">
                <strong>When to use Precision Search:</strong> When your board has a very specific aesthetic (e.g., "Japanese minimalist", "Art Deco brass"), and you want exact matches rather than general suggestions. Toggle it on from the <strong>+</strong> menu in the search bar.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* eBay Product Condition Badge Section */}
      <div className="mt-8">
        <div className="bg-surface-elevated rounded-xl p-5 sm:p-7 border border-outline/10 shadow-md">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 bg-accent-blue rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-on-primary-strong" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface mb-1">Understanding Product Condition Badges</h3>
              <p className="text-sm text-on-surface-variant">Each product on eBay includes a condition badge that tells you the item's state. Here's what they mean.</p>
            </div>
          </div>

          {/* Side-by-side layout: badges on left, visual example on right */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Condition badges grid */}
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'New', color: 'oklch(var(--c-accent-green))', desc: 'Brand-new, unused, unopened item in its original packaging.' },
                { label: 'Open Box', color: 'oklch(var(--c-accent-blue))', desc: 'Unused item with original packaging opened or removed. May have minor cosmetic imperfections.' },
                { label: 'Certified Refurbished', color: 'oklch(var(--c-accent-purple))', desc: 'Professionally restored to working order by a manufacturer or qualified vendor.' },
                { label: 'Pre-Owned', color: 'rgb(var(--c-primary))', desc: 'Previously used item. Seller should describe any imperfections or wear.' },
                { label: 'For Parts or Not Working', color: '#E60023', desc: 'Item does not function as intended. Useful for spare parts or repair projects.' },
                { label: 'Good - Refurbished', color: '#0D7C5F', desc: 'Restored by a qualified seller. Minor cosmetic blemishes may exist; fully functional.' },
              ].map((cond) => (
                <div key={cond.label} className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-low border border-outline/10">
                  <span
                    className="mt-0.5 flex-shrink-0 inline-block text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap text-white"
                    style={{ backgroundColor: cond.color }}
                  >
                    {cond.label}
                  </span>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{cond.desc}</p>
                </div>
              ))}
            </div>

            {/* Skeleton product card mockup */}
            <div className="border border-outline/10 rounded-lg p-4 bg-surface-container-low flex flex-col">
              <p className="text-xs font-semibold text-on-surface-variant mb-3 uppercase tracking-wider">Visual Example — Where to find it on a product card</p>
              <div className="flex-1 flex items-center justify-center">
                <div className="max-w-[220px] w-full">
                  <div className="bg-surface-elevated rounded-lg shadow border border-outline/10 overflow-hidden">
                {/* Skeleton image area */}
                <div className="aspect-square relative bg-surface-container-low">
                  {/* Animated skeleton shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-surface-section via-surface-bright to-surface-section animate-pulse" />
                  {/* Condition badge — highlighted */}
                  <div className="absolute top-2 left-2 z-10">
                    <span className="relative inline-block bg-surface-elevated text-on-surface text-[10px] font-semibold px-2 py-0.5 rounded shadow-md ring-2 ring-outline/40 ring-offset-1 ring-offset-background">
                      Pre-Owned
                      {/* Attention arrow */}
                    </span>
                    <div className="mt-1 ml-1">
                      <div className="flex flex-col items-end">
                        <svg width="60" height="36" viewBox="0 0 60 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <polygon points="30,0 26,7 34,7" fill="rgb(var(--c-on-surface))"/>
                          <path d="M30 34 Q30 26 30 5" stroke="rgb(var(--c-on-surface))" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3"/>
                        </svg>
                        <span className="text-[9px] font-semibold text-on-surface mr-1">Condition Badge</span>
                      </div>
                    </div>
                  </div>
                  {/* Skeleton match score badge */}
                  <div className="absolute top-2 right-2 bg-surface-container-low rounded px-2 py-1">
                    <div className="w-8 h-3 bg-outline rounded" />
                  </div>
                </div>
                {/* Skeleton text area */}
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-surface-container-low rounded w-[85%]" />
                  <div className="h-3 bg-surface-container-low rounded w-[60%]" />
                  <div className="h-4 bg-surface-container-low rounded w-[35%] mt-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
}

export default ScoringTab;
