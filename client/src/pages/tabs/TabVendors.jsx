import { useState } from 'react';
import TabVendorSourcing from './TabVendorSourcing';
import TabVendorTracking from './TabVendorTracking';
import TabVendorInvoices from './TabVendorInvoices';

const SUB_TABS = [
  { id: 'sourcing', label: 'Sourcing Requests' },
  { id: 'tracking', label: 'Delivery Tracking' },
  { id: 'invoices', label: 'Invoices' },
];

export default function TabVendors({ eventId, organizerId }) {
  const [activeSubTab, setActiveSubTab] = useState('sourcing');

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'inline-flex', gap: 6, background: '#E2E8F0', padding: 4, borderRadius: 8, marginBottom: 20 }}>
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              padding: '7px 16px', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit',
              background: activeSubTab === tab.id ? '#fff' : 'none',
              color: activeSubTab === tab.id ? '#0F172A' : '#64748B',
              boxShadow: activeSubTab === tab.id ? '0 1px 3px rgba(15,23,42,0.08)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'sourcing' && <TabVendorSourcing eventId={eventId} organizerId={organizerId} />}
      {activeSubTab === 'tracking' && <TabVendorTracking eventId={eventId} />}
      {activeSubTab === 'invoices' && <TabVendorInvoices organizerId={organizerId} />}
    </div>
  );
}
