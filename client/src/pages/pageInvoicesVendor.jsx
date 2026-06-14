import React, { useState, useEffect } from "react";
import {
  fetchInvoices,
  createInvoice,
  uploadSupportingDocument,
} from "../services/serviceInvoices";

// TODO: replace with the actual logged-in vendor's id (e.g. from auth context)
const CURRENT_USER_ID = "665000000000000000000006";

const STATUS_COLORS = {
  pending_review: { bg: "#FFFBEB", text: "#92400E" },
  approved:       { bg: "#EFF6FF", text: "#1D4ED8" },
  paid:           { bg: "#F0FDF4", text: "#166534" },
  rejected:       { bg: "#FEF2F2", text: "#991B1B" },
};

export default function VendorInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetchInvoices(CURRENT_USER_ID)
      .then((data) => {
        setInvoices(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleUploadDocument = (invoiceId, file) => {
    uploadSupportingDocument(invoiceId, file)
      .then((data) => {
        setInvoices((prev) =>
          prev.map((inv) => (inv._id === invoiceId ? data.data : inv))
        );
      })
      .catch(() => {});
  };

  const handleCreate = (payload) => {
    createInvoice(payload)
      .then(() => load())
      .catch(() => {});
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ background: "#0F172A", padding: "0 32px", display: "flex", alignItems: "center", height: 60, gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 14 }}>⚙</span>
          </div>
          <span style={{ color: "#F8FAFC", fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>PopEyez</span>
        </div>
        <span style={{ color: "#475569", fontSize: 13, marginLeft: 4 }}>/ Invoices</span>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "36px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.03em" }}>Invoices</h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#64748B" }}>
            Submit invoices and track their review status.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>Loading invoices...</div>
        ) : (
          <>
            <CreateInvoiceForm onCreate={handleCreate} />

            {invoices.length === 0 ? (
              <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8", fontSize: 14 }}>No invoices yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {invoices.map((inv) => (
                  <InvoiceCard
                    key={inv._id}
                    invoice={inv}
                    onUploadDocument={handleUploadDocument}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function InvoiceCard({ invoice, onUploadDocument }) {
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

      {/* Supporting documents */}
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

      {/* Attach a supporting document */}
      <div>
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              onUploadDocument(invoice._id, file);
              e.target.value = "";
            }
          }}
          style={{ fontSize: 13 }}
        />
      </div>
    </div>
  );
}

function CreateInvoiceForm({ onCreate }) {
  const [organizerId, setOrganizerId] = useState("");
  const [eventId, setEventId] = useState("");
  const [vendorRequestId, setVendorRequestId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0 }]);
  const [open, setOpen] = useState(false);

  const updateItem = (idx, field, value) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, [field]: field === "description" ? value : Number(value) } : it))
    );
  };

  const addItemRow = () => setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }]);

  const submit = () => {
    if (!organizerId || !invoiceNumber || items.some((it) => !it.description)) return;

    onCreate({
      organizerId,
      vendorId: CURRENT_USER_ID,
      eventId: eventId || null,
      vendorRequestId: vendorRequestId || null,
      invoiceNumber,
      items,
    });

    setOrganizerId("");
    setEventId("");
    setVendorRequestId("");
    setInvoiceNumber("");
    setItems([{ description: "", quantity: 1, unitPrice: 0 }]);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ marginBottom: 20, padding: "10px 18px", borderRadius: 9, border: "1px solid #E2E8F0", background: "#0F172A", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
      >
        + New Invoice
      </button>
    );
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, boxShadow: "0 1px 6px rgba(15,23,42,0.06)", marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>New Invoice</div>

      <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <input
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          placeholder="Invoice number"
          style={{ flex: 1, padding: "9px 12px", borderRadius: 7, border: "1px solid #E2E8F0", fontSize: 13, outline: "none" }}
        />
        <input
          value={organizerId}
          onChange={(e) => setOrganizerId(e.target.value)}
          placeholder="Organizer ID"
          style={{ flex: 1, padding: "9px 12px", borderRadius: 7, border: "1px solid #E2E8F0", fontSize: 13, outline: "none" }}
        />
        <input
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          placeholder="Event ID (optional)"
          style={{ flex: 1, padding: "9px 12px", borderRadius: 7, border: "1px solid #E2E8F0", fontSize: 13, outline: "none" }}
        />
        <input
          value={vendorRequestId}
          onChange={(e) => setVendorRequestId(e.target.value)}
          placeholder="Vendor Request ID (optional)"
          style={{ flex: 1, padding: "9px 12px", borderRadius: 7, border: "1px solid #E2E8F0", fontSize: 13, outline: "none" }}
        />
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Items</div>
      {items.map((item, idx) => (
        <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            value={item.description}
            onChange={(e) => updateItem(idx, "description", e.target.value)}
            placeholder="Description"
            style={{ flex: 2, padding: "8px 10px", borderRadius: 7, border: "1px solid #E2E8F0", fontSize: 13, outline: "none" }}
          />
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => updateItem(idx, "quantity", e.target.value)}
            placeholder="Qty"
            style={{ width: 80, padding: "8px 10px", borderRadius: 7, border: "1px solid #E2E8F0", fontSize: 13, outline: "none" }}
          />
          <input
            type="number"
            value={item.unitPrice}
            onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
            placeholder="Unit price"
            style={{ width: 110, padding: "8px 10px", borderRadius: 7, border: "1px solid #E2E8F0", fontSize: 13, outline: "none" }}
          />
        </div>
      ))}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
        <button onClick={addItemRow} style={{ padding: "8px 14px", borderRadius: 7, border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#0F172A", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          + Add item
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setOpen(false)} style={{ padding: "8px 14px", borderRadius: 7, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={submit} style={{ padding: "8px 14px", borderRadius: 7, border: "1px solid #BBF7D0", background: "#F0FDF4", color: "#166534", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            Submit Invoice
          </button>
        </div>
      </div>
    </div>
  );
}