import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Clock, User, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import { Navbar, Footer } from '../components/layout';
import { Breadcrumbs } from '../components/common';
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

export function BlogListPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const featured = posts.find((p) => p.featured) || posts[0];
  const rest = featured ? posts.filter((p) => p.id !== featured.id) : posts;

  return (
    <div className="bg-[#FDFDF8] min-h-screen font-sans">
      <Helmet>
        <title>Blog | MoodScout</title>
        <meta name="description" content="Tips, tricks, and insights for smarter shopping — the MoodScout blog." />
        <link rel="canonical" href="https://www.moodscout.shop/blog" />
      </Helmet>

      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <Breadcrumbs
          className="mb-8"
          backTo="/"
          backLabel="Home"
          items={[{ label: 'Home', to: '/' }, { label: 'Blog' }]}
        />

        <header className="mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1D1F20] mb-3">The MoodScout Blog</h1>
          <p className="text-lg text-[#5D5F60] max-w-2xl">
            Tips, tricks, and insights for smarter eBay shopping and discovering your aesthetic.
          </p>
        </header>

        {loading && (
          <div className="flex items-center justify-center py-24 text-[#5D5F60]">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading articles...
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-24 text-[#5D5F60]">{error}</div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-24">
            <BookOpen className="w-10 h-10 text-[#C5BFAE] mx-auto mb-3" />
            <p className="text-[#5D5F60]">No articles published yet. Check back soon!</p>
          </div>
        )}

        {!loading && !error && featured && (
          <Link
            to={`/blog/${featured.slug}`}
            className="group grid md:grid-cols-2 gap-6 sm:gap-8 mb-12 bg-white rounded-2xl overflow-hidden border border-[#E0DCCE] hover:border-[#EB9D2A] hover:shadow-lg transition-all"
          >
            <div className="aspect-video md:aspect-auto md:h-full relative overflow-hidden bg-[#EEEFE9] min-h-[220px]">
              {featured.cover_image ? (
                <img src={featured.cover_image} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#C5BFAE]"><BookOpen className="w-12 h-12" /></div>
              )}
            </div>
            <div className="p-6 sm:p-8 flex flex-col justify-center">
              {featured.category && (
                <span className="self-start bg-[#EB9D2A] text-[#1D1F20] text-xs px-3 py-1 rounded-md font-medium border border-[#B17816] mb-3">
                  {featured.category}
                </span>
              )}
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1D1F20] mb-3 group-hover:text-[#EB9D2A] transition-colors">
                {featured.title}
              </h2>
              <p className="text-[#5D5F60] leading-relaxed mb-4 line-clamp-3">{featured.excerpt || featured.caption}</p>
              <div className="flex items-center gap-3 text-sm text-[#5D5F60]">
                {featured.author && <span className="flex items-center gap-1"><User className="w-4 h-4" />{featured.author}</span>}
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(featured.published_at || featured.created_at)}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{featured.read_time || 1} min read</span>
              </div>
            </div>
          </Link>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {rest.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group bg-white rounded-xl overflow-hidden border border-[#E0DCCE] hover:border-[#EB9D2A] hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col"
            >
              <div className="aspect-video relative overflow-hidden bg-[#EEEFE9]">
                {post.cover_image ? (
                  <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#C5BFAE]"><BookOpen className="w-10 h-10" /></div>
                )}
                {post.category && (
                  <span className="absolute top-3 left-3 bg-[#EB9D2A] text-[#1D1F20] text-xs px-3 py-1 rounded-md font-medium border border-[#B17816]">
                    {post.category}
                  </span>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-xs text-[#5D5F60] mb-2">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(post.published_at || post.created_at)}</span>
                  <span>•</span>
                  <Clock className="w-3 h-3" />
                  <span>{post.read_time || 1} min read</span>
                </div>
                <h3 className="text-lg font-bold text-[#1D1F20] mb-2 group-hover:text-[#EB9D2A] transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-[#5D5F60] text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                  {post.excerpt || post.caption}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-[#E0DCCE] mt-auto">
                  <span className="flex items-center gap-1.5 text-sm text-[#5D5F60]">
                    <User className="w-4 h-4" />{post.author || 'MoodScout'}
                  </span>
                  <span className="flex items-center gap-1 text-[#EB9D2A] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Read <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default BlogListPage;
