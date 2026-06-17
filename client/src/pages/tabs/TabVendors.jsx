import { useState } from 'react';
import TabVendorSourcing  from './TabVendorSourcing';
import TabVendorTracking  from './TabVendorTracking';
import TabVendorInvoices  from './TabVendorInvoices';
import { P, icons }       from '../../components/componentTheme';
import '../../components/componentTheme.css';

const SUB_TABS = [
  { id: 'sourcing',  label: 'Sourcing',  icon: icons.search  },
  { id: 'tracking',  label: 'Tracking',  icon: icons.mapPin  },
  { id: 'invoices',  label: 'Invoices',  icon: icons.budget  },
];

export default function TabVendors({ eventId, organizerId }) {
  const [activeSubTab, setActiveSubTab] = useState('sourcing');

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px 48px', animation: 'pageIn 0.3s ease both' }}>
      <style>{`
        @keyframes pageIn { from{opacity:0} to{opacity:1} }
        @keyframes cardIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes skpulse{0%,100%{opacity:1}50%{opacity:.3}}
      `}</style>

      {/* Sub-tab bar */}
      <div style={{
        display: 'flex', gap: 4,
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${P.border}`,
        padding: 4, borderRadius: 12,
        marginBottom: 20, width: 'fit-content',
      }}>
        {SUB_TABS.map(tab => {
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
                background: active
                  ? 'linear-gradient(135deg, rgba(139,109,255,0.22) 0%, rgba(62,207,184,0.14) 100%)'
                  : 'transparent',
                color:     active ? P.text : P.sub,
                boxShadow: active ? `0 0 0 1px ${P.indigo}44, 0 2px 8px rgba(0,0,0,0.25)` : 'none',
                transition: 'all 0.18s ease',
              }}
            >
              <span style={{ color: active ? P.teal : P.muted, display: 'flex', opacity: 0.9 }}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div key={activeSubTab} style={{ animation: 'cardIn 0.25s ease both' }}>
        {activeSubTab === 'sourcing'  && <TabVendorSourcing  eventId={eventId} organizerId={organizerId} />}
        {activeSubTab === 'tracking'  && <TabVendorTracking  eventId={eventId} />}
        {activeSubTab === 'invoices'  && <TabVendorInvoices  eventId={eventId} organizerId={organizerId} />}
      </div>
    </div>
  );
}
