import { useEffect, useRef, useState } from 'react';
import { checkInByQR } from '../services/serviceGuest';
import { P, icons } from '../utils/theme';

export default function StaffQRScanner() {
  const [scanResult, setScanResult]           = useState(null);
  const [manualCode, setManualCode]           = useState('');
  const [loading, setLoading]                 = useState(false);
  const [cameraActive, setCameraActive]       = useState(false);
  const [cameraError, setCameraError]         = useState(null);
  const [history, setHistory]                 = useState([]);
  const [camPermission, setCamPermission]     = useState('unknown'); // 'unknown'|'granted'|'denied'|'unavailable'
  const scannerRef      = useRef(null);
  const scannerInstance = useRef(null);
  const manualRef       = useRef(null);

  useEffect(() => { manualRef.current?.focus(); }, []);

  // Check camera availability and permission on mount
  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setCamPermission('unavailable');
      return;
    }
    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: 'camera' })
        .then(result => {
          setCamPermission(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'unknown');
          result.onchange = () => {
            setCamPermission(result.state === 'granted' ? 'granted' : result.state === 'denied' ? 'denied' : 'unknown');
          };
        })
        .catch(() => setCamPermission('unknown'));
    }
  }, []);

  const processCode = async (code) => {
    if (!code?.trim() || loading) return;
    setLoading(true);
    setScanResult(null);
    try {
      const data = await checkInByQR(code.trim());
      setScanResult(data);
      if (!data.alreadyCheckedIn) {
        setHistory(prev => [
          { name: data.guest?.fullName, time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }), key: Date.now() },
          ...prev.slice(0, 9),
        ]);
      }
    } catch (err) {
      setScanResult({ error: true, message: err.message || 'Invalid QR code' });
    } finally {
      setLoading(false);
      setManualCode('');
      manualRef.current?.focus();
    }
  };

  const handleManualSubmit = (e) => { e.preventDefault(); processCode(manualCode); };

  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    setCamPermission('unknown');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      scannerInstance.current = new Html5Qrcode('qr-reader-div');
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      const onScanSuccess = (decodedText) => { processCode(decodedText); stopCamera(); };
      const onScanFailure = () => {};
      try {
        await scannerInstance.current.start({ facingMode: 'environment' }, config, onScanSuccess, onScanFailure);
      } catch (err) {
        console.warn('Rear camera not found, falling back.', err);
        await scannerInstance.current.start({ facingMode: 'user' }, config, onScanSuccess, onScanFailure);
      }
      setCamPermission('granted');
    } catch (e) {
      const msg = e.message || String(e);
      const isDenied = /denied|not allowed|permission/i.test(msg);
      setCamPermission(isDenied ? 'denied' : 'unavailable');
      setCameraError(
        isDenied
          ? 'Camera access was denied. Please allow camera permission in your browser settings and reload.'
          : 'Could not start camera: ' + msg
      );
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerInstance.current) {
      try { await scannerInstance.current.stop(); } catch (err) { console.error(err); }
      scannerInstance.current = null;
    }
    setCameraActive(false);
    manualRef.current?.focus();
  };

  useEffect(() => {
    return () => { if (scannerInstance.current) scannerInstance.current.stop().catch(() => {}); };
  }, []);

  const camStatus = {
    granted:     { label: 'Camera ready',       color: P.green,  glow: P.greenGlow,  icon: icons.camera },
    denied:      { label: 'Camera denied',       color: P.red,    glow: P.redGlow,    icon: icons.videoOff },
    unavailable: { label: 'No camera detected',  color: P.amber,  glow: P.amberGlow,  icon: icons.videoOff },
    unknown:     { label: 'Camera status unknown', color: P.muted, glow: 'transparent', icon: icons.camera },
  }[camPermission] || { label: 'Camera status unknown', color: P.muted, glow: 'transparent', icon: icons.camera };

  const resultAccent = scanResult?.alreadyCheckedIn ? P.amber : scanResult?.error ? P.red : P.green;
  const resultGlow   = scanResult?.alreadyCheckedIn ? P.amberGlow : scanResult?.error ? P.redGlow : P.greenGlow;
  const resultIcon   = scanResult?.alreadyCheckedIn ? icons.warning : scanResult?.error ? icons.xCircle : icons.checkCircle;

  return (
    <div style={{ minHeight: '100vh', background: P.bg, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif", color: P.text }}>
      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes cardIn    { from { opacity:0; transform:translateY(16px);  } to { opacity:1; transform:translateY(0); } }
        @keyframes spin      { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes pulse     { 0%,100%{box-shadow:0 0 0 0 ${P.blue}55} 50%{box-shadow:0 0 0 6px transparent} }
        select option { background: ${P.panel}; }
      `}</style>

      {/* Nav */}
      <div style={{ background: 'rgba(17,17,17,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${P.border}`, padding: '0 24px', display: 'flex', alignItems: 'center', height: 54, gap: 14, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: P.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            {icons.qr}
          </div>
          <span style={{ color: P.text, fontSize: 15, fontWeight: 700 }}>PopEyez</span>
        </div>
        <span style={{ color: P.muted, fontSize: 13 }}>/ QR Check-in Scanner</span>
      </div>

      <div style={{ maxWidth: 580, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: P.text, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: P.blue }}>{icons.qr}</span> QR Check-in
        </h1>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: P.sub }}>
          Scan a guest&apos;s QR code to check them in instantly.
        </p>

        {/* Result banner */}
        {scanResult && (
          <div style={{
            background: resultGlow,
            border: `1px solid ${resultAccent}44`,
            borderRadius: 12,
            padding: '18px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            animation: 'slideDown 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
          }}>
            <span style={{ color: resultAccent, display: 'flex', flexShrink: 0, transform: 'scale(1.3)' }}>{resultIcon}</span>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: resultAccent }}>{scanResult.message}</p>
              {scanResult.guest && (
                <p style={{ margin: '4px 0 0', fontSize: 13, color: P.sub }}>
                  {scanResult.guest.fullName} · RSVP: {scanResult.guest.rsvp?.status || 'pending'}
                  {scanResult.guest.checkIn?.checkedInAt && (
                    <span> · Checked in at {new Date(scanResult.guest.checkIn.checkedInAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Camera section */}
        <div style={{ background: P.surface, border: `1px solid ${cameraActive ? P.blue + '66' : P.border}`, borderRadius: 14, padding: 20, marginBottom: 16, transition: 'border-color 0.2s', animation: cameraActive ? 'pulse 2s infinite' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: P.text, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: P.blue }}>{icons.camera}</span> Camera Scanner
            </p>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
              background: camStatus.glow, color: camStatus.color,
              border: `1px solid ${camStatus.color}33`,
              transition: 'all 0.3s',
            }}>
              <span style={{ display: 'flex' }}>{camStatus.icon}</span>
              {camStatus.label}
            </span>
          </div>

          {cameraError && (
            <div style={{ background: P.redGlow, color: P.red, border: `1px solid ${P.red}33`, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              {icons.warning} {cameraError}
            </div>
          )}

          <div id="qr-reader-div" ref={scannerRef} style={{ width: '100%', display: cameraActive ? 'block' : 'none', marginBottom: 12, borderRadius: 8, overflow: 'hidden' }} />

          {!cameraActive ? (
            <button
              onClick={startCamera}
              style={{ width: '100%', padding: '12px', background: P.blue, color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {icons.camera} Start Camera
            </button>
          ) : (
            <button
              onClick={stopCamera}
              style={{ width: '100%', padding: '12px', background: P.redGlow, color: P.red, border: `1px solid ${P.red}44`, borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}
            >
              {icons.x} Stop Camera
            </button>
          )}
        </div>

        {/* Manual / physical scanner */}
        <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: P.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: P.teal }}>{icons.keyboard}</span> Manual / Physical Scanner
          </p>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: P.sub }}>
            If you have a USB/Bluetooth QR scanner, it types the code here automatically. Press Enter or click Check In.
          </p>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 10 }}>
            <input
              ref={manualRef}
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="Scan or type QR code…"
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 9,
                border: `1px solid ${P.border}`, background: P.hover,
                color: P.text, fontSize: 14, outline: 'none',
                fontFamily: 'monospace', transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = P.blue}
              onBlur={e => e.target.style.borderColor = P.border}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !manualCode.trim()}
              style={{
                padding: '10px 20px', background: (loading || !manualCode.trim()) ? P.muted : P.blue,
                color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600,
                cursor: (loading || !manualCode.trim()) ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                transition: 'background 0.15s',
              }}
            >
              {loading
                ? <><span style={{ display: 'inline-block', width: 14, height: 14, border: `2px solid rgba(255,255,255,0.3)`, borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Checking…</>
                : <>{icons.checkCircle} Check In</>
              }
            </button>
          </form>
        </div>

        {/* Recent check-ins */}
        {history.length > 0 && (
          <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 14, padding: 20 }}>
            <p style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: P.text, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: P.green }}>{icons.check}</span> Recent Check-ins
            </p>
            {history.map((item, i) => (
              <div
                key={item.key}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: i < history.length - 1 ? `1px solid ${P.borderSub}` : 'none',
                  animation: `cardIn 0.28s ease ${i === 0 ? '0s' : `${i * 0.04}s`} both`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: P.green, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: P.text }}>{item.name}</span>
                </div>
                <span style={{ fontSize: 12, color: P.muted }}>{item.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
