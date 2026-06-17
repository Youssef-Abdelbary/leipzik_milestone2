import { useState, useEffect } from 'react';
import { fetchInvoices, reviewInvoice } from '../../services/serviceInvoices';
import { P, icons, GlassPanel } from '../../components/componentTheme';

const STATUS_META = {
  pending_review: { bg: 'rgba(245,166,35,0.14)',  color: '#f5a623', label: 'Pending Review' },
  approved:       { bg: 'rgba(129,140,248,0.14)', color: '#818cf8', label: 'Approved'       },
  paid:           { bg: 'rgba(62,207,184,0.14)',  color: '#3ecfb8', label: 'Paid'            },
  rejected:       { bg: 'rgba(244,96,122,0.14)',  color: '#f4607a', label: 'Rejected'        },
};

function InvoiceCard({ invoice, onReview, index }) {
  const meta = STATUS_META[invoice.status] || STATUS_META.pending_review;

  return (
    <GlassPanel style={{ padding: 20, animation: `cardIn 0.32s ease ${index * 0.06}s both` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: P.text }}>{invoice.invoiceNumber}</div>
          <div style={{ fontSize: 12, color: P.muted, marginTop: 3 }}>
            {new Date(invoice.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          {invoice.vendorRequestId && (
            <div style={{ fontSize: 11, color: P.muted, marginTop: 2 }}>
              Request: {typeof invoice.vendorRequestId === 'string' ? invoice.vendorRequestId.slice(-8) : invoice.vendorRequestId}
            </div>
          )}
        </div>
        <span style={{
          display: 'inline-block', padding: '3px 10px', borderRadius: 99,
          fontSize: 11, fontWeight: 700,
          background: meta.bg, color: meta.color,
          letterSpacing: '0.04em',
        }}>
          {meta.label}
        </span>
      </div>

      {/* Line items */}
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

      {/* Documents */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: P.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
          Supporting Documents
        </div>
        {(invoice.supportingDocuments || []).length === 0 ? (
          <div style={{ fontSize: 13, color: P.muted }}>None attached.</div>
        ) : (
          invoice.supportingDocuments.map((doc, idx) => (
            <div key={idx} style={{ fontSize: 13, marginBottom: 3 }}>
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                style={{ color: P.blue, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <span style={{ display: 'flex', color: P.muted }}>{icons.clipboard}</span>
                {doc.fileName}
              </a>
            </div>
          ))
        )}
      </div>

      {/* Actions */}
      {invoice.status === 'pending_review' && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onReview(invoice._id, 'approved')}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8,
              border: `1px solid ${P.teal}44`, background: 'rgba(62,207,184,0.1)',
              color: P.teal, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(62,207,184,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(62,207,184,0.1)'; }}
          >
            Approve
          </button>
          <button
            onClick={() => onReview(invoice._id, 'rejected')}
            style={{
              flex: 1, padding: '8px 0', borderRadius: 8,
              border: `1px solid ${P.red}44`, background: 'rgba(244,96,122,0.1)',
              color: P.red, fontWeight: 700, fontSize: 13, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,96,122,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,96,122,0.1)'; }}
          >
            Reject
          </button>
        </div>
      )}

      {invoice.status === 'approved' && (
        <button
          onClick={() => onReview(invoice._id, 'paid')}
          style={{
            width: '100%', padding: '9px 0', borderRadius: 8,
            border: `1px solid ${P.blue}44`, background: P.blueGlow,
            color: P.blue, fontWeight: 700, fontSize: 13, cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `rgba(139,109,255,0.25)`; }}
          onMouseLeave={e => { e.currentTarget.style.background = P.blueGlow; }}
        >
          Mark as Paid
        </button>
      )}
    </GlassPanel>
  );
}

export default function TabVendorInvoices({ eventId, organizerId }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!organizerId) return;
    setLoading(true);
    fetchInvoices(organizerId)
      .then(data => { setInvoices(data.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [organizerId]);

  const handleReview = (invoiceId, status) => {
    setInvoices(prev => prev.map(inv => inv._id === invoiceId ? { ...inv, status } : inv));
    reviewInvoice(invoiceId, status).catch(() => {});
  };

  const filteredInvoices = invoices.filter(inv => {
    const invEventId     = inv.eventId?.$oid || inv.eventId;
    const currentEventId = eventId?.$oid     || eventId;
    return String(invEventId) === String(currentEventId);
  });

  return (
    <div>
      <p style={{ margin: '0 0 20px', fontSize: 14, color: P.sub }}>
        Review invoices submitted by your vendors for this event.
      </p>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 800 }}>
          {[1, 2].map(i => (
            <div key={i} style={{ background: 'rgba(30,30,41,0.55)', border: `1px solid ${P.border}`, borderRadius: 16, height: 100, animation: `skpulse 1.4s infinite ${i * 0.12}s` }} />
          ))}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <GlassPanel style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ color: P.muted, display: 'flex', justifyContent: 'center', transform: 'scale(1.5)', marginBottom: 14 }}>{icons.clipboard}</div>
          <p style={{ color: P.sub, fontSize: 14, margin: 0 }}>No invoices found for this event.</p>
        </GlassPanel>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 800 }}>
          {filteredInvoices.map((inv, i) => (
            <InvoiceCard key={inv._id} invoice={inv} onReview={handleReview} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
