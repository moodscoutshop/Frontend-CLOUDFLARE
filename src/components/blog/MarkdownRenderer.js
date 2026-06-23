import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

/**
 * Renders blog markdown with MoodScout typography.
 *
 * - remark-gfm: tables, strikethrough, task lists, autolinks
 * - rehype-raw: allows raw HTML inside markdown (e.g. <div align="center">,
 *   inline images with alignment) so admins can position images anywhere.
 *
 * Styling relies on the @tailwindcss/typography `prose` classes plus a few
 * brand overrides.
 */
export function MarkdownRenderer({ content, className = '' }) {
  return (
    <div
      className={
        'prose prose-lg max-w-none ' +
        'prose-headings:text-[#1D1F20] prose-headings:font-bold ' +
        'prose-p:text-[#3D3F40] prose-p:leading-relaxed ' +
        'prose-a:text-[#EB9D2A] prose-a:no-underline hover:prose-a:underline ' +
        'prose-strong:text-[#1D1F20] ' +
        'prose-blockquote:border-l-[#EB9D2A] prose-blockquote:text-[#5D5F60] ' +
        'prose-img:rounded-xl prose-img:shadow-sm prose-img:mx-auto ' +
        'prose-code:text-[#B17816] prose-code:bg-[#F8F7F2] prose-code:px-1 prose-code:rounded ' +
        'prose-li:text-[#3D3F40] ' +
        className
      }
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          img: ({ node, ...props }) => (
            // eslint-disable-next-line jsx-a11y/alt-text
            <img loading="lazy" {...props} />
          ),
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
