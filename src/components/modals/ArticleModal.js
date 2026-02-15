import React, { useEffect } from 'react';
import { X, User, Calendar, Clock, Tag } from 'lucide-react';

/**
 * ArticleModal - Modal for displaying full article content
 */
export function ArticleModal({ article, isOpen, onClose }) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  if (!isOpen || !article) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FDFDF8] rounded-xl max-w-3xl w-full shadow-2xl relative my-8 overflow-hidden border border-[#D4CFC0]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm text-[#5D5F60] hover:text-[#1D1F20] transition-colors rounded-lg p-2 shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Article Header Image */}
        <div className="relative h-48 sm:h-64 md:h-80 overflow-hidden">
          <img
            src={article.image}
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
            <span className="inline-block bg-[#EB9D2A] text-[#1D1F20] text-xs px-3 py-1 rounded mb-2 sm:mb-3">
              {article.category}
            </span>
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-white leading-tight">
              {article.title}
            </h2>
          </div>
        </div>
        
        {/* Article Content */}
        <div className="p-4 sm:p-6 md:p-8 max-h-[50vh] sm:max-h-[60vh] overflow-y-auto">
          {/* Article Meta */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-[#5D5F60] mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-[#D4CFC0]">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{article.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{article.readTime}</span>
            </div>
          </div>
          
          {/* Article Body */}
          <div className="prose prose-lg max-w-none">
            <p className="text-[#3D3F40] leading-relaxed text-base sm:text-lg mb-6">
              {article.content}
            </p>
          </div>
          
          {/* Article Tags */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-[#D4CFC0]">
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-[#EB9D2A]/15 text-[#B17816] px-3 py-1 rounded-full text-sm"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ArticleModal;
