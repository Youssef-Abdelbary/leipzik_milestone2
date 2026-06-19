import { useState, useEffect } from 'react';
import { fetchInvoices, createInvoice, uploadSupportingDocument } from '../../services/serviceInvoices';
import { fetchMyVendorOrders } from '../../services/serviceBrowseVendors';
import { getUserIdFromToken } from '../../utils/apiFetch';
import { P, icons, GlassPanel } from '../../components/componentTheme';
import { OpalSelect } from '../../components/componentMenus';

const STATUS_META = {
  pending_review: { bg: 'rgba(245,166,35,0.14)',  color: '#f5a623', label: 'Pending Review' },
  approved:       { bg: 'rgba(129,140,248,0.14)', color: '#818cf8', label: 'Approved'       },
  paid:           { bg: 'rgba(62,207,184,0.14)',  color: '#3ecfb8', label: 'Paid'            },
  rejected:       { bg: 'rgba(244,96,122,0.14)',  color: '#f4607a', label: 'Rejected'        },
};

function orderLabel(order) {
  const event = order.eventId;
  const title = event?.title || 'Event';
  const date = order.deliveryDate
    ? new Date(order.deliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  return date ? `${title} · ${date}` : title;
}

function InvoiceCard({ invoice, onUpload, index }) {
  const meta = STATUS_META[invoice.status] || STATUS_META.pending_review;

  return (
    <div
      className="vd-card"
      style={{
        background: 'rgba(19,19,30,0.72)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
        border: `1px solid ${P.border}`, borderRadius: 14, padding: 20,
        animation: `cardIn 0.32s ease ${index * 0.06}s both`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: P.text, fontFamily: 'var(--font-display)' }}>{invoice.invoiceNumber}</div>
          <div style={{ fontSize: 12, color: P.muted, marginTop: 3 }}>
            {new Date(invoice.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: meta.bg, color: meta.color }}>
          {meta.label}
        </span>
      </div>

      <div style={{ borderTop: `1px solid ${P.borderSub}`, borderBottom: `1px solid ${P.borderSub}`, padding: '10px 0', marginBottom: 12 }}>
        {(invoice.items || []).map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: P.sub, marginBottom: 4 }}>
            <span style={{ color: P.text }}>{item.description} <span style={{ color: P.muted }}>×{item.quantity}</span></span>
            <span style={{ fontWeight: 600, color: P.text }}>{item.total} {invoice.currency}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: P.text, marginBottom: 14 }}>
        <span>Total</span>
        <span style={{ color: P.blue }}>{invoice.totalAmount} {invoice.currency}</span>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Supporting Documents</div>
        {(invoice.supportingDocuments || []).length === 0 ? (
          <div style={{ fontSize: 12, color: P.muted }}>None attached.</div>
        ) : (
          invoice.supportingDocuments.map((doc, idx) => (
            <a key={idx} href={doc.url} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: 13, color: P.blue, marginBottom: 2, textDecoration: 'none' }}>
              {doc.fileName}
            </a>
          ))
        )}
      </div>

      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, border: `1px solid ${P.border}`, background: 'rgba(255,255,255,0.04)', color: P.sub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
        {icons.plus} Attach document
        <input
          type="file"
          style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) { onUpload(invoice._id, file); e.target.value = ''; }
          }}
        />
      </label>
    </div>
  );
}

function CreateInvoiceForm({ orders, vendorId, onCreate }) {
  const [open, setOpen]               = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [invoiceNumber, setInvoiceNumber]     = useState('');
  const [items, setItems]             = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [error, setError]             = useState('');
  const [submitting, setSubmitting]   = useState(false);

  const selectedOrder = orders.find(o => o._id === selectedOrderId);

  const orderOptions = orders.map((order) => ({
    value: order._id,
    label: orderLabel(order),
  }));

  const inp = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: `1px solid ${P.border}`, background: 'rgba(30,30,41,0.8)',
    fontSize: 13, color: P.text, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: field === 'description' ? value : Number(value) } : it));
  };

  async function submit() {
    setError('');
    if (!selectedOrderId) { setError('Select an accepted order to link this invoice to an event.'); return; }
    if (!invoiceNumber.trim()) { setError('Invoice number is required.'); return; }
    if (items.some(it => !it.description.trim())) { setError('All line items need a description.'); return; }

    setSubmitting(true);
    try {
      await onCreate({
        vendorId,
        vendorRequestId: selectedOrderId,
        organizerEmail: selectedOrder?.organizerContactSnapshot?.email || undefined,
        invoiceNumber: invoiceNumber.trim(),
        items,
      });
      setSelectedOrderId('');
      setInvoiceNumber('');
      setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
      setOpen(false);
    } catch (err) {
      setError(err.message || 'Failed to submit invoice.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={orders.length === 0}
        style={{
          marginBottom: 20, padding: '10px 20px', borderRadius: 9, border: 'none',
          background: orders.length ? `linear-gradient(135deg, ${P.blue} 0%, ${P.teal} 100%)` : P.hover,
          color: orders.length ? '#0a0a12' : P.muted,
          fontWeight: 700, fontSize: 13, cursor: orders.length ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        <span style={{ display: 'flex', flexShrink: 0, lineHeight: 0 }}>{icons.plus}</span>
        New Invoice
      </button>
    );
  }

  return (
    <GlassPanel style={{ padding: 22, marginBottom: 20, animation: 'cardIn 0.3s ease both' }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: P.text, marginBottom: 16, fontFamily: 'var(--font-display)' }}>New Invoice</div>

      <div style={{ fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        Link to accepted order <span style={{ color: P.red }}>*</span>
      </div>
      <p style={{ margin: '0 0 8px', fontSize: 12, color: P.sub, lineHeight: 1.5 }}>
        Pick the order this invoice belongs to — the event is resolved automatically, no Event ID needed.
      </p>
      <OpalSelect
        value={selectedOrderId}
        onChange={setSelectedOrderId}
        options={orderOptions}
        placeholder="Select an accepted order…"
        accent="violet"
        style={{ marginBottom: 16 }}
      />

      {selectedOrder && (
        <div style={{ padding: '10px 14px', background: P.blueGlow, border: `1px solid ${P.blue}33`, borderRadius: 8, marginBottom: 16, fontSize: 12, color: P.sub }}>
          <span style={{ color: P.blue, fontWeight: 700 }}>Event:</span> {selectedOrder.eventId?.title || 'Linked via order'}
          {selectedOrder.deliveryLocation?.venueName && (
            <span> · <span style={{ color: P.muted }}>Venue:</span> {selectedOrder.deliveryLocation.venueName}</span>
          )}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Invoice number <span style={{ color: P.red }}>*</span>
        </div>
        <input style={inp} value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="e.g. INV-2026-0042" />
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Line items</div>
      {items.map((item, idx) => (
        <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <input style={{ ...inp, flex: '2 1 180px' }} value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Description" />
          <input style={{ ...inp, flex: '0 0 72px' }} type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} placeholder="Qty" />
          <input style={{ ...inp, flex: '0 0 100px' }} type="number" min="0" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} placeholder="Unit price" />
        </div>
      ))}
      <button
        onClick={() => setItems(prev => [...prev, { description: '', quantity: 1, unitPrice: 0 }])}
        style={{ padding: '7px 14px', borderRadius: 8, border: `1px dashed ${P.border}`, background: 'none', color: P.blue, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16 }}
      >
        + Add item
      </button>

      {error && (
        <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: `1px solid ${P.red}33`, borderRadius: 8, fontSize: 13, color: P.red }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button onClick={() => setOpen(false)} style={{ padding: '9px 18px', borderRadius: 9, border: `1px solid ${P.border}`, background: 'transparent', color: P.sub, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={submitting}
          style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: submitting ? P.hover : `linear-gradient(135deg, ${P.blue} 0%, ${P.teal} 100%)`, color: submitting ? P.muted : '#0a0a12', fontWeight: 700, fontSize: 13, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
        >
          {submitting ? 'Submitting…' : 'Submit Invoice'}
        </button>
      </div>
    </GlassPanel>
  );
}

export default function TabVendorInvoicesSelf() {
  const vendorId = getUserIdFromToken();
  const [invoices, setInvoices] = useState([]);
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!vendorId) {
      setError('Please log in as a vendor.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [invRes, ordRes] = await Promise.all([
        fetchInvoices(vendorId),
        fetchMyVendorOrders(),
      ]);
      setInvoices(invRes.data || []);
      setOrders(ordRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(payload) {
    await createInvoice(payload);
    await load();
  }

  async function handleUpload(invoiceId, file) {
    try {
      const res = await uploadSupportingDocument(invoiceId, file);
      setInvoices(prev => prev.map(inv => inv._id === invoiceId ? res.data : inv));
    } catch (err) {
      alert(err.message || 'Upload failed.');
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 800 }}>
        {[1, 2].map(i => (
          <div key={i} style={{ height: 120, background: P.surface, border: `1px solid ${P.border}`, borderRadius: 14, animation: `skpulse 1.4s infinite ${i * 0.12}s` }} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <GlassPanel style={{ padding: 32, textAlign: 'center' }}>
        <p style={{ color: P.red, marginBottom: 16 }}>{error}</p>
        <button onClick={load} style={{ padding: '9px 22px', background: P.blueGlow, border: `1px solid ${P.blue}55`, color: P.blue, borderRadius: 9, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit', fontSize: 13 }}>Retry</button>
      </GlassPanel>
    );
  }

  return (
    <div>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: P.sub }}>
        Submit invoices linked to your accepted orders. Organizers review them under the event&apos;s Vendors → Invoices tab.
      </p>

      {orders.length === 0 && (
        <GlassPanel style={{ padding: '16px 18px', marginBottom: 16, border: `1px solid ${P.amber}33`, background: 'rgba(245,166,35,0.08)' }}>
          <p style={{ margin: 0, fontSize: 13, color: P.amber }}>
            You need at least one accepted order before you can submit an invoice. Check <strong style={{ color: P.text }}>Incoming Requests</strong> or <strong style={{ color: P.text }}>My Orders</strong>.
          </p>
        </GlassPanel>
      )}

      <CreateInvoiceForm orders={orders} vendorId={vendorId} onCreate={handleCreate} />

      {invoices.length === 0 ? (
        <GlassPanel style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ color: P.muted, display: 'flex', justifyContent: 'center', transform: 'scale(1.5)', marginBottom: 14 }}>{icons.clipboard}</div>
          <p style={{ color: P.sub, fontSize: 14, margin: 0 }}>No invoices submitted yet.</p>
        </GlassPanel>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 800 }}>
          {invoices.map((inv, i) => (
            <InvoiceCard key={inv._id} invoice={inv} onUpload={handleUpload} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
