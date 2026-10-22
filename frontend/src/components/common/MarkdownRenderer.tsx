import React, { useState } from 'react';
import { AppIcon } from './Icon';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  /** When true, compact rendering without large headers (suitable for comments) */
  isComment?: boolean;
  isTitle?: boolean;
}

// Tokenizer & Syntax Highlighter for Code Blocks
const highlightCode = (code: string, language: string): React.ReactNode => {
  const lang = (language || '').toLowerCase().trim();
  const lines = code.split('\n');

  // Generic keyword sets for C++, C#, JS/TS, Python, SQL, Bash
  const cppKeywords = new Set([
    'alignas', 'alignof', 'and', 'and_eq', 'asm', 'atomic_cancel', 'atomic_commit',
    'atomic_noexcept', 'auto', 'bitand', 'bitor', 'bool', 'break', 'case', 'catch',
    'char', 'char8_t', 'char16_t', 'char32_t', 'class', 'compl', 'concept', 'const',
    'consteval', 'constexpr', 'constinit', 'const_cast', 'continue', 'co_await',
    'co_return', 'co_yield', 'decltype', 'default', 'delete', 'do', 'double',
    'dynamic_cast', 'else', 'enum', 'explicit', 'export', 'extern', 'false', 'float',
    'for', 'friend', 'goto', 'if', 'inline', 'int', 'long', 'mutable', 'namespace',
    'new', 'noexcept', 'not', 'not_eq', 'nullptr', 'operator', 'or', 'or_eq',
    'private', 'protected', 'public', 'reflexpr', 'register', 'reinterpret_cast',
    'requires', 'return', 'short', 'signed', 'sizeof', 'static', 'static_assert',
    'static_cast', 'struct', 'switch', 'synchronized', 'template', 'this',
    'thread_local', 'throw', 'true', 'try', 'typedef', 'typeid', 'typename',
    'union', 'unsigned', 'using', 'virtual', 'void', 'volatile', 'wchar_t', 'while',
    'xor', 'xor_eq', 'std', 'vector', 'string', 'cout', 'cin', 'endl', 'include'
  ]);

  const csharpKeywords = new Set([
    'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char',
    'checked', 'class', 'const', 'continue', 'decimal', 'default', 'delegate', 'do',
    'double', 'else', 'enum', 'event', 'explicit', 'extern', 'false', 'finally',
    'fixed', 'float', 'for', 'foreach', 'goto', 'if', 'implicit', 'in', 'int',
    'interface', 'internal', 'is', 'lock', 'long', 'namespace', 'new', 'null',
    'object', 'operator', 'out', 'override', 'params', 'private', 'protected',
    'public', 'readonly', 'ref', 'return', 'sbyte', 'sealed', 'short', 'sizeof',
    'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw', 'true',
    'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort', 'using',
    'virtual', 'void', 'volatile', 'while', 'var', 'async', 'await', 'record'
  ]);

  const pythonKeywords = new Set([
    'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def',
    'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if',
    'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise',
    'return', 'try', 'while', 'with', 'yield', 'True', 'False', 'None', 'self'
  ]);

  const jsKeywords = new Set([
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
    'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function',
    'if', 'import', 'in', 'instanceof', 'new', 'return', 'super', 'switch',
    'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
    'let', 'static', 'enum', 'await', 'async', 'null', 'true', 'false', 'undefined'
  ]);

  const getKeywordSet = () => {
    if (lang === 'c++' || lang === 'cpp' || lang === 'c') return cppKeywords;
    if (lang === 'c#' || lang === 'csharp' || lang === 'cs' || lang === 'dotnet') return csharpKeywords;
    if (lang === 'python' || lang === 'py') return pythonKeywords;
    if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts' || lang === 'tsx') return jsKeywords;
    return new Set([...cppKeywords, ...csharpKeywords, ...jsKeywords, ...pythonKeywords]);
  };

  const keywords = getKeywordSet();

  return (
    <div className="font-mono text-xs leading-relaxed overflow-x-auto py-2">
      {lines.map((lineText, lineIdx) => {
        // Line-by-line syntax tokenization
        // Check for comments
        const isCommentLine = lineText.trim().startsWith('//') || lineText.trim().startsWith('#') || lineText.trim().startsWith('/*');

        if (isCommentLine) {
          return (
            <div key={lineIdx} className="table-row hover:bg-surface-border/20 px-2">
              <span className="table-cell pr-4 text-right select-none text-text-subtle/50 text-[11px] w-8">
                {lineIdx + 1}
              </span>
              <span className="table-cell text-emerald-400/80 italic font-mono">
                {lineText}
              </span>
            </div>
          );
        }

        // Tokenize line words, strings and punctuation
        // Regex splits words, string literals, and symbols
        const tokens = lineText.split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b\w+\b|[^\w\s])/g).filter(Boolean);

        return (
          <div key={lineIdx} className="table-row hover:bg-surface-border/20 px-2">
            <span className="table-cell pr-4 text-right select-none text-text-subtle/50 text-[11px] w-8">
              {lineIdx + 1}
            </span>
            <span className="table-cell whitespace-pre font-mono">
              {tokens.map((token, tokIdx) => {
                // String literals
                if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
                  return <span key={tokIdx} className="text-amber-300">{token}</span>;
                }
                // Keywords
                if (keywords.has(token)) {
                  return <span key={tokIdx} className="text-purple-400 font-semibold">{token}</span>;
                }
                // Numbers
                if (/^\d+(\.\d+)?$/.test(token)) {
                  return <span key={tokIdx} className="text-emerald-300">{token}</span>;
                }
                // Types / Capitalized words (e.g. Console, Task, IServiceCollection, User)
                if (/^[A-Z][A-Za-z0-9_]*$/.test(token)) {
                  return <span key={tokIdx} className="text-sky-300 font-medium">{token}</span>;
                }
                // Operators and punctuation
                if (['=>', '->', '::', '&&', '||', '==', '!=', '<=', '>=', '<', '>', '+', '-', '*', '/', '=', '!', '&', '|', '^', '%'].includes(token)) {
                  return <span key={tokIdx} className="text-brand-secondary">{token}</span>;
                }
                if (['{', '}', '(', ')', '[', ']', ';', ',', '.'].includes(token)) {
                  return <span key={tokIdx} className="text-text-muted">{token}</span>;
                }
                // Default text
                return <span key={tokIdx} className="text-text-main">{token}</span>;
              })}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Interactive Code Block Component with Copy button and Language Header
export const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const displayLang = (language || 'plaintext').trim().toUpperCase();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-card overflow-hidden border border-surface-border bg-[#0B101B] shadow-lg group">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-card border-b border-surface-border/80">
        <div className="flex items-center gap-2">
          {/* macOS / Terminal Dots */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
          </div>
          <span className="text-[11px] font-mono font-bold tracking-wider text-brand-secondary bg-brand-primary/10 px-2 py-0.5 rounded border border-brand-primary/20">
            {displayLang}
          </span>
        </div>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          type="button"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-btn bg-surface-elevated/70 hover:bg-surface-elevated text-text-muted hover:text-text-main border border-surface-border/60 transition-all active:scale-95"
          title="Sao chép toàn bộ mã nguồn"
        >
          {copied ? (
            <>
              <AppIcon name="check" size={13} className="text-status-success" />
              <span className="text-status-success text-[11px]">Đã chép!</span>
            </>
          ) : (
            <>
              <AppIcon name="copy" size={13} />
              <span className="text-[11px]">Sao chép mã</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-3 overflow-x-auto text-xs">
        {highlightCode(code, language)}
      </div>
    </div>
  );
};

// Inline Text Parser: parses **bold**, *italic*, ~~strike~~, `inline code`, [link](url), ![img](url)
export const renderInlineMarkdown = (text: string): React.ReactNode[] => {
  if (!text) return [];

  // Match:
  // 1. Image: !\[(.*?)\]\((.*?)\)
  // 2. Link: \[(.*?)\]\((.*?)\)
  // 3. Bold: \*\*(.*?)\*\* or __(.*?)__
  // 4. Italic: \*(.*?)\* or _(.*?)_
  // 5. Strikethrough: ~~(.*?)~~
  // 6. Inline Code: `(.*?)`
  const regex = /(!?\[.*?\]\(.*?\))|(\*\*.*?\*\*)|(__.*?__)|(\*.*?\*)|(_.*?_)|(~~.*?~~)|(`.*?`)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const matchedStr = match[0];

    // Image ![alt](url)
    if (matchedStr.startsWith('![') && matchedStr.endsWith(')')) {
      const imgMatch = matchedStr.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imgMatch) {
        parts.push(
          <img
            key={match.index}
            src={imgMatch[2]}
            alt={imgMatch[1]}
            className="my-3 rounded-card border border-surface-border max-w-full h-auto object-cover"
          />
        );
      }
    }
    // Link [text](url)
    else if (matchedStr.startsWith('[') && matchedStr.endsWith(')')) {
      const linkMatch = matchedStr.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-secondary hover:text-brand-light font-medium underline underline-offset-2 transition-colors inline-flex items-center gap-0.5"
          >
            {linkMatch[1]}
            <AppIcon name="externalLink" size={11} className="inline ml-0.5" />
          </a>
        );
      }
    }
    // Bold **text** or __text__
    else if ((matchedStr.startsWith('**') && matchedStr.endsWith('**')) || (matchedStr.startsWith('__') && matchedStr.endsWith('__'))) {
      const inner = matchedStr.substring(2, matchedStr.length - 2);
      parts.push(
        <strong key={match.index} className="font-bold text-text-main">
          {renderInlineMarkdown(inner)}
        </strong>
      );
    }
    // Italic *text* or _text_
    else if ((matchedStr.startsWith('*') && matchedStr.endsWith('*')) || (matchedStr.startsWith('_') && matchedStr.endsWith('_'))) {
      const inner = matchedStr.substring(1, matchedStr.length - 1);
      parts.push(
        <em key={match.index} className="italic text-text-main/90">
          {renderInlineMarkdown(inner)}
        </em>
      );
    }
    // Strikethrough ~~text~~
    else if (matchedStr.startsWith('~~') && matchedStr.endsWith('~~')) {
      const inner = matchedStr.substring(2, matchedStr.length - 2);
      parts.push(
        <del key={match.index} className="line-through text-text-subtle">
          {renderInlineMarkdown(inner)}
        </del>
      );
    }
    // Inline Code `text`
    else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      const inner = matchedStr.substring(1, matchedStr.length - 1);
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 mx-0.5 rounded-badge bg-surface-elevated/90 text-brand-secondary font-mono text-[12px] border border-surface-border/70 font-semibold shadow-sm"
        >
          {inner}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
  }

  // Push remainder
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
};

// Main Markdown Parser & Component
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
  isComment = false,
  isTitle = true
}) => {
  if (!content) return null;

  const rawLines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let headingCounter = 0;

  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    // 1. FENCED CODE BLOCKS (```lang ... ```)
    if (trimmed.startsWith('```')) {
      const language = trimmed.substring(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < rawLines.length && !rawLines[i].trim().startsWith('```')) {
        codeLines.push(rawLines[i]);
        i++;
      }
      // Skip the closing ```
      if (i < rawLines.length && rawLines[i].trim().startsWith('```')) {
        i++;
      }
      elements.push(
        <CodeBlock
          key={`code-${i}`}
          code={codeLines.join('\n')}
          language={language || 'plaintext'}
        />
      );
      continue;
    }

    // 2. HORIZONTAL RULES (--- or ***)
    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      elements.push(<hr key={`hr-${i}`} className="my-6 border-surface-border" />);
      i++;
      continue;
    }

    // 3. HEADINGS (#, ##, ###, ####)
    if (trimmed.startsWith('#') && !isComment) {
      const currentHeadingId = `heading-${headingCounter++}`;

      // #### Heading 4
      if (/^####\s+/.test(trimmed)) {
        const title = trimmed.replace(/^####\s+/, '').replace(/\s*#+$/, '').trim();
        elements.push(
          <h4 id={currentHeadingId} key={`h4-${i}`} className="text-sm font-semibold text-text-main mt-4 mb-1.5 scroll-mt-24 group flex items-center">
            <span>{renderInlineMarkdown(title)}</span>
            <a href={`#${currentHeadingId}`} className="opacity-0 group-hover:opacity-100 text-brand-secondary/60 hover:text-brand-secondary transition-opacity ml-2 text-xs font-mono select-none" title="Liên kết đến mục này">#</a>
          </h4>
        );
        i++;
        continue;
      }

      // ### Heading 3 (Tiêu đề phụ)
      if (/^###\s+/.test(trimmed)) {
        const title = trimmed.replace(/^###\s+/, '').replace(/\s*#+$/, '').trim();
        elements.push(
          <h3
            id={currentHeadingId}
            key={`h3-${i}`}
            className="text-base md:text-lg font-bold text-text-main mt-6 mb-2.5 scroll-mt-24 flex items-center group tracking-tight"
          >
            <span className="w-1.5 h-4 rounded-full bg-brand-secondary/90 mr-2.5 inline-block select-none flex-shrink-0" />
            <span className="text-text-main group-hover:text-brand-secondary transition-colors">
              {renderInlineMarkdown(title)}
            </span>
            <a
              href={`#${currentHeadingId}`}
              className="opacity-0 group-hover:opacity-100 text-brand-secondary/50 hover:text-brand-secondary transition-opacity ml-2 text-xs font-mono select-none"
              title="Sao chép liên kết tiểu mục"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(currentHeadingId);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                window.history.replaceState(null, '', `#${currentHeadingId}`);
              }}
            >
              #
            </a>
          </h3>
        );
        i++;
        continue;
      }

      // ## Heading 2 (Tiêu đề mục lớn)
      if (/^##\s+/.test(trimmed)) {
        const title = trimmed.replace(/^##\s+/, '').replace(/\s*#+$/, '').trim();
        elements.push(
          <div id={currentHeadingId} key={`h2-${i}`} className="mt-8 mb-3.5 pt-4 pb-2 border-b border-surface-border/70 scroll-mt-24 group">
            <h2 className="text-lg md:text-xl font-extrabold text-text-main tracking-tight flex items-center">
              <span className="w-2 h-5 rounded-full bg-brand-primary mr-3 inline-block select-none flex-shrink-0" />
              <span className="text-text-main group-hover:text-brand-light transition-colors">
                {renderInlineMarkdown(title)}
              </span>
              <a
                href={`#${currentHeadingId}`}
                className="opacity-0 group-hover:opacity-100 text-brand-secondary/50 hover:text-brand-secondary transition-opacity ml-2 text-sm font-mono select-none"
                title="Sao chép liên kết mục lớn"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(currentHeadingId);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                  window.history.replaceState(null, '', `#${currentHeadingId}`);
                }}
              >
                #
              </a>
            </h2>
          </div>
        );
        i++;
        continue;
      }

      // # Heading 1 (Tiêu đề chính)
      if (/^#\s+/.test(trimmed)) {
        const title = trimmed.replace(/^#\s+/, '').replace(/\s*#+$/, '').trim();
        elements.push(
          <h1
            id={currentHeadingId}
            key={`h1-${i}`}
            hidden={!isTitle}
            className={`${isTitle ? 'flex' : 'hidden'} text-2xl md:text-3xl font-extrabold text-text-main mt-8 mb-4 pb-3 border-b border-surface-border scroll-mt-24 flex items-center group tracking-tight`}
          >
            <span>{renderInlineMarkdown(title)}</span>
            <a
              href={`#${currentHeadingId}`}
              className="opacity-0 group-hover:opacity-100 text-brand-secondary/50 hover:text-brand-secondary transition-opacity ml-2.5 text-base font-mono select-none"
              title="Sao chép liên kết tiêu đề"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(currentHeadingId);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                window.history.replaceState(null, '', `#${currentHeadingId}`);
              }}
            >
              #
            </a>
          </h1>
        );
        i++;
        continue;
      }
    }

    // 4. GITHUB-STYLE ALERTS & BLOCKQUOTES (> [!NOTE], > [!TIP], > [!WARNING], > Quote)
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      let alertType: 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION' | null = null;

      while (i < rawLines.length && rawLines[i].trim().startsWith('>')) {
        let qLine = rawLines[i].trim().replace(/^>\s?/, '');
        if (quoteLines.length === 0) {
          const alertMatch = qLine.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
          if (alertMatch) {
            alertType = alertMatch[1].toUpperCase() as any;
            qLine = qLine.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i, '').trim();
          }
        }
        if (qLine) {
          quoteLines.push(qLine);
        }
        i++;
      }

      if (alertType) {
        const alertStyles = {
          NOTE: {
            bg: 'bg-blue-500/10 border-blue-500/40 text-blue-300',
            icon: 'helpCircle',
            label: 'LƯU Ý (NOTE)',
          },
          TIP: {
            bg: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
            icon: 'sparkles',
            label: 'MẸO / GỢI Ý (TIP)',
          },
          IMPORTANT: {
            bg: 'bg-purple-500/10 border-purple-500/40 text-purple-300',
            icon: 'award',
            label: 'QUAN TRỌNG (IMPORTANT)',
          },
          WARNING: {
            bg: 'bg-amber-500/10 border-amber-500/40 text-amber-300',
            icon: 'alertTriangle',
            label: 'CẢNH BÁO (WARNING)',
          },
          CAUTION: {
            bg: 'bg-rose-500/10 border-rose-500/40 text-rose-300',
            icon: 'shieldAlert',
            label: 'CẨN TRỌNG (CAUTION)',
          },
        };
        const conf = alertStyles[alertType];

        elements.push(
          <div
            key={`alert-${i}`}
            className={`my-3 p-3.5 rounded-card border ${conf.bg} flex flex-col gap-1.5`}
          >
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <AppIcon name={conf.icon} size={15} />
              <span>{conf.label}</span>
            </div>
            <div className="text-xs text-text-main leading-relaxed">
              {quoteLines.map((ql, qIdx) => (
                <p key={qIdx}>{renderInlineMarkdown(ql)}</p>
              ))}
            </div>
          </div>
        );
      } else {
        // Standard Blockquote
        elements.push(
          <blockquote
            key={`quote-${i}`}
            className="my-3 pl-4 py-2 border-l-4 border-brand-primary bg-surface-elevated/40 rounded-r-btn italic text-xs text-text-muted flex flex-col gap-1"
          >
            {quoteLines.map((ql, qIdx) => (
              <p key={qIdx}>{renderInlineMarkdown(ql)}</p>
            ))}
          </blockquote>
        );
      }
      continue;
    }

    // 5. GFM MARKDOWN TABLES (| Col 1 | Col 2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableRows: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|') && rawLines[i].trim().endsWith('|')) {
        tableRows.push(rawLines[i].trim());
        i++;
      }

      if (tableRows.length >= 2) {
        // Parse header and divider
        const headerCells = tableRows[0]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        
        // Skip index 1 if it's the divider row (e.g. |---|---|)
        const hasDivider = tableRows[1].includes('---');
        const bodyRows = hasDivider ? tableRows.slice(2) : tableRows.slice(1);

        elements.push(
          <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-card border border-surface-border">
            <table className="min-w-full text-left text-xs divide-y divide-surface-border">
              <thead className="bg-surface-elevated text-text-main font-semibold">
                <tr>
                  {headerCells.map((hc, hIdx) => (
                    <th key={hIdx} className="px-4 py-2.5 font-bold tracking-wide">
                      {renderInlineMarkdown(hc)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border bg-surface-card/60">
                {bodyRows.map((br, rIdx) => {
                  const cells = br
                    .split('|')
                    .slice(1, -1)
                    .map((c) => c.trim());
                  return (
                    <tr key={rIdx} className="hover:bg-surface-elevated/30 transition-colors">
                      {cells.map((cell, cIdx) => (
                        <td key={cIdx} className="px-4 py-2 text-text-main">
                          {renderInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 6. LISTS (BULLETED, NUMBERED, TASK LISTS)
    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('+ ');
    const isNumbered = /^\d+\.\s/.test(trimmed);

    if (isBullet || isNumbered) {
      const listItems: { text: string; isTask?: boolean; isChecked?: boolean }[] = [];
      const listIsNumbered = isNumbered;

      while (
        i < rawLines.length &&
        ((isBullet && (rawLines[i].trim().startsWith('- ') || rawLines[i].trim().startsWith('* ') || rawLines[i].trim().startsWith('+ '))) ||
          (listIsNumbered && /^\d+\.\s/.test(rawLines[i].trim())))
      ) {
        const itemText = rawLines[i].trim();
        let stripped = listIsNumbered ? itemText.replace(/^\d+\.\s*/, '') : itemText.substring(2);

        // Check for task item [ ] or [x]
        let isTask = false;
        let isChecked = false;
        if (stripped.startsWith('[ ] ')) {
          isTask = true;
          isChecked = false;
          stripped = stripped.replace(/^\[ \]\s*/, '');
        } else if (stripped.startsWith('[x] ') || stripped.startsWith('[X] ')) {
          isTask = true;
          isChecked = true;
          stripped = stripped.replace(/^\[[xX]\]\s*/, '');
        }

        listItems.push({ text: stripped, isTask, isChecked });
        i++;
      }

      if (listIsNumbered) {
        elements.push(
          <ol key={`ol-${i}`} className="my-2 ml-5 list-decimal space-y-1.5 text-xs text-text-main leading-relaxed">
            {listItems.map((item, itmIdx) => (
              <li key={itmIdx} className="pl-1">
                {renderInlineMarkdown(item.text)}
              </li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${i}`} className="my-2 space-y-1.5 text-xs text-text-main leading-relaxed">
            {listItems.map((item, itmIdx) => {
              if (item.isTask) {
                return (
                  <li key={itmIdx} className="flex items-center gap-2 list-none">
                    <input
                      type="checkbox"
                      checked={item.isChecked}
                      readOnly
                      className="rounded border-surface-border text-brand-primary focus:ring-0 cursor-default"
                    />
                    <span className={item.isChecked ? 'line-through text-text-subtle' : ''}>
                      {renderInlineMarkdown(item.text)}
                    </span>
                  </li>
                );
              }
              return (
                <li key={itmIdx} className="ml-5 list-disc pl-1">
                  {renderInlineMarkdown(item.text)}
                </li>
              );
            })}
          </ul>
        );
      }
      continue;
    }

    // 7. EMPTY LINE / SPACING
    if (!trimmed) {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // 8. STANDARD PARAGRAPH
    elements.push(
      <p key={`p-${i}`} className="text-xs md:text-sm text-text-main leading-relaxed">
        {renderInlineMarkdown(line)}
      </p>
    );
    i++;
  }

  return (
    <div className={`markdown-content flex flex-col gap-2 ${className}`}>
      {elements}
    </div>
  );
};

// Strip markdown syntax for preview cards / snippet text
export const stripMarkdown = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/^#+\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`{3}[\s\S]*?`{3}/g, '[Code Snippet]')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim();
};

export default MarkdownRenderer;
