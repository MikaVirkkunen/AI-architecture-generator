import type { AuthStatus } from '../types';

interface HeaderProps {
  auth: AuthStatus | null;
}

export function Header({ auth }: HeaderProps) {
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
        {auth?.authenticated ? (
          <div className="user-info">
            <div className="user-avatar">
              {auth.user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <span className="user-name">{auth.user?.name}</span>
            <span className="user-tenant">
              {auth.user?.subscriptionName}
            </span>
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
