import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import html2pdf from 'html2pdf.js';

const styleSheet = `.markdown-body h1,.markdown-body h2,.markdown-body h3{font-family:var(--font-display);margin-top:1.5em;margin-bottom:.5em}.markdown-body p{line-height:1.6;margin-bottom:1em;color:var(--text-secondary)}.markdown-body ul{margin-bottom:1em;padding-left:2em;color:var(--text-secondary)}.markdown-body li{margin-bottom:.5em}.markdown-body code{background:var(--surface);border:1px solid var(--border);padding:.2em .4em;border-radius:3px;font-family:var(--font-mono);font-size:.9em}.markdown-body blockquote{border-left:3px solid var(--accent);padding-left:1em;color:var(--text-muted);margin-bottom:1em}.markdown-body table{width:100%;border-collapse:collapse;margin-bottom:1em}.markdown-body th,.markdown-body td{border:1px solid var(--border);padding:8px 12px}.markdown-body th{background:var(--surface);font-weight:600}`;

const Notes = () => {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [searchParams] = useSearchParams();
  const topic = searchParams.get('topic') || 'General Topic';
  const subject = searchParams.get('subject') || '';
  const unit = searchParams.get('unit') || '';

  const [isGenerating, setIsGenerating] = useState(true);
  const [markdown, setMarkdown] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const generateNotes = async () => {
      try {
        const { data } = await axios.post('/api/notes/generate', { topic, subject, unit });
        setMarkdown(data.markdown);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to generate notes');
      } finally {
        setIsGenerating(false);
      }
    };
    generateNotes();
  }, [topic, subject, unit]);

  const handleDownloadPdf = () => {
    const element = document.getElementById('notes-content');
    const opt = {
      margin:       10,
      filename:     `${topic.replace(/\s+/g, '_')}_Notes.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <style>{styleSheet}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          {subject && <h3 style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{subject} • {unit}</h3>}
          <h1 style={{ fontSize: 'var(--text-2xl)' }}>{topic}</h1>
        </div>
        {!isGenerating && !error && (
          <button onClick={handleDownloadPdf} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⬇️</span> {t('download_pdf', lang)}
          </button>
        )}
      </div>

      {isGenerating ? (
        <div className="card" style={{ padding: '64px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 2s linear infinite' }}>⚙️</div>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: '8px' }}>{t('generating_ai_notes', lang)}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{t('creating_cheat_sheet', lang)} {topic}.</p>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--danger)' }}>{error}</div>
      ) : (
        <div id="notes-content" className="card markdown-body" style={{ padding: '40px' }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default Notes;
