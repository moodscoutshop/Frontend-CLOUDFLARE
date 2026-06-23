import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, BookOpen } from 'lucide-react';

/**
 * Collapsible blog navigation sidebar shown on the post page.
 *
 * - Expanded: shows each post title (truncated with ellipsis when overflowing,
 *   full title available via the native tooltip on hover).
 * - Collapsed (thin bar): shows a numbered icon list (1, 2, 3...) so users can
 *   still tell posts apart; hovering shows the full title as a tooltip.
 *
 * @param {Array<{id,slug,title}>} posts
 * @param {string} activeSlug
 * @param {boolean} collapsed
 * @param {() => void} onToggle
 */
export function BlogSidebar({ posts = [], activeSlug, collapsed, onToggle }) {
  const navigate = useNavigate();

  return (
    <aside
      className={`flex-shrink-0 transition-all duration-300 ease-in-out border-r border-[#E0DCCE] bg-white ${
        collapsed ? 'w-14' : 'w-64'
      }`}
    >
      <div className="sticky top-20">
        {/* Header / toggle */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-3 border-b border-[#E0DCCE]`}>
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen className="w-4 h-4 text-[#EB9D2A] flex-shrink-0" />
              <span className="text-sm font-bold text-[#1D1F20] truncate">All Articles</span>
            </div>
          )}
          <button
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-md text-[#5D5F60] hover:bg-[#F8F7F2] hover:text-[#1D1F20] transition-colors"
          >
            {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>

        {/* List */}
        <nav className="py-2 max-h-[calc(100vh-9rem)] overflow-y-auto">
          {posts.map((post, idx) => {
            const isActive = post.slug === activeSlug;
            return (
              <button
                key={post.id}
                onClick={() => navigate(`/blog/${post.slug}`)}
                title={post.title}
                className={`w-full flex items-center gap-3 text-left transition-colors ${
                  collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-[#FDF4E3] text-[#B17816] border-l-2 border-[#EB9D2A]'
                    : 'text-[#3D3F40] hover:bg-[#F8F7F2] border-l-2 border-transparent'
                }`}
              >
                <span
                  className={`flex items-center justify-center text-xs font-semibold rounded-md flex-shrink-0 ${
                    collapsed ? 'w-7 h-7' : 'w-6 h-6'
                  } ${isActive ? 'bg-[#EB9D2A] text-white' : 'bg-[#EEEFE9] text-[#5D5F60]'}`}
                >
                  {idx + 1}
                </span>
                {!collapsed && (
                  <span className="text-sm truncate min-w-0" style={{ display: 'block' }}>
                    {post.title}
                  </span>
                )}
              </button>
            );
          })}
          {posts.length === 0 && !collapsed && (
            <p className="px-3 py-4 text-xs text-[#5D5F60]">No articles yet.</p>
          )}
        </nav>
      </div>
    </aside>
  );
}

export default BlogSidebar;
