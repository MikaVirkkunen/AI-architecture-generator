import type { AuthStatus } from '../types';

interface HeaderProps {
  auth: AuthStatus | null;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function Header({ auth, theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#0078d4" />
            <path d="M8 24L16 8L24 24H8Z" fill="white" opacity="0.9" />
            <rect x="14" y="18" width="4" height="4" rx="1" fill="#0078d4" />
          </svg>
          <h1>Azure Architecture Generator</h1>
        </div>
      </div>
      <div className="header-right">
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>
        {auth?.authenticated ? (
          <div className="user-info">
            <div className="user-avatar">
              {auth.user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="user-details">
              <span className="user-name">{auth.user?.name}</span>
              <span className="user-tenant">
                {auth.user?.subscriptionName}
              </span>
            </div>
          </div>
        ) : (
          <span className="auth-hint">
            Run <code>az login</code> to connect
          </span>
        )}
      </div>
    </header>
  );
}
