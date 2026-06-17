import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchVendors, submitVendorRequest } from '../../services/serviceBrowseVendors';
import { P, icons, GlassPanel } from '../../components/componentTheme';

// ── Request modal ─────────────────────────────────────────────────────────────

function SourcingRequestModal({ vendor, eventId, organizerId, onClose }) {
  const [items, setItems] = useState(
    (vendor.pricingList || []).map(p => ({ itemName: p.itemName, quantity: '', unit: p.unit, notes: '' }))
  );
  const [deliveryDate,   setDeliveryDate]   = useState('');
  const [venueName,      setVenueName]      = useState('');
  const [address,        setAddress]        = useState('');
  const [contactName,    setContactName]    = useState('');
  const [contactEmail,   setContactEmail]   = useState('');
  const [contactPhone,   setContactPhone]   = useState('');
  const [error,          setError]          = useState('');
  const [submitting,     setSubmitting]     = useState(false);
  const [submitted,      setSubmitted]      = useState(false);

  const updateItem = (i, field, val) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it));

  async function handleSubmit() {
    if (!deliveryDate || !venueName || !address || !contactName || !contactEmail || !contactPhone) {
      setError('Please fill in all required fields.'); return;
    }
    const filled = items.filter(i => i.itemName.trim() && i.quantity);
    if (!filled.length) { setError('Add at least one item with a name and quantity.'); return; }

    setSubmitting(true);
    const payload = {
      eventId,
      organizerId,
      vendorId: vendor._id,
      requestedItems: filled.map(i => ({ ...i, quantity: Number(i.quantity), notes: i.notes.trim() || null })),
      deliveryDate: new Date(deliveryDate).toISOString(),
      deliveryLocation: { venueName, address },
      organizerContactSnapshot: { name: contactName, email: contactEmail, phone: contactPhone },
    };
    try {
      await submitVendorRequest(payload);
      setSubmitted(true);
    } catch {
      setError('Failed to send request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inp = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: `1px solid ${P.border}`, background: 'rgba(30,30,41,0.8)',
    fontSize: 13, color: P.text, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit', transition: 'border-color 0.15s',
  };

  const Label = ({ text, required, optional }) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: P.muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {text}
      {required && <span style={{ color: P.red, marginLeft: 2 }}>*</span>}
      {optional && <span style={{ color: P.muted, fontWeight: 400, marginLeft: 4, textTransform: 'none' }}>(optional)</span>}
    </div>
  );

  const SectionLabel = ({ children }) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.09em', margin: '18px 0 10px', paddingTop: 14, borderTop: `1px solid ${P.borderSub}` }}>
      {children}
    </div>
  );

  return createPortal(
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(10,10,20,0.75)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        zIndex: 2000, padding: 'max(24px, 4vh) 16px',
        overflowY: 'auto',
        animation: 'fadeIn 0.18s ease both',
      }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
        background: 'rgba(14,14,22,0.96)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${P.border}`,
        borderRadius: 16, width: '100%', maxWidth: 540,
        maxHeight: 'none', margin: 'auto 0',
        boxShadow: '0 24px 72px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)',
        animation: 'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${P.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: P.text, fontFamily: 'var(--font-display)' }}>Sourcing Request</div>
            <div style={{ fontSize: 13, color: P.sub, marginTop: 3 }}>{vendor.companyName}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: `1px solid ${P.border}`, cursor: 'pointer', color: P.muted, width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = P.sub; e.currentTarget.style.color = P.text; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.muted; }}
          >
            {icons.x}
          </button>
        </div>

        {submitted ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ color: P.teal, display: 'flex', justifyContent: 'center', transform: 'scale(1.6)', marginBottom: 20 }}>{icons.checkCircle}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: P.text, marginBottom: 8, fontFamily: 'var(--font-display)' }}>Request Sent!</div>
            <div style={{ fontSize: 13, color: P.sub, lineHeight: 1.6 }}>
              Your sourcing request has been submitted to {vendor.companyName}. They&apos;ll review and respond shortly.
            </div>
            <button
              onClick={onClose}
              style={{ marginTop: 24, padding: '9px 28px', borderRadius: 9, border: 'none', background: `linear-gradient(135deg, ${P.blue} 0%, ${P.teal} 100%)`, color: '#0a0a12', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Done
            </button>
          </div>
        ) : (
          <div style={{ padding: '6px 24px 24px' }}>
            {/* Items */}
            <SectionLabel>Requested Items</SectionLabel>
            {items.map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${P.borderSub}`, borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 2 }}>
                    <Label text="Item name" required />
                    <input style={inp} placeholder="e.g. Open buffet" value={item.itemName} onChange={e => updateItem(i, 'itemName', e.target.value)}
                      onFocus={e => e.target.style.borderColor = P.blue} onBlur={e => e.target.style.borderColor = P.border} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Label text="Qty" required />
                    <input style={inp} placeholder="0" type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
                      onFocus={e => e.target.style.borderColor = P.blue} onBlur={e => e.target.style.borderColor = P.border} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Label text="Unit" required />
                    <input style={inp} placeholder="person" value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}
                      onFocus={e => e.target.style.borderColor = P.blue} onBlur={e => e.target.style.borderColor = P.border} />
                  </div>
                </div>
                <Label text="Notes" optional />
                <input style={inp} placeholder="Any special instructions..." value={item.notes} onChange={e => updateItem(i, 'notes', e.target.value)}
                  onFocus={e => e.target.style.borderColor = P.blue} onBlur={e => e.target.style.borderColor = P.border} />
              </div>
            ))}
            <button
              onClick={() => setItems(prev => [...prev, { itemName: '', quantity: '', unit: '', notes: '' }])}
              style={{ width: '100%', padding: 8, borderRadius: 8, border: `1px dashed ${P.border}`, background: 'none', color: P.blue, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = P.blue + '99'}
              onMouseLeave={e => e.currentTarget.style.borderColor = P.border}
            >
              {icons.plus} Add item
            </button>

            {/* Delivery */}
            <SectionLabel>Delivery Details</SectionLabel>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <Label text="Venue name" required />
                <input style={inp} placeholder="e.g. Nile Garden Hall" value={venueName} onChange={e => setVenueName(e.target.value)}
                  onFocus={e => e.target.style.borderColor = P.blue} onBlur={e => e.target.style.borderColor = P.border} />
              </div>
              <div style={{ flex: 1 }}>
                <Label text="Delivery date" required />
                <input style={{ ...inp, colorScheme: 'dark' }} type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                  onFocus={e => e.target.style.borderColor = P.blue} onBlur={e => e.target.style.borderColor = P.border} />
              </div>
            </div>
            <Label text="Delivery address" required />
            <input style={{ ...inp, marginBottom: 0 }} placeholder="e.g. Corniche El Maadi" value={address} onChange={e => setAddress(e.target.value)}
              onFocus={e => e.target.style.borderColor = P.blue} onBlur={e => e.target.style.borderColor = P.border} />

            {/* Contact */}
            <SectionLabel>Your Contact</SectionLabel>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <Label text="Full name" required />
                <input style={inp} placeholder="Your name" value={contactName} onChange={e => setContactName(e.target.value)}
                  onFocus={e => e.target.style.borderColor = P.blue} onBlur={e => e.target.style.borderColor = P.border} />
              </div>
              <div style={{ flex: 1 }}>
                <Label text="Phone" required />
                <input style={inp} placeholder="+20..." value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                  onFocus={e => e.target.style.borderColor = P.blue} onBlur={e => e.target.style.borderColor = P.border} />
              </div>
            </div>
            <Label text="Email" required />
            <input style={{ ...inp, marginBottom: 0 }} placeholder="you@example.com" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
              onFocus={e => e.target.style.borderColor = P.blue} onBlur={e => e.target.style.borderColor = P.border} />

            {error && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: `1px solid ${P.red}33`, borderRadius: 8, fontSize: 13, color: P.red, display: 'flex', alignItems: 'center', gap: 8 }}>
                {icons.warning} {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
              <button
                onClick={onClose}
                style={{ padding: '9px 20px', borderRadius: 9, border: `1px solid ${P.border}`, background: 'transparent', fontSize: 13, fontWeight: 600, color: P.sub, cursor: 'pointer', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = P.sub}
                onMouseLeave={e => e.currentTarget.style.borderColor = P.border}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: '9px 24px', borderRadius: 9, border: 'none',
                  background: submitting ? P.hover : `linear-gradient(135deg, ${P.blue} 0%, ${P.teal} 100%)`,
                  color: submitting ? P.muted : '#0a0a12',
                  fontSize: 13, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', transition: 'opacity 0.15s',
                }}
              >
                {submitting ? 'Sending…' : 'Send Request'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TabVendorSourcing({ eventId, organizerId }) {
  const [vendors,        setVendors]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [query,          setQuery]          = useState('');
  const [selectedVendor, setSelectedVendor] = useState(null);

  useEffect(() => {
    fetchVendors()
      .then(data => { setVendors(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = vendors.filter(v => {
    const q = query.toLowerCase();
    return (
      (v.companyName || '').toLowerCase().includes(q) ||
      (v.suppliesOffered || []).some(s => s.toLowerCase().includes(q)) ||
      (v.mainLocation?.area  || '').toLowerCase().includes(q) ||
      (v.mainLocation?.city  || '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: P.sub }}>
        Browse vendors and send a sourcing request for this event.
      </p>

      {/* Search */}
      <div style={{ marginBottom: 20, maxWidth: 380, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: P.muted, display: 'flex', pointerEvents: 'none' }}>
          {icons.search}
        </span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search vendors, supply, or location…"
          style={{
            width: '100%', padding: '10px 14px 10px 38px', borderRadius: 9,
            border: `1px solid ${P.border}`, background: 'rgba(30,30,41,0.7)',
            fontSize: 13, color: P.text, outline: 'none', boxSizing: 'border-box',
            fontFamily: 'inherit', transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = P.blue}
          onBlur={e => e.target.style.borderColor = P.border}
        />
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 220, background: P.surface, border: `1px solid ${P.border}`, borderRadius: 12, animation: `skpulse 1.4s infinite ${i * 0.1}s` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <GlassPanel style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div style={{ color: P.muted, display: 'flex', justifyContent: 'center', transform: 'scale(1.5)', marginBottom: 14 }}>{icons.search}</div>
          <p style={{ color: P.sub, fontSize: 14, margin: 0 }}>No vendors match your search.</p>
        </GlassPanel>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map((vendor, i) => (
            <div
              key={vendor._id}
              style={{
                background: 'rgba(19,19,30,0.72)',
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${P.border}`,
                borderRadius: 12, padding: 18,
                display: 'flex', flexDirection: 'column',
                animation: `cardIn 0.3s ease ${i * 0.06}s both`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = P.indigo + '55'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = P.border; }}
            >
              {/* Vendor header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: P.text, fontFamily: 'var(--font-display)' }}>
                  {vendor.companyName}
                </h3>
                <span style={{
                  display: 'inline-block', padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                  background: vendor.isActive ? 'rgba(62,207,184,0.12)' : 'rgba(239,68,68,0.1)',
                  color: vendor.isActive ? P.teal : P.red,
                  border: `1px solid ${vendor.isActive ? P.teal + '33' : P.red + '33'}`,
                }}>
                  {vendor.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Location */}
              <div style={{ fontSize: 12, color: P.sub, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: P.muted, display: 'flex' }}>{icons.mapPin}</span>
                {vendor.mainLocation?.area && vendor.mainLocation?.city
                  ? `${vendor.mainLocation.area}, ${vendor.mainLocation.city}`
                  : vendor.mainLocation?.city || 'Location TBD'}
              </div>

              {/* Supplies */}
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                {(vendor.suppliesOffered || []).map(supply => (
                  <span key={supply} style={{
                    fontSize: 11, fontWeight: 600, color: P.blue,
                    background: P.blueGlow, padding: '2px 9px', borderRadius: 99,
                    border: `1px solid ${P.blue}22`,
                  }}>
                    {supply}
                  </span>
                ))}
              </div>

              {/* Pricing */}
              <div style={{ borderTop: `1px solid ${P.borderSub}`, paddingTop: 10, flex: 1, marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 7 }}>Pricing</div>
                {(vendor.pricingList || []).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: P.sub, marginBottom: 4 }}>
                    <span style={{ color: P.text }}>{item.itemName} <span style={{ color: P.muted, fontWeight: 400 }}>({item.unit})</span></span>
                    <span style={{ fontWeight: 700, color: P.text }}>{item.price} <span style={{ color: P.muted }}>{item.currency}</span></span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => vendor.isActive && setSelectedVendor(vendor)}
                style={{
                  width: '100%', padding: '9px 0', borderRadius: 9,
                  border: `1px solid ${vendor.isActive ? P.blue + '55' : P.border}`,
                  background: vendor.isActive ? P.blueGlow : 'transparent',
                  color: vendor.isActive ? P.blue : P.muted,
                  fontSize: 13, fontWeight: 700,
                  cursor: vendor.isActive ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (vendor.isActive) { e.currentTarget.style.background = P.blue; e.currentTarget.style.color = '#0a0a12'; } }}
                onMouseLeave={e => { if (vendor.isActive) { e.currentTarget.style.background = P.blueGlow; e.currentTarget.style.color = P.blue; } }}
              >
                {vendor.isActive ? 'Send Sourcing Request' : 'Vendor Unavailable'}
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedVendor && (
        <SourcingRequestModal
          vendor={selectedVendor}
          eventId={eventId}
          organizerId={organizerId}
          onClose={() => setSelectedVendor(null)}
        />
      )}
    </div>
  );
}
