import { useRef, useEffect, useState, useCallback } from 'react';
import type { GenerateResponse } from '../types';

interface DiagramViewerProps {
  result: GenerateResponse | null;
}

export function DiagramViewer({ result }: DiagramViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showXml, setShowXml] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState<'png' | 'svg' | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  // Track whether the iframe has finished its initial 'init' handshake
  const iframeReady = useRef(false);
  // Store the pending XML so the message handler always has the latest
  const pendingXml = useRef<string | null>(null);

  // Export handler: trigger Draw.io embed export API
  const handleExport = useCallback((format: 'png' | 'svg') => {
    if (!iframeRef.current?.contentWindow || !isLoaded) return;
    setExporting(format);
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({
        action: 'export',
        format,
        spin: true,
        ...(format === 'png' ? { scale: 2, border: 10, background: '#ffffff' } : {}),
      }),
      '*'
    );
    // Safety timeout — clear exporting state if no response after 15s
    setTimeout(() => setExporting(null), 15000);
  }, [isLoaded]);

  // One-time listener: handles draw.io init/load/export events for the lifetime of the component
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'string') return;
      try {
        const msg = JSON.parse(event.data);

        if (msg.event === 'configure') {
          console.log('[drawio] configure requested');
          // Respond with minimal config — keep panels functional
          if (iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({
                action: 'configure',
                config: {
                  defaultLibraries: '',
                },
              }),
              '*'
            );
          }
        }

        if (msg.event === 'init') {
          console.log('[drawio] iframe ready (init)');
          iframeReady.current = true;
          // If XML was already waiting, send it now
          if (pendingXml.current) {
            sendXml(pendingXml.current);
          }
        }

        if (msg.event === 'load') {
          console.log('[drawio] diagram loaded');
          setIsLoaded(true);
          // Close Shapes and Format panels after diagram loads
          // by programmatically clicking their close buttons
          setTimeout(() => {
            try {
              const iframeDoc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document;
              if (iframeDoc) {
                // Find and click the "Shapes" button to toggle off the sidebar
                const buttons = iframeDoc.querySelectorAll('a.geButton');
                buttons.forEach((btn: any) => {
                  const title = btn.getAttribute('title') || btn.textContent;
                  if (title === 'Shapes' || title === 'Format') {
                    // Only click if the panel is currently visible
                    btn.click();
                  }
                });
              }
            } catch {
              // Cross-origin — can't access iframe DOM, panels stay open
            }
          }, 500);
        }

        if (msg.event === 'export') {
          setExporting(null);
          const title = result?.architecture?.title || 'architecture';
          if (msg.format === 'png' && msg.data) {
            // Validate that data is a base64 data URI, not an arbitrary URL
            if (typeof msg.data !== 'string' || !msg.data.startsWith('data:image/png;base64,')) {
              console.warn('Unexpected PNG export data format, ignoring');
              return;
            }
            const a = document.createElement('a');
            a.href = msg.data;
            a.download = `${title}.png`;
            a.click();
          } else if (msg.format === 'svg' && msg.data) {
            if (typeof msg.data !== 'string') return;
            const blob = new Blob([msg.data], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}.svg`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }

        if (msg.event === 'autosave' || msg.event === 'save') {
          // Ignore autosave events
        }
      } catch {
        // Ignore non-JSON messages (e.g. webpack HMR)
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [result]);

  // Send XML helper — just posts the load action
  const sendXml = (xml: string) => {
    if (iframeRef.current?.contentWindow) {
      console.log(`[drawio] sending XML (${xml.length} chars)`);
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ action: 'load', xml, autosave: 0 }),
        '*'
      );
    }
  };

  // When new XML arrives, send it to the iframe (or queue it for after init)
  useEffect(() => {
    if (!result?.xml) return;

    pendingXml.current = result.xml;
    setIsLoaded(false);
    setLoadingTime(0);

    if (iframeReady.current) {
      // Iframe already initialized — send immediately
      sendXml(result.xml);
    }
    // else: the init handler above will pick it up from pendingXml
  }, [result?.xml]);

  // Loading timer — ticks every second while loading
  useEffect(() => {
    if (isLoaded || !result?.xml) return;
    const interval = setInterval(() => {
      setLoadingTime(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoaded, result?.xml]);

  const handleDownload = () => {
    if (!result?.xml) return;
    const blob = new Blob([result.xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.architecture?.title || 'architecture'}.drawio`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyXml = async () => {
    if (!result?.xml) return;
    await navigator.clipboard.writeText(result.xml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!result) {
    return (
      <div className="diagram-viewer empty">
        <div className="empty-state">
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
          >
            <rect
              x="8"
              y="12"
              width="48"
              height="40"
              rx="4"
              stroke="#c8c6c4"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M22 32H42M22 38H36"
              stroke="#c8c6c4"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx="32"
              cy="24"
              r="4"
              stroke="#c8c6c4"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          <p>Your architecture diagram will appear here</p>
          <p className="subtle">
            Describe your architecture and click Generate
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="diagram-viewer">
      <div className="viewer-toolbar">
        <div className="resource-summary">
          <span className="badge">
            {result.parsed?.resources?.length
              ?? result.parsed?.pages?.reduce((sum, p) => sum + (p.resources?.length ?? 0), 0)
              ?? 0} resources
          </span>
          {result.parsed?.connections &&
            result.parsed.connections.length > 0 && (
              <span className="badge">
                {result.parsed.connections.length} connections
              </span>
            )}
        </div>
        <div className="viewer-actions">
          <button
            className="btn btn-toolbar"
            onClick={() => handleExport('png')}
            disabled={!isLoaded || exporting === 'png'}
            title="Export as PNG"
          >
            {exporting === 'png' ? '⏳' : '↓'} PNG
          </button>
          <button
            className="btn btn-toolbar"
            onClick={() => handleExport('svg')}
            disabled={!isLoaded || exporting === 'svg'}
            title="Export as SVG"
          >
            {exporting === 'svg' ? '⏳' : '↓'} SVG
          </button>
          <button
            className="btn btn-toolbar"
            onClick={() => setShowXml(!showXml)}
          >
            {showXml ? 'Diagram' : 'XML'}
          </button>
          <button className="btn btn-toolbar" onClick={handleCopyXml}>
            {copied ? '✓ Copied' : 'Copy XML'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleDownload}
          >
            ↓ Download .drawio
          </button>
        </div>
      </div>

      {/* Description Panel — collapsed by default */}
      {(result.architecture?.description || result.parsed?.description) && (
        <div className={`description-panel ${descExpanded ? 'description-expanded' : ''}`}>
          <button
            className="description-toggle"
            onClick={() => setDescExpanded(!descExpanded)}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <path d="M8 1C4.13 1 1 4.13 1 8s3.13 7 7 7 7-3.13 7-7-3.13-7-7-7zm.5 10.5h-1v-4h1v4zm0-5.5h-1V4.5h1V6z" fill="currentColor" opacity="0.6"/>
            </svg>
            <span className="description-summary">
              {descExpanded
                ? 'Architecture Description'
                : (result.architecture?.description || result.parsed?.description || '').slice(0, 80) + ((result.architecture?.description || result.parsed?.description || '').length > 80 ? '…' : '')
              }
            </span>
            <svg
              className={`description-chevron ${descExpanded ? 'description-chevron-open' : ''}`}
              width="12" height="12" viewBox="0 0 16 16" fill="none"
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {descExpanded && (
            <div className="description-body">
              <p className="description-text">{result.architecture?.description || result.parsed?.description}</p>
              {result.parsed?.pages && result.parsed.pages.filter(p => p.description).length > 0 && (
                <div className="description-pages">
                  {result.parsed.pages.filter(p => p.description).map((page, i) => (
                    <div key={i} className="description-page-item">
                      <strong>{page.name}:</strong> {page.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {showXml ? (
        <div className="xml-view">
          <pre>
            <code>{result.xml}</code>
          </pre>
        </div>
      ) : (
        <div className="diagram-frame-container">
          {!isLoaded && (
            <div className="diagram-loading">
              <span className="spinner spinner-lg" />
              <p>Loading diagram preview...</p>
              {loadingTime > 0 && (
                <span className="loading-timer">{loadingTime}s</span>
              )}
              {loadingTime > 15 && (
                <div className="loading-hint">
                  <p>Taking longer than expected.</p>
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      // Force reload the iframe
                      iframeReady.current = false;
                      setIsLoaded(false);
                      setLoadingTime(0);
                      if (iframeRef.current) {
                        iframeRef.current.src = iframeRef.current.src;
                      }
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          )}
          <iframe
            ref={iframeRef}
            className="diagram-frame"
            src="https://embed.diagrams.net/?embed=1&configure=1&proto=json&spin=1&ui=min&noSaveBtn=1&noExitBtn=1&libraries=0"
            style={{ opacity: isLoaded ? 1 : 0 }}
            title="Architecture diagram"
          />
        </div>
      )}

      <div className="resource-list">
        <h4>Resources</h4>
        <div className="resource-grid">
          {(() => {
            const resources = result.parsed?.resources
              ?? result.parsed?.pages?.flatMap(p => p.resources ?? [])
              ?? [];
            return resources.map((r, i) => (
              <div key={i} className="resource-item">
                <span className="resource-type">{r.type}</span>
                <span className="resource-name">{r.name}</span>
                {r.count && r.count > 1 && (
                  <span className="resource-count">×{r.count}</span>
                )}
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
