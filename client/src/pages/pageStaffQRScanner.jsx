import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { checkInByQR } from "../services/serviceGuest";
import { P, icons, GlassPanel } from "../components/componentTheme";
import AppHeader from "../components/componentAppHeader";
import Dock from "../components/componentDock";
import { buildStaffDockItems } from "../utils/staffNav";
import "../components/componentTheme.css";
import "./pageStaffTasks.css";

export default function StaffQRScanner() {
  const [scanResult, setScanResult] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [history, setHistory] = useState([]);
  const [camPermission, setCamPermission] = useState("unknown");

  const scannerRef = useRef(null);
  const scannerInstance = useRef(null);
  const manualRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const loggedInUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("loggedInUser") || "null");
    } catch {
      return null;
    }
  })();
  const isOrganizer = loggedInUser?.role === "organizer";
  const returnTo = location.state?.returnTo || (isOrganizer ? "/organizer/events" : null);
  const returnLabel = location.state?.returnLabel || (isOrganizer ? "Events" : null);

  const dockItems = isOrganizer
    ? []
    : buildStaffDockItems(navigate, "qr");

  useEffect(() => {
    manualRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setCamPermission("unavailable");
      return;
    }

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "camera" })
        .then((result) => {
          setCamPermission(
            result.state === "granted"
              ? "granted"
              : result.state === "denied"
                ? "denied"
                : "unknown"
          );

          result.onchange = () => {
            setCamPermission(
              result.state === "granted"
                ? "granted"
                : result.state === "denied"
                  ? "denied"
                  : "unknown"
            );
          };
        })
        .catch(() => setCamPermission("unknown"));
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
        setHistory((prev) => [
          {
            name: data.guest?.fullName,
            time: new Date().toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            key: Date.now(),
          },
          ...prev.slice(0, 9),
        ]);
      }
    } catch (err) {
      setScanResult({
        error: true,
        message: err.message || "Invalid QR code",
      });
    } finally {
      setLoading(false);
      setManualCode("");
      manualRef.current?.focus();
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    processCode(manualCode);
  };

  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    setCamPermission("unknown");

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      scannerInstance.current = new Html5Qrcode("qr-reader-div");

      const config = {
        fps: 10,
        qrbox: {
          width: 250,
          height: 250,
        },
      };

      const onScanSuccess = (decodedText) => {
        processCode(decodedText);
        stopCamera();
      };

      const onScanFailure = () => { };

      try {
        await scannerInstance.current.start(
          { facingMode: "environment" },
          config,
          onScanSuccess,
          onScanFailure
        );
      } catch (err) {
        console.warn("Rear camera not found, falling back.", err);

        await scannerInstance.current.start(
          { facingMode: "user" },
          config,
          onScanSuccess,
          onScanFailure
        );
      }

      setCamPermission("granted");
    } catch (e) {
      const msg = e.message || String(e);
      const isDenied = /denied|not allowed|permission/i.test(msg);

      setCamPermission(isDenied ? "denied" : "unavailable");

      setCameraError(
        isDenied
          ? "Camera access was denied. Please allow camera permission in your browser settings and reload."
          : "Could not start camera: " + msg
      );

      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerInstance.current) {
      try {
        await scannerInstance.current.stop();
      } catch (err) {
        console.error(err);
      }

      scannerInstance.current = null;
    }

    setCameraActive(false);
    manualRef.current?.focus();
  };

  useEffect(() => {
    return () => {
      if (scannerInstance.current) {
        scannerInstance.current.stop().catch(() => { });
      }
    };
  }, []);

  const camStatus =
    {
      granted: {
        label: "Camera ready",
        color: P.green,
        glow: P.greenGlow,
        icon: icons.camera,
      },
      denied: {
        label: "Camera denied",
        color: P.red,
        glow: P.redGlow,
        icon: icons.videoOff,
      },
      unavailable: {
        label: "No camera detected",
        color: P.amber,
        glow: P.amberGlow,
        icon: icons.videoOff,
      },
      unknown: {
        label: "Camera status unknown",
        color: P.muted,
        glow: "transparent",
        icon: icons.camera,
      },
    }[camPermission] || {
      label: "Camera status unknown",
      color: P.muted,
      glow: "transparent",
      icon: icons.camera,
    };

  const resultAccent = scanResult?.alreadyCheckedIn
    ? P.amber
    : scanResult?.error
      ? P.red
      : P.green;

  const resultGlow = scanResult?.alreadyCheckedIn
    ? P.amberGlow
    : scanResult?.error
      ? P.redGlow
      : P.greenGlow;

  const resultIcon = scanResult?.alreadyCheckedIn
    ? icons.warning
    : scanResult?.error
      ? icons.xCircle
      : icons.checkCircle;

  const inp = {
    flex: 1,
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${P.border}`,
    background: "rgba(30,30,41,0.7)",
    color: P.text,
    fontSize: 14,
    outline: "none",
    fontFamily: "monospace",
    transition: "border-color 0.15s",
  };

  return (
    <div className="staff-workspace-page">
      <style>{`
        @keyframes pageIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 ${P.blue}55;
          }
          50% {
            box-shadow: 0 0 0 6px transparent;
          }
        }
      `}</style>

      <AppHeader
        crumb="QR Check-in"
        back={
          returnTo
            ? { label: returnLabel || "Back", onClick: () => navigate(returnTo) }
            : undefined
        }
        right={
          <div className="staff-dashboard-pill">
            {isOrganizer ? "Organizer" : "Staff Dashboard"}
          </div>
        }
      />

      <div className="staff-tab-content">
        <div
          className="staff-content-inner"
          style={{
            animation: "cardIn 0.32s ease 0.05s both",
          }}
        >
          <div style={{ marginBottom: 28 }}>
            <h1
              style={{
                margin: "0 0 6px",
                fontSize: 28,
                fontWeight: 900,
                color: P.text,
                letterSpacing: "-0.03em",
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: "var(--font-display)",
                lineHeight: 1.1,
              }}
            >
              <span
                style={{
                  color: P.teal,
                  background: P.tealGlow,
                  padding: 8,
                  borderRadius: 10,
                  display: "flex",
                }}
              >
                {icons.qr}
              </span>
              QR Check-in
            </h1>

            <p
              style={{
                margin: "0 0 0",
                fontSize: 14,
                color: P.sub,
                lineHeight: 1.5,
              }}
            >
              Scan a guest&apos;s QR code to check them in instantly.
            </p>
          </div>

          {scanResult && (
            <GlassPanel
              style={{
                border: `1px solid ${resultAccent}44`,
                padding: "18px 20px",
                marginBottom: 20,
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                animation:
                  "slideDown 0.28s cubic-bezier(0.34,1.56,0.64,1) both",
                background: resultGlow,
              }}
            >
              <span
                style={{
                  color: resultAccent,
                  display: "flex",
                  flexShrink: 0,
                  transform: "scale(1.3)",
                }}
              >
                {resultIcon}
              </span>

              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: resultAccent,
                  }}
                >
                  {scanResult.message}
                </p>

                {scanResult.guest && (
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 13,
                      color: P.sub,
                    }}
                  >
                    {scanResult.guest.fullName} · RSVP:{" "}
                    {scanResult.guest.rsvp?.status || "pending"}

                    {scanResult.guest.checkIn?.checkedInAt && (
                      <span>
                        {" "}
                        · Checked in at{" "}
                        {new Date(
                          scanResult.guest.checkIn.checkedInAt
                        ).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </GlassPanel>
          )}

          <GlassPanel
            style={{
              padding: 20,
              marginBottom: 14,
              transition: "border-color 0.2s",
              border: `1px solid ${cameraActive ? P.blue + "66" : P.border}`,
              animation: cameraActive ? "pulse 2s infinite" : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: P.text,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "var(--font-display)",
                }}
              >
                <span
                  style={{
                    color: P.blue,
                    background: P.blueGlow,
                    padding: 5,
                    borderRadius: 7,
                    display: "flex",
                  }}
                >
                  {icons.camera}
                </span>
                Camera Scanner
              </p>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 700,
                  background: camStatus.glow,
                  color: camStatus.color,
                  border: `1px solid ${camStatus.color}33`,
                  transition: "all 0.3s",
                }}
              >
                <span style={{ display: "flex" }}>{camStatus.icon}</span>
                {camStatus.label}
              </span>
            </div>

            {cameraError && (
              <div
                style={{
                  background: P.redGlow,
                  color: P.red,
                  border: `1px solid ${P.red}33`,
                  borderRadius: 9,
                  padding: "10px 14px",
                  fontSize: 13,
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {icons.warning} {cameraError}
              </div>
            )}

            <div
              id="qr-reader-div"
              ref={scannerRef}
              style={{
                width: "100%",
                display: cameraActive ? "block" : "none",
                marginBottom: 12,
                borderRadius: 10,
                overflow: "hidden",
              }}
            />

            {!cameraActive ? (
              <button
                onClick={startCamera}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: `linear-gradient(135deg, ${P.blue} 0%, ${P.teal} 100%)`,
                  color: "#0a0a0f",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "opacity 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.88";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                {icons.camera} Start Camera
              </button>
            ) : (
              <button
                onClick={stopCamera}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: P.redGlow,
                  color: P.red,
                  border: `1px solid ${P.red}44`,
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.15s",
                }}
              >
                {icons.x} Stop Camera
              </button>
            )}
          </GlassPanel>

          <GlassPanel style={{ padding: 20, marginBottom: 20 }}>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 14,
                fontWeight: 700,
                color: P.text,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "var(--font-display)",
              }}
            >
              <span
                style={{
                  color: P.cyan,
                  background: P.cyanGlow,
                  padding: 5,
                  borderRadius: 7,
                  display: "flex",
                }}
              >
                {icons.keyboard}
              </span>
              Manual / Physical Scanner
            </p>

            <p
              style={{
                margin: "0 0 14px",
                fontSize: 13,
                color: P.sub,
              }}
            >
              If you have a USB/Bluetooth QR scanner, it types the code here
              automatically. Press Enter or click Check In.
            </p>

            <form
              onSubmit={handleManualSubmit}
              style={{ display: "flex", gap: 10 }}
            >
              <input
                ref={manualRef}
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Scan or type QR code..."
                style={inp}
                onFocus={(e) => {
                  e.target.style.borderColor = P.blue;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = P.border;
                }}
                autoFocus
              />

              <button
                type="submit"
                disabled={loading || !manualCode.trim()}
                style={{
                  padding: "10px 20px",
                  background:
                    loading || !manualCode.trim()
                      ? P.hover
                      : `linear-gradient(135deg, ${P.blue} 0%, ${P.teal} 100%)`,
                  color: loading || !manualCode.trim() ? P.muted : "#0a0a0f",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor:
                    loading || !manualCode.trim() ? "not-allowed" : "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "opacity 0.15s",
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        display: "inline-block",
                        width: 14,
                        height: 14,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    Checking...
                  </>
                ) : (
                  <>
                    {icons.checkCircle} Check In
                  </>
                )}
              </button>
            </form>
          </GlassPanel>

          {history.length > 0 && (
            <GlassPanel style={{ padding: 20 }}>
              <p
                style={{
                  margin: "0 0 16px",
                  fontSize: 14,
                  fontWeight: 700,
                  color: P.text,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "var(--font-display)",
                }}
              >
                <span
                  style={{
                    color: P.teal,
                    background: P.tealGlow,
                    padding: 5,
                    borderRadius: 7,
                    display: "flex",
                  }}
                >
                  {icons.check}
                </span>
                Recent Check-ins
              </p>

              {history.map((item, i) => (
                <div
                  key={item.key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom:
                      i < history.length - 1
                        ? `1px solid ${P.borderSub}`
                        : "none",
                    animation: `cardIn 0.28s ease ${i === 0 ? "0s" : `${i * 0.04}s`
                      } both`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: P.green,
                        display: "inline-block",
                        flexShrink: 0,
                        boxShadow: `0 0 6px ${P.green}`,
                      }}
                    />

                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: P.text,
                      }}
                    >
                      {item.name}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: 12,
                      color: P.muted,
                    }}
                  >
                    {item.time}
                  </span>
                </div>
              ))}
            </GlassPanel>
          )}
        </div>
      </div>

      {dockItems.length > 0 && <Dock items={dockItems} />}
    </div>
  );
}