import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen, BookOpen } from 'lucide-react';

export function BlogSidebar({ posts = [], activeSlug, collapsed, onToggle }) {
  const navigate = useNavigate();

  return (
    <aside
      className={`flex-shrink-0 transition-all duration-300 ease-in-out border-r border-[#D4CFC0] bg-white dark:border-outline/20 dark:bg-surface-elevated ${
        collapsed ? 'w-14' : 'w-64'
      }`}
    >
      <div className="sticky top-20">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-3 border-b border-[#D4CFC0] dark:border-outline/20`}>
          {!collapsed && (
            <div className="flex items-center gap-2 min-w-0">
              <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-sm font-bold text-on-surface truncate">All Articles</span>
            </div>
          )}
          <button
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-md text-on-surface-variant hover:bg-[#F8F7F2] hover:text-on-surface transition-colors dark:hover:bg-surface-container-low"
          >
            {collapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>

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
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-on-surface-variant hover:bg-[#F8F7F2] border-l-2 border-transparent dark:hover:bg-surface-container-low'
                }`}
              >
                <span
                  className={`flex items-center justify-center text-xs font-semibold rounded-md flex-shrink-0 border ${
                    collapsed ? 'w-7 h-7' : 'w-6 h-6'
                  } ${isActive ? 'border-primary bg-primary text-on-primary' : 'border-[#C5BFAE] bg-[#F8F7F2] text-on-surface-variant dark:border-outline/25 dark:bg-surface-container'}`}
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
            <p className="px-3 py-4 text-xs text-on-surface-variant">No articles yet.</p>
          )}
        </nav>
      </div>
    </aside>
  );
}

export default BlogSidebar;
