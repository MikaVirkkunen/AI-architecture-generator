import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ConfigPanel } from './components/ConfigPanel';
import { GeneratePanel } from './components/GeneratePanel';
import { DiagramViewer } from './components/DiagramViewer';
import { HistoryPanel } from './components/HistoryPanel';
import { getAuthStatus } from './services/azureDiscovery';
import { saveToHistory } from './services/historyService';
import type { AuthStatus, GenerateResponse } from './types';

function WelcomeBanner({ auth }: { auth: AuthStatus | null }) {
  if (auth?.authenticated) return null;

  return (
    <div className="welcome-banner">
      <div className="welcome-content">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="10" fill="#0078d4" />
          <path d="M12 36L24 12L36 36H12Z" fill="white" opacity="0.9" />
          <rect x="21" y="27" width="6" height="6" rx="1.5" fill="#0078d4" />
        </svg>
        <div>
          <h2>Welcome to Azure Architecture Generator</h2>
          <p>
            Generate Draw.io Azure architecture diagrams using natural language.
            Run <code>az login</code> to connect to your Azure account and use
            your own OpenAI models to generate architecture diagrams.
          </p>
          <div className="welcome-actions">
            <code className="auth-command-inline">az login</code>
            <span className="welcome-or">then refresh this page</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState<AuthStatus | null>(null);
  const [config, setConfig] = useState<{
    endpoint: string;
    deploymentName: string;
    modelInfo: string;
  } | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Check server-side auth status on mount
  const refreshAuth = useCallback(() => {
    getAuthStatus()
      .then(setAuth)
      .catch(() =>
        setAuth({ authenticated: false, message: 'Cannot reach API server.' })
      );
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const handleConfigChange = useCallback(
    (cfg: typeof config) => {
      setConfig(cfg);
    },
    []
  );

  return (
    <div className="app">
      <Header auth={auth} theme={theme} onToggleTheme={toggleTheme} />

      <main className="main">
        <div className="sidebar">
          <WelcomeBanner auth={auth} />
          <ConfigPanel auth={auth} onConfigChange={handleConfigChange} onAuthRefresh={refreshAuth} />
          <GeneratePanel
            auth={auth}
            config={config}
            previousResult={result}
            onGenerated={(res, prompt, title) => {
              setResult(res);
              saveToHistory({
                prompt,
                title: title || res.architecture?.title || 'Untitled',
                xml: res.xml,
                parsed: res.parsed,
                modelInfo: config?.modelInfo || '',
              });
            }}
            onError={setError}
          />
          <HistoryPanel onLoad={setResult} />
          {error && (
            <div className="alert alert-error sidebar-alert">
              <strong>Error:</strong> {error}
              <button
                className="alert-dismiss"
                onClick={() => setError('')}
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="content">
          <DiagramViewer result={result} />
        </div>
      </main>
    </div>
  );
}
