import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Tag, X, Plus, RotateCcw } from 'lucide-react';

/**
 * KeywordEditor - Inline keyword editing component for the Analysis tab.
 *
 * Each keyword renders as a styled badge that IS editable by default — the
 * user can click anywhere inside the badge text and start typing. No separate
 * edit / confirm buttons are needed.
 *
 * The badge width is driven by a hidden measuring <span> so that the input
 * never jumps in size: it always matches the current text width.
 *
 * Props:
 *   keywords         - Current editable keywords array
 *   originalKeywords - Original keywords for reset comparison
 *   isModified       - Whether keywords differ from original
 *   onUpdate         - (index, newValue) => void
 *   onRemove         - (index) => void
 *   onAdd            - (keyword) => void
 *   onReset          - () => void
 */

/* ---------------------------------------------------------------
   Inline Keyword Badge
   An input styled to look like the existing green badge. A hidden
   <span> mirror is used to measure the natural width of its text
   so the input never jumps when the user focuses it.
   --------------------------------------------------------------- */
function KeywordBadge({ value, onChange, onRemove, canRemove }) {
  const measureRef = useRef(null);
  const [width, setWidth] = useState(0);

  // Recalculate width whenever value changes
  useEffect(() => {
    if (measureRef.current) {
      // Add a small buffer (16 px) so the cursor doesn't feel cramped
      setWidth(measureRef.current.scrollWidth + 16);
    }
  }, [value]);

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-all duration-200 bg-[#36C46F]/12 text-[#2a9456] border-[#36C46F]/30 focus-within:border-[#36C46F]/60 focus-within:ring-1 focus-within:ring-[#36C46F]/30 max-w-full min-w-0">
      <Tag className="w-3 h-3 flex-shrink-0" />

      {/* Hidden width measurer — same font metrics as the input */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="absolute invisible whitespace-pre text-sm font-medium"
      >
        {value || '\u00A0'}
      </span>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-none outline-none text-sm text-[#2a9456] font-medium min-w-[2rem] flex-shrink"
        style={{ width: `${Math.max(32, width)}px`, maxWidth: 'min(100%, 240px)' }}
        spellCheck={false}
      />

      {/* Remove button — hidden if only one keyword remains */}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="p-0.5 rounded-full hover:bg-red-100 text-[#2a9456]/60 hover:text-red-500 transition-colors flex-shrink-0"
          title="Remove keyword"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

/* ---------------------------------------------------------------
   KeywordEditor (container)
   --------------------------------------------------------------- */
export function KeywordEditor({
  keywords = [],
  originalKeywords = [],
  isModified = false,
  onUpdate,
  onRemove,
  onAdd,
  onReset,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [addValue, setAddValue] = useState('');
  const addInputRef = useRef(null);

  useEffect(() => {
    if (isAdding && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [isAdding]);

  const confirmAdd = useCallback(() => {
    if (addValue.trim()) {
      onAdd(addValue.trim());
      setAddValue('');
      // Keep add mode open for consecutive additions
    }
  }, [addValue, onAdd]);

  const cancelAdd = useCallback(() => {
    setIsAdding(false);
    setAddValue('');
  }, []);

  const handleAddKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmAdd();
    } else if (e.key === 'Escape') {
      cancelAdd();
    }
  };

  // Badge base styling for Add / Reset badges
  const badgeBase = `
    inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full
    border transition-all duration-200
  `;

  return (
    <div className="flex flex-wrap gap-2 w-full min-w-0">
      {/* Keyword badges — always editable */}
      {keywords.map((keyword, idx) => (
        <KeywordBadge
          key={`kw-${idx}`}
          value={keyword}
          onChange={(val) => onUpdate(idx, val)}
          onRemove={() => onRemove(idx)}
          canRemove={keywords.length > 1}
        />
      ))}

      {/* Add keyword badge */}
      {isAdding ? (
        <span className={`${badgeBase} bg-[#36C46F]/12 border-[#36C46F]/50 border-dashed pr-1`}>
          <Plus className="w-3 h-3 text-[#2a9456]" />
          <input
            ref={addInputRef}
            type="text"
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            onKeyDown={handleAddKeyDown}
            onBlur={() => {
              if (addValue.trim()) confirmAdd();
              else cancelAdd();
            }}
            placeholder="New keyword"
            className="bg-transparent border-none outline-none text-sm text-[#2a9456] font-medium placeholder:text-[#2a9456]/40 w-24 min-w-[5rem]"
          />
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className={`${badgeBase} bg-[#36C46F]/8 text-[#2a9456]/70 border-[#36C46F]/20 border-dashed
            hover:bg-[#36C46F]/15 hover:text-[#2a9456] hover:border-[#36C46F]/40 cursor-pointer`}
          title="Add keyword"
        >
          <Plus className="w-3 h-3" />
          <span>Add</span>
        </button>
      )}

      {/* Reset badge — only if modified */}
      {isModified && (
        <button
          type="button"
          onClick={onReset}
          className={`${badgeBase} bg-[#EB9D2A]/10 text-[#B17816] border-[#EB9D2A]/25
            hover:bg-[#EB9D2A]/20 hover:border-[#EB9D2A]/40 cursor-pointer`}
          title="Reset to original keywords"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
}

export default KeywordEditor;
