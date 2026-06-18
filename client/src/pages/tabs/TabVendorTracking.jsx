import { useState, useEffect } from 'react';
import { fetchEventVendorRequests, updateDeliveryStatus } from '../../services/serviceBrowseVendors';
import { P, icons, GlassPanel } from '../../components/componentTheme';

const DELIVERY_ORDER = ['preparing', 'out_for_delivery', 'delivered'];
const DELIVERY_LABELS = {
  preparing:        'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Delivered',
};

function deliveryBadge(status) {
  const map = {
    preparing:        { bg: 'rgba(245,166,35,0.14)',  color: P.amber  },
    out_for_delivery: { bg: 'rgba(129,140,248,0.14)', color: P.indigo },
    delivered:        { bg: 'rgba(62,207,184,0.14)',  color: P.teal   },
  };
  const s = map[status] || { bg: 'rgba(237,233,255,0.08)', color: P.muted };
  return {
    display: 'inline-block', padding: '3px 10px', borderRadius: 99,
    fontSize: 11, fontWeight: 700, background: s.bg, color: s.color,
    letterSpacing: '0.04em',
  };
}

// Minimal thread viewer — read-only
function ClarificationThread({ messages = [], currentUserId }) {
  const [open, setOpen] = useState(false);
  if (messages.length === 0) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', padding: 0,
          cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 12, fontWeight: 600,
          color: open ? P.violet : P.sub,
          transition: 'color 0.15s',
        }}
      >
        <span style={{ fontSize: 13 }}>💬</span>
        {messages.length} Clarification Message{messages.length !== 1 ? 's' : ''}
        <span style={{ fontSize: 10, marginLeft: 2, opacity: 0.7 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div style={{
          marginTop: 8,
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${P.borderSub}`,
          borderRadius: 8,
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          maxHeight: 200,
          overflowY: 'auto',
        }}>
          {messages.map((msg, idx) => {
            const isMine = currentUserId && String(msg.senderId) === String(currentUserId);
            return (
              <div
                key={msg._id || idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMine ? 'flex-end' : 'flex-start',
                }}
              >
                <div style={{
                  maxWidth: '85%',
                  background: isMine
                    ? 'rgba(139,92,246,0.18)'
                    : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${isMine ? 'rgba(139,92,246,0.3)' : P.borderSub}`,
                  borderRadius: isMine ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
                  padding: '6px 10px',
                  fontSize: 12,
                  color: P.text,
                  lineHeight: 1.45,
                  wordBreak: 'break-word',
                }}>
                  {msg.message}
                </div>
                <span style={{ fontSize: 10, color: P.muted, marginTop: 3 }}>
                  {new Date(msg.sentAt).toLocaleString([], {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TabVendorTracking({ eventId, currentUserId }) {
  const [requests,     setRequests]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [updatingId,   setUpdatingId]   = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { loadTrackingData(); }, [eventId]);

  async function loadTrackingData() {
    try {
      const data = await fetchEventVendorRequests(eventId);
      setRequests(data.data || []);
    } catch (err) {
      console.error('Failed to load tracking records:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsArrived(requestId) {
    setUpdatingId(requestId);
    try {
      await updateDeliveryStatus(requestId, {
        status: 'delivered',
        estimatedArrivalTime: new Date().toISOString(),
      });
      setRequests(prev =>
        prev.map(r => r._id === requestId
          ? { ...r, delivery: { ...r.delivery, status: 'delivered' } }
          : r
        )
      );
    } catch {
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending_delivery') {
      return r.delivery?.status === 'preparing' || r.delivery?.status === 'out_for_delivery';
    }
    return r.delivery?.status === filterStatus;
  });

  const FILTER_TABS = [
    { id: 'all',              label: 'All Vendors' },
    { id: 'pending_delivery', label: 'In Transit'  },
    { id: 'delivered',        label: 'Arrived'     },
  ];

  return (
    <div>
      <style>{`
        @keyframes cardIn  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes skpulse { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>

      {/* Header + filter */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 14, color: P.sub }}>
          Monitor logistics and confirm vendor deliveries for this event.
        </p>

        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', border: `1px solid ${P.border}`, padding: 4, borderRadius: 10 }}>
          {FILTER_TABS.map(tab => {
            const active = filterStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                style={{
                  padding: '6px 14px', border: 'none', borderRadius: 7, fontSize: 13,
                  fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  background: active ? P.surface : 'transparent',
                  color: active ? P.text : P.sub,
                  boxShadow: active ? '0 1px 4px rgba(0,0,0,0.25)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ background: 'rgba(30,30,41,0.55)', border: `1px solid ${P.border}`, borderRadius: 16, height: 200, animation: `skpulse 1.4s infinite ${i * 0.12}s` }} />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <GlassPanel style={{ padding: '48px 0', textAlign: 'center' }}>
          <div style={{ color: P.muted, display: 'flex', justifyContent: 'center', transform: 'scale(1.5)', marginBottom: 14 }}>{icons.vendors}</div>
          <p style={{ color: P.sub, fontSize: 14, margin: 0 }}>No deliveries found under this filter option.</p>
        </GlassPanel>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {filteredRequests.map((req, i) => (
            <GlassPanel
              key={req._id}
              style={{
                padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                animation: `cardIn 0.32s ease ${i * 0.06}s both`,
              }}
            >
              <div>
                {/* Vendor name + badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: P.text }}>
                      {req.vendorId?.companyName || 'Vendor Operations'}
                    </h3>
                    <div style={{ fontSize: 12, color: P.sub, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: P.muted, display: 'flex' }}>{icons.mapPin}</span>
                      {req.vendorId?.mainLocation?.area || 'Venue Site Location'}
                    </div>
                  </div>
                  <span style={deliveryBadge(req.delivery?.status || 'pending')}>
                    {req.delivery?.status
                      ? DELIVERY_LABELS[req.delivery.status] || req.delivery.status.replace(/_/g, ' ')
                      : 'No data'}
                  </span>
                </div>

                {/* Items */}
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px', marginBottom: 14, border: `1px solid ${P.borderSub}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                    Expected Items
                  </div>
                  {(req.requestedItems || []).map((item, idx) => (
                    <div key={idx} style={{ fontSize: 13, color: P.sub, marginBottom: 3, display: 'flex', justifyContent: 'space-between' }}>
                      <span>• {item.itemName}</span>
                      <span style={{ fontWeight: 600, color: P.text }}>×{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>

                {/* Delivery progress */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {DELIVERY_ORDER.map((step, idx) => {
                      const reached = req.delivery?.status
                        ? DELIVERY_ORDER.indexOf(req.delivery.status) >= idx
                        : false;
                      return (
                        <div key={step} style={{ flex: 1 }}>
                          <div style={{
                            height: 4, borderRadius: 99,
                            background: reached ? P.teal : 'rgba(255,255,255,0.08)',
                            transition: 'background 0.3s',
                          }} />
                          <div style={{ fontSize: 9, color: reached ? P.teal : P.muted, marginTop: 3, textAlign: 'center', fontWeight: 600, letterSpacing: '0.04em' }}>
                            {DELIVERY_LABELS[step].toUpperCase()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dates */}
                <div style={{ fontSize: 12, color: P.sub, marginBottom: 4, display: 'flex', gap: 6 }}>
                  <span style={{ color: P.muted }}>Target Window:</span>
                  <span style={{ fontWeight: 500, color: P.text }}>
                    {req.deliveryDate ? new Date(req.deliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
                {req.delivery?.estimatedArrivalTime && (
                  <div style={{ fontSize: 12, color: P.teal, marginBottom: 4, display: 'flex', gap: 6 }}>
                    <span style={{ color: P.muted }}>
                      {req.delivery.status === 'delivered' ? 'Confirmed at:' : 'ETA:'}
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      {new Date(req.delivery.estimatedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {/* ── Clarification thread ── */}
                <div style={{ marginTop: 12, borderTop: `1px solid ${P.borderSub}`, paddingTop: 10 }}>
                  <ClarificationThread
                    messages={req.clarificationMessages || []}
                    currentUserId={currentUserId}
                  />
                </div>
              </div>

              {/* Action */}
              <div style={{ marginTop: 14, borderTop: `1px solid ${P.borderSub}`, paddingTop: 14 }}>
                {req.delivery?.status === 'delivered' ? (
                  <div style={{ width: '100%', padding: '9px 0', borderRadius: 8, background: 'rgba(62,207,184,0.1)', color: P.teal, fontSize: 13, fontWeight: 600, textAlign: 'center', border: `1px solid ${P.teal}33` }}>
                    ✓ Delivery Onsite & Confirmed
                  </div>
                ) : (
                  <button
                    onClick={() => handleMarkAsArrived(req._id)}
                    disabled={updatingId === req._id}
                    style={{
                      width: '100%', padding: '9px 0', borderRadius: 8, border: 'none',
                      background: P.blue, color: '#fff',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'inherit', opacity: updatingId === req._id ? 0.6 : 1,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {updatingId === req._id ? 'Updating…' : 'Mark as Arrived'}
                  </button>
                )}
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  );
}