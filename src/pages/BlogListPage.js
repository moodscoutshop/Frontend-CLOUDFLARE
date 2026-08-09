import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Clock, User, ArrowRight, Loader2, BookOpen, LayoutGrid, List, Sparkles } from 'lucide-react';
import { Navbar, Footer } from '../components/layout';
import { Breadcrumbs } from '../components/common';
import { WaitlistModal } from '../components/modals';
import { blogAPI } from '../lib/api';
import debug from '../lib/debug';

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

/** Row 1 = 1 col; min rows k where 1+3*(k-1) >= n; even distribution, non-decreasing, max 3. */
export function getDynamicRows(n) {
  if (n <= 0) return [];
  if (n === 1) return [1];
  const k = Math.ceil((n - 1) / 3) + 1;
  const extraRows = k - 1;
  const remaining = n - 1;
  const base = Math.floor(remaining / extraRows);
  let extra = remaining % extraRows;
  const distribution = [];
  for (let i = 0; i < extraRows; i++) {
    distribution.push(Math.min(3, base + (extra > 0 ? 1 : 0)));
    if (extra > 0) extra--;
  }
  distribution.sort((a, b) => a - b);
  return [1, ...distribution];
}

const VIEW_MODES = [
  { id: 'dynamic', label: 'Dynamic', icon: Sparkles },
  { id: 'grid', label: 'Grid', icon: LayoutGrid },
  { id: 'list', label: 'List', icon: List },
];

const cardBorder =
  'border border-[#D4CFC0] bg-white dark:border-outline/15 dark:bg-surface-elevated';

function CategoryBadge({ category }) {
  if (!category) return null;
  return (
    <span className="bg-primary text-on-primary text-xs px-3 py-1 rounded-md font-medium border border-amber-border">
      {category}
    </span>
  );
}

function FeaturedCard({ post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className={`group grid md:grid-cols-2 gap-6 sm:gap-8 rounded-2xl overflow-hidden hover:border-primary hover:shadow-lg transition-all ${cardBorder}`}
    >
      <div className="aspect-video md:aspect-auto md:h-full relative overflow-hidden bg-[#F8F7F2] min-h-[220px] dark:bg-surface-container">
        {post.cover_image ? (
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-outline"><BookOpen className="w-12 h-12" /></div>
        )}
      </div>
      <div className="p-6 sm:p-8 flex flex-col justify-center">
        {post.category && <div className="self-start mb-3"><CategoryBadge category={post.category} /></div>}
        <h2 className="text-2xl sm:text-3xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">
          {post.title}
        </h2>
        <p className="text-on-surface-variant leading-relaxed mb-4 line-clamp-3">{post.excerpt || post.caption}</p>
        <div className="flex items-center gap-3 text-sm text-on-surface-variant">
          {post.author && <span className="flex items-center gap-1"><User className="w-4 h-4" />{post.author}</span>}
          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(post.published_at || post.created_at)}</span>
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{post.read_time || 1} min read</span>
        </div>
      </div>
    </Link>
  );
}

function CompactCard({ post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className={`group rounded-xl overflow-hidden hover:border-primary hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col h-full ${cardBorder}`}
    >
      <div className="aspect-video relative overflow-hidden bg-[#F8F7F2] border-b border-[#E0DCCE] dark:border-outline/10 dark:bg-surface-container">
        {post.cover_image ? (
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-outline"><BookOpen className="w-10 h-10" /></div>
        )}
        {post.category && (
          <span className="absolute top-3 left-3 bg-primary text-on-primary text-xs px-3 py-1 rounded-md font-medium border border-amber-border">
            {post.category}
          </span>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(post.published_at || post.created_at)}</span>
          <span>•</span>
          <Clock className="w-3 h-3" />
          <span>{post.read_time || 1} min read</span>
        </div>
        <h3 className="text-lg font-bold text-on-surface mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-on-surface-variant text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
          {post.excerpt || post.caption}
        </p>
        <div className="flex items-center justify-between pt-3 border-t border-[#E0DCCE] mt-auto dark:border-outline/15">
          <span className="flex items-center gap-1.5 text-sm text-on-surface-variant">
            <User className="w-4 h-4" />{post.author || 'MoodScout'}
          </span>
          <span className="flex items-center gap-1 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Read <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ListCard({ post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className={`group flex flex-col sm:flex-row gap-4 sm:gap-6 rounded-xl overflow-hidden hover:border-primary hover:shadow-lg transition-all p-4 sm:p-0 ${cardBorder}`}
    >
      <div className="sm:w-48 md:w-56 flex-shrink-0 aspect-video sm:aspect-square relative overflow-hidden bg-[#F8F7F2] rounded-lg sm:rounded-none border border-[#E0DCCE] sm:border-0 sm:border-r dark:border-outline/10 dark:bg-surface-container">
        {post.cover_image ? (
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-outline"><BookOpen className="w-10 h-10" /></div>
        )}
      </div>
      <div className="flex flex-col justify-center flex-1 sm:py-4 sm:pr-5">
        {post.category && <div className="mb-2"><CategoryBadge category={post.category} /></div>}
        <h3 className="text-lg sm:text-xl font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <p className="text-on-surface-variant text-sm leading-relaxed mb-3 line-clamp-2">
          {post.excerpt || post.caption}
        </p>
        <div className="flex items-center gap-3 text-xs text-on-surface-variant">
          <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{post.author || 'MoodScout'}</span>
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(post.published_at || post.created_at)}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{post.read_time || 1} min</span>
        </div>
      </div>
    </Link>
  );
}

function DynamicLayout({ posts }) {
  const rows = getDynamicRows(posts.length);
  let index = 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {rows.map((cols, rowIdx) => {
        const rowPosts = posts.slice(index, index + cols);
        index += cols;
        if (rowPosts.length === 0) return null;

        if (cols === 1) {
          return <FeaturedCard key={`row-${rowIdx}`} post={rowPosts[0]} />;
        }

        return (
          <div
            key={`row-${rowIdx}`}
            className={`grid gap-6 sm:gap-8 ${
              cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : cols === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : ''
            }`}
          >
            {rowPosts.map((post) => (
              <CompactCard key={post.id} post={post} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

export function BlogListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('dynamic');
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await blogAPI.list({ limit: 60 });
        if (active) setPosts(res.data.posts || []);
      } catch (err) {
        debug.error('Failed to load blog list:', err);
        if (active) setError('Failed to load articles. Please try again later.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div className="bg-[#FDFDF8] min-h-screen font-sans text-on-background dark:bg-background">
      <Helmet>
        <title>Blog | MoodScout</title>
        <meta name="description" content="Tips, tricks, and insights for smarter shopping — the MoodScout blog." />
        <link rel="canonical" href="https://www.moodscout.shop/blog" />
      </Helmet>

      <Navbar onFeedbackClick={() => setShowWaitlistModal(true)} />
      <WaitlistModal isOpen={showWaitlistModal} onClose={() => setShowWaitlistModal(false)} />

      <main
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16"
        style={{ paddingTop: 'calc(var(--ms-header-height, 5rem) + 1rem)' }}
      >
        <Breadcrumbs
          className="mb-8"
          backTo="/"
          backLabel="Home"
          items={[{ label: 'Home', to: '/' }, { label: 'Blog' }]}
        />

        <header className="mb-10 sm:mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-on-surface mb-3">The MoodScout Blog</h1>
            <p className="text-lg text-on-surface-variant max-w-2xl dark:text-on-surface/80">
              Tips, tricks, and insights for smarter eBay shopping and discovering your aesthetic.
            </p>
          </div>
          {/* Layout toggles — desktop/tablet only; mobile is always grid */}
          {!loading && !error && posts.length > 0 && (
            <div className="hidden sm:flex items-center gap-1 rounded-full border border-[#C5BFAE] bg-white p-1 dark:border-outline/20 dark:bg-surface-elevated">
              {VIEW_MODES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setViewMode(id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    viewMode === id
                      ? 'bg-primary/15 text-primary'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </header>

        {loading && (
          <div className="flex items-center justify-center py-24 text-on-surface-variant">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading articles...
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-24 text-on-surface-variant">{error}</div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-24">
            <BookOpen className="w-10 h-10 text-outline mx-auto mb-3" />
            <p className="text-on-surface-variant">No articles published yet. Check back soon!</p>
          </div>
        )}

        {/* Mobile: grid only */}
        {!loading && !error && posts.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:hidden">
            {posts.map((post) => (
              <CompactCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {/* sm+: honor selected view mode */}
        {!loading && !error && posts.length > 0 && (
          <div className="hidden sm:block">
            {viewMode === 'dynamic' && <DynamicLayout posts={posts} />}
            {viewMode === 'grid' && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {posts.map((post) => (
                  <CompactCard key={post.id} post={post} />
                ))}
              </div>
            )}
            {viewMode === 'list' && (
              <div className="space-y-4 sm:space-y-6">
                {posts.map((post) => (
                  <ListCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer onFeedbackClick={() => setShowWaitlistModal(true)} />
    </div>
  );
}

export default BlogListPage;
