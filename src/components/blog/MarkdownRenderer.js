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
 * brand overrides. Dark mode uses higher-contrast on-surface tones for readability.
 */
export function MarkdownRenderer({ content, className = '' }) {
  return (
    <div
      className={
        'prose prose-lg max-w-none ' +
        'prose-headings:text-on-surface prose-headings:font-bold ' +
        'prose-p:text-on-surface-variant prose-p:leading-relaxed ' +
        'dark:prose-p:text-on-surface/90 dark:prose-headings:text-on-surface ' +
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline ' +
        'prose-strong:text-on-surface dark:prose-strong:text-on-surface ' +
        'prose-blockquote:border-l-primary prose-blockquote:text-on-surface-variant dark:prose-blockquote:text-on-surface/80 ' +
        'prose-img:rounded-xl prose-img:shadow-sm prose-img:mx-auto prose-img:border prose-img:border-[#D4CFC0] dark:prose-img:border-outline/20 ' +
        'prose-code:text-amber-border prose-code:bg-[#F8F7F2] prose-code:px-1 prose-code:rounded dark:prose-code:bg-surface-container ' +
        'prose-hr:border-[#D4CFC0] dark:prose-hr:border-outline/20 ' +
        'prose-li:text-on-surface-variant dark:prose-li:text-on-surface/90 ' +
        'dark:prose-td:text-on-surface/90 dark:prose-th:text-on-surface ' +
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
