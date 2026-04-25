import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { t } from '../utils/i18n';

const styleSheet = `
  .markdown-body h1, .markdown-body h2, .markdown-body h3 {
    font-family: var(--font-display);
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }
  .markdown-body p {
    line-height: 1.6;
    margin-bottom: 1em;
    color: var(--text-secondary);
  }
  .markdown-body ul {
    margin-bottom: 1em;
    padding-left: 2em;
    color: var(--text-secondary);
  }
  .markdown-body li {
    margin-bottom: 0.5em;
  }
  .markdown-body code {
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: var(--font-mono);
    font-size: 0.9em;
  }
  .markdown-body blockquote {
    border-left: 3px solid var(--accent);
    padding-left: 1em;
    color: var(--text-muted);
    margin-bottom: 1em;
  }
`;

const Notes = () => {
  const { user } = useAuth();
  const lang = user?.language || 'en';
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    // Simulate generation time
    const timer = setTimeout(() => {
      setIsGenerating(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <style>{styleSheet}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h3 style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
            Data Structures • Unit 2
          </h3>
          <h1 style={{ fontSize: 'var(--text-2xl)' }}>Binary Search Tree</h1>
        </div>
        {!isGenerating && (
          <button className="btn-secondary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--text-lg)' }}>⬇️</span> {t('download_pdf', lang)}
          </button>
        )}
      </div>

      {isGenerating ? (
        <div className="card" style={{ padding: '64px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 2s linear infinite' }}>⚙️</div>
          <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: '8px' }}>Generating AI Study Notes...</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Parsing your syllabus content to create a personalized cheat sheet.</p>
        </div>
      ) : (
        <div className="card markdown-body" style={{ padding: '40px' }}>
          <p>
            A <strong>Binary Search Tree (BST)</strong> is a node-based binary tree data structure which has the following properties:
          </p>
          <ul>
            <li>The left subtree of a node contains only nodes with keys lesser than the node’s key.</li>
            <li>The right subtree of a node contains only nodes with keys greater than the node’s key.</li>
            <li>The left and right subtree each must also be a binary search tree.</li>
          </ul>

          <blockquote style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
            Time Complexity: Searching, Insertion, and Deletion are all <code>O(h)</code>, where <code>h</code> is the height of the tree.
          </blockquote>

          <h2>Core Operations</h2>
          <h3>1. Search</h3>
          <p>
            To search a given key in Binary Search Tree, we first compare it with root. If the key is present at root, we return root. If key is greater than root’s key, we recur for right subtree of root node. Otherwise we recur for left subtree.
          </p>

          <h3>2. Insertion</h3>
          <p>
            A new key is always inserted at the leaf. We start searching a key from root till we hit a leaf node. Once a leaf node is found, the new node is added as a child of the leaf node.
          </p>
          
          <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
             <button className="btn-primary" style={{ width: '100%' }}>{t('take_quiz', lang)}</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
