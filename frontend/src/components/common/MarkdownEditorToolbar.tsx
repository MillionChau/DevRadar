import React from 'react';
import { AppIcon } from './Icon';

interface MarkdownEditorToolbarProps {
  onInsert: (prefix: string, suffix?: string, defaultPlaceholder?: string) => void;
  viewMode: 'split' | 'edit' | 'preview';
  onChangeViewMode: (mode: 'split' | 'edit' | 'preview') => void;
}

export const MarkdownEditorToolbar: React.FC<MarkdownEditorToolbarProps> = ({
  onInsert,
  viewMode,
  onChangeViewMode,
}) => {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 bg-surface-elevated/70 border-b border-surface-border text-xs text-text-muted">
      {/* Formatting Tools */}
      <div className="flex items-center flex-wrap gap-1">
        {/* Bold */}
        <button
          type="button"
          onClick={() => onInsert('**', '**', 'chữ đậm')}
          className="p-1.5 rounded hover:bg-surface-elevated hover:text-text-main font-bold text-xs transition-colors"
          title="Chữ đậm (**xx**)"
        >
          <strong>B</strong>
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => onInsert('*', '*', 'chữ nghiêng')}
          className="p-1.5 rounded hover:bg-surface-elevated hover:text-text-main italic text-xs transition-colors"
          title="Chữ nghiêng (*xx*)"
        >
          <em>I</em>
        </button>

        {/* Strikethrough */}
        <button
          type="button"
          onClick={() => onInsert('~~', '~~', 'chữ gạch ngang')}
          className="p-1.5 rounded hover:bg-surface-elevated hover:text-text-main line-through text-xs transition-colors"
          title="Chữ gạch ngang (~~xx~~)"
        >
          S
        </button>

        <span className="w-[1px] h-4 bg-surface-border mx-1" />

        {/* Heading 2 */}
        <button
          type="button"
          onClick={() => onInsert('\n## ', '\n', 'Tiêu đề mục (Heading 2)')}
          className="p-1.5 rounded hover:bg-surface-elevated hover:text-brand-secondary font-bold font-mono text-xs transition-colors"
          title="Tiêu đề mục lớn (## xx)"
        >
          H2
        </button>

        {/* Heading 3 */}
        <button
          type="button"
          onClick={() => onInsert('\n### ', '\n', 'Tiểu mục kỹ thuật (Heading 3)')}
          className="p-1.5 rounded hover:bg-surface-elevated hover:text-brand-secondary font-bold font-mono text-xs transition-colors"
          title="Tiểu mục (### xx)"
        >
          H3
        </button>

        <span className="w-[1px] h-4 bg-surface-border mx-1" />

        {/* Inline Code */}
        <button
          type="button"
          onClick={() => onInsert('`', '`', 'variable_or_func()')}
          className="p-1.5 rounded hover:bg-surface-elevated hover:text-brand-secondary font-mono text-xs transition-colors"
          title="Mã nội dòng (`code`)"
        >
          &lt;/&gt;
        </button>

        {/* Code Block Dropdown */}
        <div className="relative group inline-block">
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-elevated hover:text-brand-secondary font-mono text-[11px] border border-surface-border/60 transition-colors"
            title="Chèn khối mã nguồn (```c++, ```csharp, ...)"
          >
            <span>``` Code</span>
            <AppIcon name="chevronDown" size={10} />
          </button>
          <div className="absolute left-0 top-full mt-1 w-36 bg-surface-card border border-surface-border rounded-card shadow-xl py-1.5 z-20 hidden group-hover:flex flex-col text-xs">
            <button
              type="button"
              onClick={() => onInsert('\n```cpp\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello DevRadar" << endl;\n    return 0;\n}\n```\n')}
              className="px-3 py-1 text-left hover:bg-surface-elevated hover:text-brand-secondary"
            >
              C++ (```cpp)
            </button>
            <button
              type="button"
              onClick={() => onInsert('\n```csharp\npublic class Solution {\n    public void Execute() {\n        Console.WriteLine("DevRadar .NET 10");\n    }\n}\n```\n')}
              className="px-3 py-1 text-left hover:bg-surface-elevated hover:text-brand-secondary"
            >
              C# / .NET (```csharp)
            </button>
            <button
              type="button"
              onClick={() => onInsert('\n```python\ndef analyze_code(repo_name: str):\n    print(f"Analyzing {repo_name}...")\n```\n')}
              className="px-3 py-1 text-left hover:bg-surface-elevated hover:text-brand-secondary"
            >
              Python (```python)
            </button>
            <button
              type="button"
              onClick={() => onInsert('\n```typescript\ninterface RadarMetric {\n  name: string;\n  score: number;\n}\n```\n')}
              className="px-3 py-1 text-left hover:bg-surface-elevated hover:text-brand-secondary"
            >
              TypeScript (```ts)
            </button>
            <button
              type="button"
              onClick={() => onInsert('\n```sql\nSELECT id, title, likes_count \nFROM posts \nWHERE is_approved = 1 \nORDER BY created_date DESC;\n```\n')}
              className="px-3 py-1 text-left hover:bg-surface-elevated hover:text-brand-secondary"
            >
              SQL (```sql)
            </button>
            <button
              type="button"
              onClick={() => onInsert('\n```bash\n# Cài đặt và khởi chạy dự án\nnpm install\nnpm run dev\n```\n')}
              className="px-3 py-1 text-left hover:bg-surface-elevated hover:text-brand-secondary"
            >
              Bash / Shell (```bash)
            </button>
          </div>
        </div>

        <span className="w-[1px] h-4 bg-surface-border mx-1" />

        {/* Quote */}
        <button
          type="button"
          onClick={() => onInsert('\n> ', '\n', 'Trích dẫn kỹ thuật quan trọng')}
          className="p-1.5 rounded hover:bg-surface-elevated hover:text-text-main text-xs transition-colors"
          title="Trích dẫn (> Quote)"
        >
          <AppIcon name="message" size={12} />
        </button>

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => onInsert('\n- ', '\n', 'Mục danh sách')}
          className="p-1.5 rounded hover:bg-surface-elevated hover:text-text-main text-xs transition-colors"
          title="Danh sách gạch đầu dòng (- Item)"
        >
          • List
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onClick={() => onInsert('\n1. ', '\n', 'Bước thực hiện 1')}
          className="p-1.5 rounded hover:bg-surface-elevated hover:text-text-main text-xs transition-colors"
          title="Danh sách đánh số (1. Item)"
        >
          1. List
        </button>

        {/* Link */}
        <button
          type="button"
          onClick={() => onInsert('[', '](https://example.com)', 'Tiêu đề liên kết')}
          className="p-1.5 rounded hover:bg-surface-elevated hover:text-text-main text-xs transition-colors"
          title="Chèn liên kết ([text](url))"
        >
          🔗 Link
        </button>

        {/* Table */}
        <button
          type="button"
          onClick={() => onInsert('\n| Tiêu chí | Điểm số | Ghi chú |\n|---|---|---|\n| Hiệu năng | 9.5/10 | Tối ưu bộ nhớ |\n| Bảo mật | 9.0/10 | Mã hóa JWT |\n\n')}
          className="p-1.5 rounded hover:bg-surface-elevated hover:text-text-main text-xs transition-colors"
          title="Chèn bảng Markdown"
        >
          📊 Bảng
        </button>

        {/* GitHub Alert Note */}
        <button
          type="button"
          onClick={() => onInsert('\n> [!NOTE]\n> Lưu ý kỹ thuật quan trọng ở đây...\n\n')}
          className="px-2 py-0.5 rounded hover:bg-blue-500/20 text-blue-400 text-[11px] font-semibold border border-blue-500/30 transition-colors"
          title="Hộp ghi chú cảnh báo chuẩn GitHub (> [!NOTE])"
        >
          💡 Note
        </button>
      </div>

      {/* View Mode Switcher */}
      <div className="flex items-center gap-1 bg-surface-card p-1 rounded-btn border border-surface-border">
        <button
          type="button"
          onClick={() => onChangeViewMode('edit')}
          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
            viewMode === 'edit'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-text-muted hover:text-text-main'
          }`}
          title="Chỉ hiển thị khung soạn thảo"
        >
          Soạn thảo
        </button>
        <button
          type="button"
          onClick={() => onChangeViewMode('split')}
          className={`px-2 py-0.5 rounded text-[11px] font-medium hidden md:inline transition-colors ${
            viewMode === 'split'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-text-muted hover:text-text-main'
          }`}
          title="Xem song song Soạn thảo và Bản xem trước"
        >
          Song song
        </button>
        <button
          type="button"
          onClick={() => onChangeViewMode('preview')}
          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
            viewMode === 'preview'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'text-text-muted hover:text-text-main'
          }`}
          title="Chỉ hiển thị bản xem trước Markdown"
        >
          Xem trước
        </button>
      </div>
    </div>
  );
};

export default MarkdownEditorToolbar;
