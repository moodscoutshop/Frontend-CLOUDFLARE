import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Clock, User, Loader2, Tag, ArrowLeft } from 'lucide-react';
import { Navbar, Footer } from '../components/layout';
import { Breadcrumbs, ScrollToTopButton } from '../components/common';
import { MarkdownRenderer, BlogSidebar } from '../components/blog';
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

export function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [navPosts, setNavPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Auto-collapse the sidebar on small screens
  useEffect(() => {
    const apply = () => setSidebarCollapsed(window.innerWidth < 1024);
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    window.scrollTo({ top: 0 });
    (async () => {
      try {
        const res = await blogAPI.getBySlug(slug);
        if (active) setPost(res.data.post);
      } catch (err) {
        debug.error('Failed to load post:', err);
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await blogAPI.nav();
        if (active) setNavPosts(res.data.posts || []);
      } catch (err) {
        debug.error('Failed to load blog nav:', err);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div className="bg-[#FDFDF8] min-h-screen font-sans">
      <Helmet>
        <title>{post ? `${post.title} | MoodScout Blog` : 'Blog | MoodScout'}</title>
        {post && <meta name="description" content={post.seo_description || post.excerpt || post.caption || ''} />}
        {post && <link rel="canonical" href={`https://www.moodscout.shop/blog/${post.slug}`} />}
        {post && <meta property="og:title" content={post.title} />}
        {post && <meta property="og:type" content="article" />}
        {post?.cover_image && <meta property="og:image" content={post.cover_image} />}
      </Helmet>

      <Navbar />

      <div className="flex pt-16 min-h-screen">
        <BlogSidebar
          posts={navPosts}
          activeSlug={slug}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((v) => !v)}
        />

        <main className="flex-1 min-w-0 px-4 sm:px-6 lg:px-10 py-8">
          <div className="max-w-3xl mx-auto">
            <Breadcrumbs
              className="mb-8"
              items={[
                { label: 'Home', to: '/' },
                { label: 'Blog', to: '/blog' },
                { label: post?.title || 'Article' },
              ]}
            />

            {loading && (
              <div className="flex items-center justify-center py-24 text-[#5D5F60]">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading article...
              </div>
            )}

            {!loading && notFound && (
              <div className="text-center py-24">
                <h1 className="text-2xl font-bold text-[#1D1F20] mb-3">Article not found</h1>
                <p className="text-[#5D5F60] mb-6">This article may have been moved or unpublished.</p>
                <Link to="/blog" className="btn-primary inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back to Blog
                </Link>
              </div>
            )}

            {!loading && post && (
              <article>
                <header className="mb-8">
                  {post.category && (
                    <span className="inline-block bg-[#EB9D2A] text-[#1D1F20] text-xs px-3 py-1 rounded-md font-medium border border-[#B17816] mb-4">
                      {post.category}
                    </span>
                  )}
                  <h1 className="text-3xl sm:text-4xl font-bold text-[#1D1F20] leading-tight mb-3">{post.title}</h1>
                  {post.caption && <p className="text-lg text-[#5D5F60] mb-5">{post.caption}</p>}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[#5D5F60] pb-6 border-b border-[#E0DCCE]">
                    {post.author && <span className="flex items-center gap-1.5"><User className="w-4 h-4" />{post.author}</span>}
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatDate(post.published_at || post.created_at)}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{post.read_time || 1} min read</span>
                  </div>
                </header>

                {post.cover_image && (
                  <img
                    src={post.cover_image}
                    alt={post.title}
                    className="w-full rounded-2xl mb-8 shadow-sm object-cover max-h-[480px]"
                    loading="lazy"
                  />
                )}

                <MarkdownRenderer content={post.content_md} />

                {Array.isArray(post.tags) && post.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-10 pt-6 border-t border-[#E0DCCE]">
                    <Tag className="w-4 h-4 text-[#5D5F60]" />
                    {post.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-[#EEEFE9] text-[#5D5F60] px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            )}
          </div>
        </main>
      </div>

      <Footer />
      <ScrollToTopButton />
    </div>
  );
}

export default BlogPostPage;
