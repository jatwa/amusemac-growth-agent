import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  Eye,
  Edit3,
  Check,
  X,
  ShieldCheck
} from 'lucide-react';

interface RichTextEmailComposerProps {
  initialHtml?: string;
  initialText?: string;
  onChange?: (html: string, text: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export const RichTextEmailComposer: React.FC<RichTextEmailComposerProps> = ({
  initialHtml = '',
  initialText = '',
  onChange,
  placeholder = 'Write your outreach email content here...',
  readOnly = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isPreview, setIsPreview] = useState(false);

  // Link Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [activeLinkNode, setActiveLinkNode] = useState<HTMLAnchorElement | null>(null);
  const [linkError, setLinkError] = useState('');

  // Synchronize initial content on mount
  useEffect(() => {
    if (editorRef.current) {
      const content = initialHtml || (initialText ? initialText.replace(/\n/g, '<br/>') : '');
      if (content && editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content;
      }
    }
  }, [initialHtml, initialText]);

  // Execute standard rich text commands
  const execCmd = (command: string, value: string | undefined = undefined) => {
    if (readOnly || isPreview) return;
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleEditorChange();
    }
  };

  const handleEditorChange = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText || '';
    if (onChange) {
      onChange(html, text);
    }
  };

  // URL Normalization & Validation Rule
  const normalizeAndValidateUrl = (rawUrl: string): { valid: boolean; normalizedUrl: string; error?: string } => {
    let clean = rawUrl.trim();
    if (!clean) return { valid: false, normalizedUrl: '', error: 'URL cannot be empty.' };

    // Reject dangerous schemes
    if (/^javascript:/i.test(clean) || /^data:/i.test(clean) || /^vbscript:/i.test(clean)) {
      return { valid: false, normalizedUrl: '', error: 'Unsafe URL scheme rejected.' };
    }

    // Auto-prefix http/https for bare domains
    if (!/^https?:\/\//i.test(clean)) {
      clean = `https://${clean}`;
    }

    try {
      const parsed = new URL(clean);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { valid: false, normalizedUrl: '', error: 'Only http:// and https:// URLs are supported.' };
      }
      return { valid: true, normalizedUrl: parsed.href };
    } catch (e) {
      return { valid: false, normalizedUrl: '', error: 'Please enter a valid URL (e.g. https://example.com).' };
    }
  };

  // Open Link Modal
  const openLinkDialog = () => {
    if (readOnly || isPreview) return;
    setLinkError('');

    // Check if cursor is on an existing link
    const selection = window.getSelection();
    let parentAnchor: HTMLAnchorElement | null = null;

    if (selection && selection.rangeCount > 0) {
      let node: Node | null = selection.getRangeAt(0).startContainer;
      while (node && node !== editorRef.current) {
        if (node.nodeName === 'A') {
          parentAnchor = node as HTMLAnchorElement;
          break;
        }
        node = node.parentNode;
      }
    }

    if (parentAnchor) {
      setActiveLinkNode(parentAnchor);
      setLinkUrl(parentAnchor.getAttribute('href') || '');
      setLinkText(parentAnchor.innerText || '');
    } else {
      setActiveLinkNode(null);
      const selectedText = selection ? selection.toString() : '';
      setLinkText(selectedText);
      setLinkUrl('');
    }

    setShowLinkModal(true);
  };

  // Apply Link
  const handleApplyLink = () => {
    const { valid, normalizedUrl, error } = normalizeAndValidateUrl(linkUrl);
    if (!valid) {
      setLinkError(error || 'Invalid URL');
      return;
    }

    if (activeLinkNode) {
      // Edit existing link
      activeLinkNode.setAttribute('href', normalizedUrl);
      activeLinkNode.setAttribute('target', '_blank');
      activeLinkNode.setAttribute('rel', 'noopener noreferrer');
      if (linkText.trim()) {
        activeLinkNode.innerText = linkText.trim();
      }
    } else {
      // Insert new link
      if (editorRef.current) {
        editorRef.current.focus();
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && selection.toString().trim().length > 0) {
          // Wrap selected text
          document.execCommand('createLink', false, normalizedUrl);
        } else {
          // Insert new text link
          const textToInsert = linkText.trim() || normalizedUrl;
          const aHtml = `<a href="${normalizedUrl}" target="_blank" rel="noopener noreferrer" style="color: #38bdf8; text-decoration: underline;">${textToInsert}</a>`;
          document.execCommand('insertHTML', false, aHtml);
        }
      }
    }

    setShowLinkModal(false);
    setActiveLinkNode(null);
    handleEditorChange();
  };

  // Remove Link
  const handleRemoveLink = () => {
    if (activeLinkNode) {
      const parent = activeLinkNode.parentNode;
      while (activeLinkNode.firstChild) {
        parent?.insertBefore(activeLinkNode.firstChild, activeLinkNode);
      }
      parent?.removeChild(activeLinkNode);
    } else {
      document.execCommand('unlink', false);
    }
    setShowLinkModal(false);
    setActiveLinkNode(null);
    handleEditorChange();
  };

  return (
    <div className="border border-[#282d46] rounded-2xl bg-[#141728] overflow-hidden flex flex-col font-sans space-y-0">
      {/* Editor Header Toolbar */}
      {!readOnly && (
        <div className="p-2.5 bg-[#181b2e] border-b border-[#252940] flex flex-wrap items-center justify-between gap-1.5 text-xs select-none">
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => execCmd('bold')}
              title="Bold (Ctrl+B)"
              className="p-2 rounded-lg bg-[#1f233b] hover:bg-[#2c3254] text-slate-200 font-bold transition-all"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('italic')}
              title="Italic (Ctrl+I)"
              className="p-2 rounded-lg bg-[#1f233b] hover:bg-[#2c3254] text-slate-200 italic transition-all"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('underline')}
              title="Underline (Ctrl+U)"
              className="p-2 rounded-lg bg-[#1f233b] hover:bg-[#2c3254] text-slate-200 underline transition-all"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-5 bg-[#2b304a] mx-1" />

            <button
              type="button"
              onClick={() => execCmd('insertUnorderedList')}
              title="Bulleted List"
              className="p-2 rounded-lg bg-[#1f233b] hover:bg-[#2c3254] text-slate-200 transition-all"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('insertOrderedList')}
              title="Numbered List"
              className="p-2 rounded-lg bg-[#1f233b] hover:bg-[#2c3254] text-slate-200 transition-all"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-5 bg-[#2b304a] mx-1" />

            <button
              type="button"
              onClick={openLinkDialog}
              title="Insert / Edit Hyperlink (Ctrl+K)"
              className="p-2 rounded-lg bg-[#1f233b] hover:bg-[#38bdf8]/20 text-sky-400 font-bold border border-sky-500/30 transition-all flex items-center space-x-1"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Insert Link</span>
            </button>

            <span className="w-px h-5 bg-[#2b304a] mx-1" />

            <button
              type="button"
              onClick={() => execCmd('undo')}
              title="Undo"
              className="p-2 rounded-lg bg-[#1f233b] hover:bg-[#2c3254] text-slate-300 transition-all"
            >
              <Undo className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => execCmd('redo')}
              title="Redo"
              className="p-2 rounded-lg bg-[#1f233b] hover:bg-[#2c3254] text-slate-300 transition-all"
            >
              <Redo className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
              isPreview
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-[#1f233b] text-slate-300 hover:text-white border border-[#2d3454]'
            }`}
          >
            {isPreview ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isPreview ? 'Back to Edit' : 'Email Preview'}</span>
          </button>
        </div>
      )}

      {/* Editor Body Input OR Email Preview Container */}
      <div className="relative min-h-[180px] p-4 text-xs font-sans leading-relaxed text-slate-200">
        {isPreview ? (
          <div className="p-4 rounded-xl bg-[#0e101c] border border-[#20253b] space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 text-[11px] font-bold border-b border-[#1f2338] pb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Zoho Mail Recipient Preview (Clickable Hyperlinks Active)</span>
            </div>
            <div
              className="prose prose-invert max-w-none text-slate-200 space-y-2"
              dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || '<p>No email content to preview.</p>' }}
            />
          </div>
        ) : (
          <div
            ref={editorRef}
            contentEditable={!readOnly}
            onInput={handleEditorChange}
            onBlur={handleEditorChange}
            className="w-full min-h-[180px] outline-none space-y-1 text-slate-200 focus:outline-none"
            style={{ minHeight: '180px' }}
          />
        )}
      </div>

      {/* Link Insertion & Editing Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card-gold p-6 rounded-2xl max-w-md w-full border border-[#f5b82e]/40 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2e344e] pb-3">
              <div className="flex items-center space-x-2 text-white font-bold text-sm">
                <LinkIcon className="w-4 h-4 text-[#f5b82e]" />
                <span>{activeLinkNode ? 'Edit Clickable Hyperlink' : 'Insert Clickable Hyperlink'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {linkError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {linkError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Display Text:</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={e => setLinkText(e.target.value)}
                  placeholder="e.g. View Production Portfolio"
                  className="w-full bg-[#141625] border border-[#23273d] text-white rounded-xl px-3 py-2 outline-none font-sans"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Destination URL (HTTP/HTTPS):</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={e => {
                    setLinkUrl(e.target.value);
                    setLinkError('');
                  }}
                  placeholder="https://amusemacstudio.in"
                  className="w-full bg-[#141625] border border-[#23273d] text-sky-300 rounded-xl px-3 py-2 outline-none font-mono"
                  autoFocus
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Bare domains like <code className="text-amber-300">example.com</code> are automatically normalized to <code className="text-emerald-300">https://example.com</code>.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#23273d]">
              {activeLinkNode ? (
                <button
                  type="button"
                  onClick={handleRemoveLink}
                  className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 font-bold text-xs flex items-center space-x-1"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Remove Link</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-3 py-2 rounded-xl bg-[#1e2235] text-slate-300 hover:text-white font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyLink}
                  className="btn-gold px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{activeLinkNode ? 'Update Link' : 'Apply Link'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
