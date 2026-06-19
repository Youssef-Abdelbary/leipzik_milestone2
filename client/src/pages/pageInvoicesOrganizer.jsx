import React, { useState, useEffect } from "react";
import { fetchInvoices, reviewInvoice, getUserIdFromToken } from "../services/serviceInvoices";
import { GlassPanel, icons, P } from "../components/componentTheme";
import "../components/componentTheme.css";
import "./tabs/workspaceTabShell.css";
import "./pageInvoicesOrganizer.css";

const STATUS_STYLES = {
  pending_review: { bg: "rgba(245,179,74,0.14)", text: P.amber, border: "rgba(245,179,74,0.28)" },
  approved: { bg: "rgba(59,130,246,0.14)", text: P.blue, border: "rgba(59,130,246,0.28)" },
  paid: { bg: "rgba(34,197,94,0.14)", text: "#4ade80", border: "rgba(34,197,94,0.28)" },
  rejected: { bg: "rgba(255,92,102,0.14)", text: P.red, border: "rgba(255,92,102,0.28)" },
};

export default function OrganizerInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const organizerId = getUserIdFromToken();
    if (!organizerId) {
      setLoading(false);
      return;
    }

    fetchInvoices(organizerId)
      .then((data) => {
        setInvoices(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleReview = (invoiceId, status) => {
    setInvoices((prev) =>
      prev.map((inv) => (inv._id === invoiceId ? { ...inv, status } : inv))
    );
    reviewInvoice(invoiceId, status).catch(() => {});
  };

  return (
    <div className="workspace-tab-shell organizer-invoices-page">
      <div className="organizer-invoices-header">
        <div>
          <h1>{icons.budget} Invoices</h1>
          <p>Review invoices submitted by your vendors.</p>
        </div>
      </div>

      {loading ? (
        <GlassPanel className="organizer-invoices-state">
          <p>Loading invoices...</p>
        </GlassPanel>
      ) : invoices.length === 0 ? (
        <GlassPanel className="organizer-invoices-state">
          <p>No invoices yet.</p>
        </GlassPanel>
      ) : (
        <div className="organizer-invoices-list">
          {invoices.map((inv) => (
            <InvoiceCard key={inv._id} invoice={inv} onReview={handleReview} />
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceCard({ invoice, onReview }) {
  const statusStyle = STATUS_STYLES[invoice.status] || STATUS_STYLES.pending_review;

  return (
    <GlassPanel className="organizer-invoice-card">
      <div className="organizer-invoice-card-top">
        <div>
          <div className="organizer-invoice-number">{invoice.invoiceNumber}</div>
          <div className="organizer-invoice-meta">
            {new Date(invoice.createdAt).toLocaleDateString()}
          </div>
        </div>
        <span
          className="organizer-invoice-status"
          style={{
            background: statusStyle.bg,
            color: statusStyle.text,
            border: `1px solid ${statusStyle.border}`,
          }}
        >
          {invoice.status.replace("_", " ")}
        </span>
      </div>

      <div className="organizer-invoice-items">
        {(invoice.items || []).map((item, idx) => (
          <div key={idx} className="organizer-invoice-item-row">
            <span>
              {item.description} <em>x{item.quantity}</em>
            </span>
            <strong>
              {item.total} {invoice.currency}
            </strong>
          </div>
        ))}
      </div>

      <div className="organizer-invoice-total">
        <span>Total</span>
        <strong>
          {invoice.totalAmount} {invoice.currency}
        </strong>
      </div>

      {invoice.status === "pending_review" && (
        <div className="organizer-invoice-actions">
          <button type="button" className="approve" onClick={() => onReview(invoice._id, "approved")}>
            {icons.check} Approve
          </button>
          <button type="button" className="reject" onClick={() => onReview(invoice._id, "rejected")}>
            {icons.x} Reject
          </button>
        </div>
      )}
    </GlassPanel>
  );
}
