import { useState, useEffect } from 'react';
import {
  getHistory,
  deleteEntry,
  clearHistory,
  type HistoryEntry,
} from '../services/historyService';
import type { GenerateResponse } from '../types';

interface HistoryPanelProps {
  onLoad: (result: GenerateResponse) => void;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function HistoryPanel({ onLoad }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [expanded, setExpanded] = useState(false);

  const refresh = () => setHistory(getHistory());

  useEffect(() => {
    refresh();
    // Re-check when storage changes from another tab
    const handler = (e: StorageEvent) => {
      if (e.key === 'az-arch-gen-history') refresh();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Refresh whenever we expand
  useEffect(() => {
    if (expanded) refresh();
  }, [expanded]);

  const handleLoad = (entry: HistoryEntry) => {
    onLoad({
      xml: entry.xml,
      architecture: {
        title: entry.title,
        description: entry.parsed?.description,
        pages: entry.parsed?.pages?.map(p => ({ name: p.name, description: p.description })),
      },
      parsed: entry.parsed,
    });
  };

  const handleDownloadPrompt = (entry: HistoryEntry) => {
    const lines = [
      `Title: ${entry.title}`,
      `Date: ${new Date(entry.timestamp).toLocaleString()}`,
      `Model: ${entry.modelInfo || 'unknown'}`,
      '',
      '--- Prompt ---',
      entry.prompt,
    ];
    if (entry.parsed?.description) {
      lines.push('', '--- AI Description ---', entry.parsed.description);
    }
    if (entry.parsed?.pages) {
      for (const page of entry.parsed.pages) {
        lines.push('', `--- ${page.name} ---`);
        if (page.description) lines.push(page.description);
      }
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.title || 'prompt'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = (id: string) => {
    deleteEntry(id);
    refresh();
  };

  const handleClear = () => {
    if (confirm('Clear all history?')) {
      clearHistory();
      refresh();
    }
  };

  if (history.length === 0) return null;

  return (
    <div className="history-panel">
      <button
        className="history-toggle"
        onClick={() => setExpanded(!expanded)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 4V8.5L10.5 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        History ({history.length})
        <span className={`chevron ${expanded ? 'open' : ''}`}>▸</span>
      </button>

      {expanded && (
        <div className="history-list">
          {history.map(entry => (
            <div key={entry.id} className="history-item">
              <div className="history-meta">
                <div className="history-prompt">{entry.prompt.slice(0, 80)}{entry.prompt.length > 80 ? '…' : ''}</div>
                <div className="history-sub">
                  <span className="history-time">{timeAgo(entry.timestamp)}</span>
                  <span className="badge badge-sm">{entry.parsed?.resources?.length ?? 0} res</span>
                </div>
              </div>
              <div className="history-actions">
                <button className="btn btn-sm" onClick={() => handleLoad(entry)} title="Load diagram">Load</button>
                <button className="btn btn-sm" onClick={() => handleDownloadPrompt(entry)} title="Download prompt &amp; description">↓</button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(entry.id)} title="Delete">✕</button>
              </div>
            </div>
          ))}
          <button className="btn btn-sm btn-text history-clear" onClick={handleClear}>
            Clear all history
          </button>
        </div>
      )}
    </div>
  );
}
