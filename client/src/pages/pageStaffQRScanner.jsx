import { useEffect, useRef, useState } from 'react';
import { checkInByQR } from '../services/serviceGuest';

export default function StaffQRScanner() {
  const [scanResult, setScanResult]         = useState(null); // { message, alreadyCheckedIn, guest }
  const [manualCode, setManualCode]         = useState('');
  const [loading, setLoading]               = useState(false);
  const [cameraActive, setCameraActive]     = useState(false);
  const [cameraError, setCameraError]       = useState(null);
  const [history, setHistory]               = useState([]); // recent check-ins
  const scannerRef = useRef(null);
  const scannerInstance = useRef(null);
  const manualRef = useRef(null);

  // Auto-focus manual input for physical QR scanners
  useEffect(() => {
    manualRef.current?.focus();
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

  const handleManualSubmit = (e) => {
    e.preventDefault();
    processCode(manualCode);
  };

// Camera scanner using html5-qrcode
  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      scannerInstance.current = new Html5Qrcode('qr-reader-div');

      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      const onScanSuccess = (decodedText) => {
        processCode(decodedText);
        stopCamera(); // stop after successful scan
      };
      const onScanFailure = () => {}; // ignore scan errors (happens every frame it doesn't see a QR)

      try {
        // Attempt 1: Try to prioritize the rear camera (great for mobile)
        await scannerInstance.current.start(
          { facingMode: 'environment' }, 
          config, 
          onScanSuccess, 
          onScanFailure
        );
      } catch (err) {
        // Attempt 2: If rear camera is unavailable (OverconstrainedError on desktop), fallback to default webcam
        console.warn("Rear camera not found, falling back to front/default camera.", err);
        await scannerInstance.current.start(
          { facingMode: 'user' }, 
          config, 
          onScanSuccess, 
          onScanFailure
        );
      }
    } catch (e) {
      // This will catch real errors, like the user denying camera permissions (NotAllowedError)
      setCameraError('Could not start camera: ' + (e.message || e));
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerInstance.current) {
      try {
        await scannerInstance.current.stop();
      } catch (err) {
        console.error('Failed to stop scanner:', err);
      }
      scannerInstance.current = null;
    }
    setCameraActive(false);
    manualRef.current?.focus();
  };

  useEffect(() => {
    return () => { if (scannerInstance.current) scannerInstance.current.stop().catch(() => {}); };
  }, []);

  const resultBg    = scanResult?.alreadyCheckedIn ? '#FFF7ED' : scanResult?.error ? '#FEF2F2' : '#F0FDF4';
  const resultColor = scanResult?.alreadyCheckedIn ? '#C2410C'  : scanResult?.error ? '#991B1B'  : '#166534';
  const resultIcon  = scanResult?.alreadyCheckedIn ? '⚠️' : scanResult?.error ? '✗' : '✓';

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Nav */}
      <div style={{ background: '#0F172A', padding: '0 24px', display: 'flex', alignItems: 'center', height: 60, gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 14 }}>⚙</span>
          </div>
          <span style={{ color: '#F8FAFC', fontSize: 15, fontWeight: 700 }}>PopEyez</span>
        </div>
        <span style={{ color: '#475569', fontSize: 13 }}>/ QR Check-in Scanner</span>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#0F172A' }}>QR Check-in</h1>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: '#64748B' }}>
          Scan a guest's QR code to check them in instantly.
        </p>

        {/* Result banner */}
        {scanResult && (
          <div style={{
            background: resultBg,
            border: `1px solid ${resultColor}44`,
            borderRadius: 12,
            padding: '18px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}>
            <span style={{ fontSize: 28 }}>{resultIcon}</span>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: resultColor }}>{scanResult.message}</p>
              {scanResult.guest && (
                <p style={{ margin: '4px 0 0', fontSize: 13, color: resultColor + 'cc' }}>
                  {scanResult.guest.fullName} · RSVP: {scanResult.guest.rsvp?.status || 'pending'}
                  {scanResult.guest.checkIn?.checkedInAt && (
                    <span> · Checked in at {new Date(scanResult.guest.checkIn.checkedInAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Camera Section */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, marginBottom: 16 }}>
          <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>📷 Camera Scanner</p>

          {cameraError && (
            <div style={{ background: '#FEF2F2', color: '#991B1B', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
              {cameraError}
            </div>
          )}

          {/* html5-qrcode renders into this div */}
          <div
            id="qr-reader-div"
            ref={scannerRef}
            style={{ width: '100%', display: cameraActive ? 'block' : 'none', marginBottom: 12 }}
          />

          {!cameraActive ? (
            <button
              onClick={startCamera}
              style={{ width: '100%', padding: '12px', background: '#0F172A', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Start Camera
            </button>
          ) : (
            <button
              onClick={stopCamera}
              style={{ width: '100%', padding: '12px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Stop Camera
            </button>
          )}
        </div>

        {/* Manual / physical scanner input */}
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>⌨️ Manual / Physical Scanner</p>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: '#64748B' }}>
            If you have a USB/Bluetooth QR scanner, it types the code here automatically. Press Enter or click Check In.
          </p>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 10 }}>
            <input
              ref={manualRef}
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="Scan or type QR code…"
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #E2E8F0',
                fontSize: 14,
                outline: 'none',
                fontFamily: 'monospace',
              }}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !manualCode.trim()}
              style={{
                padding: '10px 20px',
                background: loading ? '#94A3B8' : '#0F172A',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
              }}
            >
              {loading ? '…' : 'Check In'}
            </button>
          </form>
        </div>

        {/* Recent check-ins */}
        {history.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 20 }}>
            <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Recent Check-ins</p>
            {history.map(item => (
              <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{item.name}</span>
                </div>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>{item.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}