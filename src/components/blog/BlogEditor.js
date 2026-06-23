import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { Markdown } from 'tiptap-markdown';
import htmlDocx from 'html-docx-js/dist/html-docx';
import mammoth from 'mammoth/mammoth.browser';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote,
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Image as ImageIcon,
  Undo, Redo, Minus, Loader2, Table as TableIcon, Rows3, Columns3,
  Trash2, FileDown, FileUp, Sun, Moon, ImagePlus,
} from 'lucide-react';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function isValidImageUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

/**
 * Document-style WYSIWYG markdown editor for the blog admin.
 *
 * It keeps a fixed-height editor viewport, while the "paper" document scrolls
 * internally. That keeps the toolbar reachable even while editing long posts.
 */
export function BlogEditor({ value, onChange, onImageUpload, title = 'blog-post' }) {
  const fileInputRef = useRef(null);
  const docxInputRef = useRef(null);
  const lastEmitted = useRef(value);
  const [uploading, setUploading] = useState(false);
  const [docTheme, setDocTheme] = useState('light');
  const [busyDocx, setBusyDocx] = useState(false);

  const emitMarkdown = useCallback((ed) => {
    const md = ed.storage.markdown.getMarkdown();
    lastEmitted.current = md;
    onChange?.(md);
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false, allowBase64: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: 'Write your article here...' }),
      Markdown.configure({ html: true, transformPastedText: true, transformCopiedText: true }),
    ],
    content: value || '',
    onUpdate: ({ editor: ed }) => emitMarkdown(ed),
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  const handleImagePick = useCallback(async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editor) return;
    try {
      setUploading(true);
      const url = await onImageUpload(file);
      if (url) editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch (err) {
      console.error(err);
      window.alert(err?.response?.data?.error || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  }, [editor, onImageUpload]);

  const insertImageUrl = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Paste a valid image URL (https://...)');
    if (url === null) return;
    if (!isValidImageUrl(url)) {
      window.alert('Please enter a valid http(s) image URL.');
      return;
    }
    editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previous = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const exportDocx = useCallback(async () => {
    if (!editor) return;
    setBusyDocx(true);
    try {
      const html = `
        <!doctype html>
        <html>
          <head><meta charset="utf-8" /></head>
          <body>
            <article style="font-family: Arial, sans-serif; line-height: 1.65; color: #1D1F20;">
              ${editor.getHTML()}
            </article>
          </body>
        </html>
      `;
      const blob = htmlDocx.asBlob(html, {
        orientation: 'portrait',
        margins: { top: 720, right: 720, bottom: 720, left: 720 },
      });
      const filename = `${String(title || 'blog-post').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'blog-post'}.docx`;
      downloadBlob(blob, filename);
    } catch (err) {
      console.error(err);
      window.alert('DOCX export failed. Please try Markdown export as a fallback.');
    } finally {
      setBusyDocx(false);
    }
  }, [editor, title]);

  const importDocx = useCallback(async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editor) return;
    setBusyDocx(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      editor.commands.setContent(result.value || '', false);
      emitMarkdown(editor);
    } catch (err) {
      console.error(err);
      window.alert('DOCX import failed. Please try importing Markdown instead.');
    } finally {
      setBusyDocx(false);
    }
  }, [editor, emitMarkdown]);

  if (!editor) return null;

  const isDark = docTheme === 'dark';
  const toolbarBg = isDark ? 'bg-[#151719] border-[#2D3033]' : 'bg-[#F7F3EA] border-[#D4CFC0]';
  const buttonBase = isDark ? 'text-gray-300 hover:bg-white/10' : 'text-[#3D3F40] hover:bg-[#EEEFE9]';

  const Btn = ({ onClick, active, disabled, title: buttonTitle, children }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={buttonTitle}
      className={`p-2 rounded-md transition-colors disabled:opacity-40 ${
        active ? 'bg-[#EB9D2A] text-[#1D1F20]' : buttonBase
      }`}
    >
      {children}
    </button>
  );

  const GroupDivider = () => <span className={`w-px h-6 mx-1 ${isDark ? 'bg-white/10' : 'bg-[#D4CFC0]'}`} />;

  return (
    <div className={`docx-editor-shell rounded-2xl overflow-hidden border shadow-2xl ${isDark ? 'bg-[#101214] border-[#2D3033]' : 'bg-[#E9E3D6] border-[#C7BEAA]'}`}>
      <div className={`sticky top-0 z-20 flex flex-wrap items-center gap-0.5 p-2 border-b ${toolbarBg}`}>
        <Btn title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}><Bold className="w-4 h-4" /></Btn>
        <Btn title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}><Italic className="w-4 h-4" /></Btn>
        <Btn title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}><UnderlineIcon className="w-4 h-4" /></Btn>
        <Btn title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}><Strikethrough className="w-4 h-4" /></Btn>
        <Btn title="Inline code" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')}><Code className="w-4 h-4" /></Btn>
        <GroupDivider />
        <Btn title="Heading 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}><Heading1 className="w-4 h-4" /></Btn>
        <Btn title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}><Heading2 className="w-4 h-4" /></Btn>
        <Btn title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}><Heading3 className="w-4 h-4" /></Btn>
        <GroupDivider />
        <Btn title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}><List className="w-4 h-4" /></Btn>
        <Btn title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}><ListOrdered className="w-4 h-4" /></Btn>
        <Btn title="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}><Quote className="w-4 h-4" /></Btn>
        <Btn title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="w-4 h-4" /></Btn>
        <GroupDivider />
        <Btn title="Align left" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })}><AlignLeft className="w-4 h-4" /></Btn>
        <Btn title="Align center" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}><AlignCenter className="w-4 h-4" /></Btn>
        <Btn title="Align right" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })}><AlignRight className="w-4 h-4" /></Btn>
        <GroupDivider />
        <Btn title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon className="w-4 h-4" /></Btn>
        <Btn title="Add row after" onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.can().addRowAfter()}><Rows3 className="w-4 h-4" /></Btn>
        <Btn title="Add column after" onClick={() => editor.chain().focus().addColumnAfter().run()} disabled={!editor.can().addColumnAfter()}><Columns3 className="w-4 h-4" /></Btn>
        <Btn title="Delete table" onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.can().deleteTable()}><Trash2 className="w-4 h-4" /></Btn>
        <GroupDivider />
        <Btn title="Link" onClick={setLink} active={editor.isActive('link')}><LinkIcon className="w-4 h-4" /></Btn>
        <Btn title="Upload image" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
        </Btn>
        <Btn title="Insert image from URL" onClick={insertImageUrl}><ImagePlus className="w-4 h-4" /></Btn>
        <GroupDivider />
        <Btn title="Import DOCX" onClick={() => docxInputRef.current?.click()} disabled={busyDocx}>
          {busyDocx ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
        </Btn>
        <Btn title="Export DOCX" onClick={exportDocx} disabled={busyDocx}><FileDown className="w-4 h-4" /></Btn>
        <Btn title={isDark ? 'Switch document to light mode' : 'Switch document to dark mode'} onClick={() => setDocTheme(isDark ? 'light' : 'dark')}>
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Btn>
        <GroupDivider />
        <Btn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo className="w-4 h-4" /></Btn>
        <Btn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo className="w-4 h-4" /></Btn>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
        <input ref={docxInputRef} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={importDocx} />
      </div>

      <div className={`docx-editor-viewport h-[calc(100vh-210px)] min-h-[620px] max-h-[980px] overflow-y-auto px-4 py-6 sm:px-8 ${isDark ? 'bg-[#0C0E10]' : 'bg-[#D8D2C5]'}`}>
        <div className={`docx-editor-page mx-auto min-h-[900px] w-full max-w-[980px] rounded-sm shadow-2xl ${isDark ? 'bg-[#171A1D] text-gray-100' : 'bg-white text-[#1D1F20]'}`}>
          <EditorContent
            editor={editor}
            className={`blog-editor-content prose prose-lg max-w-none p-8 sm:p-12 focus:outline-none ${
              isDark
                ? 'prose-invert prose-headings:text-white prose-p:text-gray-200 prose-a:text-[#EB9D2A]'
                : 'prose-headings:text-[#1D1F20] prose-p:text-[#3D3F40] prose-a:text-[#EB9D2A]'
            }`}
          />
        </div>
      </div>
    </div>
  );
}

export default BlogEditor;
