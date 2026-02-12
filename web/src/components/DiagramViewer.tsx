import { useRef, useEffect, useState } from 'react';
import type { GenerateResponse } from '../types';

interface DiagramViewerProps {
  result: GenerateResponse | null;
}

export function DiagramViewer({ result }: DiagramViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showXml, setShowXml] = useState(false);
  const [copied, setCopied] = useState(false);
  // Track whether the iframe has finished its initial 'init' handshake
  const iframeReady = useRef(false);
  // Store the pending XML so the message handler always has the latest
  const pendingXml = useRef<string | null>(null);

  // One-time listener: handles draw.io init/load events for the lifetime of the component
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'string') return;
      try {
        const msg = JSON.parse(event.data);

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
  }, []);

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

    if (iframeReady.current) {
      // Iframe already initialized — send immediately
      sendXml(result.xml);
    }
    // else: the init handler above will pick it up from pendingXml
  }, [result?.xml]);

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
            {result.parsed.resources.length} resources
          </span>
          {result.parsed.connections &&
            result.parsed.connections.length > 0 && (
              <span className="badge">
                {result.parsed.connections.length} connections
              </span>
            )}
        </div>
        <div className="viewer-actions">
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
            </div>
          )}
          <iframe
            ref={iframeRef}
            className="diagram-frame"
            src="https://embed.diagrams.net/?embed=1&proto=json&spin=1&ui=min&noSaveBtn=1&noExitBtn=1"
            style={{ opacity: isLoaded ? 1 : 0 }}
            title="Architecture diagram"
          />
        </div>
      )}

      <div className="resource-list">
        <h4>Resources</h4>
        <div className="resource-grid">
          {result.parsed.resources.map((r, i) => (
            <div key={i} className="resource-item">
              <span className="resource-type">{r.type}</span>
              <span className="resource-name">{r.name}</span>
              {r.count && r.count > 1 && (
                <span className="resource-count">×{r.count}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
