import React, { useState, useEffect } from "react";
import { fetchInvoices, reviewInvoice } from "../../services/serviceInvoices";

const STATUS_COLORS = {
  pending_review: { bg: "#FFFBEB", text: "#92400E" },
  approved:       { bg: "#EFF6FF", text: "#1D4ED8" },
  paid:           { bg: "#F0FDF4", text: "#166534" },
  rejected:       { bg: "#FEF2F2", text: "#991B1B" },
};

export default function TabVendorInvoices({ organizerId }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices(organizerId)
      .then((data) => {
        setInvoices(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [organizerId]);

  const handleReview = (invoiceId, status) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv._id === invoiceId ? { ...inv, status } : inv))
    );
    reviewInvoice(invoiceId, status).catch(() => {});
  };

  return (
    <div>
      <p style={{ margin: "0 0 20px", fontSize: 14, color: "#64748B" }}>
        Review invoices submitted by your vendors.
      </p>

      {loading ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>Loading invoices...</div>
      ) : invoices.length === 0 ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>No invoices yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 800 }}>
          {invoices.map((inv) => (
            <InvoiceCard key={inv._id} invoice={inv} onReview={handleReview} />
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceCard({ invoice, onReview }) {
  const statusStyle = STATUS_COLORS[invoice.status] || STATUS_COLORS.pending_review;

  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, boxShadow: "0 1px 6px rgba(15,23,42,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{invoice.invoiceNumber}</div>
          <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
            {new Date(invoice.createdAt).toLocaleDateString()}
          </div>
          {invoice.vendorRequestId && (
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
              Request ID: {invoice.vendorRequestId}
            </div>
          )}
        </div>
        <span style={{
          display: "inline-block", padding: "3px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
          background: statusStyle.bg, color: statusStyle.text, textTransform: "capitalize",
        }}>
          {invoice.status.replace("_", " ")}
        </span>
      </div>

      <div style={{ borderTop: "1px solid #F1F5F9", borderBottom: "1px solid #F1F5F9", padding: "10px 0", marginBottom: 10 }}>
        {(invoice.items || []).map((item, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#0F172A", marginBottom: 4 }}>
            <span>{item.description} <span style={{ color: "#94A3B8" }}>x{item.quantity}</span></span>
            <span style={{ fontWeight: 600 }}>{item.total} {invoice.currency}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>
        <span>Total</span>
        <span>{invoice.totalAmount} {invoice.currency}</span>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
          Supporting Documents
        </div>
        {(invoice.supportingDocuments || []).length === 0 ? (
          <div style={{ fontSize: 13, color: "#94A3B8" }}>None attached.</div>
        ) : (
          invoice.supportingDocuments.map((doc, idx) => (
            <div key={idx} style={{ fontSize: 13, color: "#3B82F6", marginBottom: 2 }}>
              <a href={doc.url} target="_blank" rel="noreferrer" style={{ color: "#3B82F6", textDecoration: "none" }}>
                {doc.fileName}
              </a>
            </div>
          ))
        )}
      </div>

      {invoice.status === "pending_review" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onReview(invoice._id, "approved")}
            style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #BBF7D0", background: "#F0FDF4", color: "#166534", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            Approve
          </button>
          <button
            onClick={() => onReview(invoice._id, "rejected")}
            style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #FECACA", background: "#FFF5F5", color: "#DC2626", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            Reject
          </button>
        </div>
      )}

      {invoice.status === "approved" && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onReview(invoice._id, "paid")}
            style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #BFDBFE", background: "#EFF6FF", color: "#1D4ED8", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
          >
            Mark as Paid
          </button>
        </div>
      )}
    </div>
  );
}
