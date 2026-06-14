// client/src/utils/constants.js

export const EVENT_TYPES = [
  { label: 'Pop-up Café',   value: 'pop-up'        },
  { label: 'Wedding',       value: 'wedding'        },
  { label: 'Conference',    value: 'conference'     },
  { label: 'Concert',       value: 'concert'        },
  { label: 'Workshop',      value: 'workshop'       },
  { label: 'Corporate',     value: 'corporate'      },
  { label: 'Private Party', value: 'private_party'  },
  { label: 'Exhibition',    value: 'exhibition'     },
  { label: 'Networking',    value: 'networking'     },
  { label: 'Charity',       value: 'charity'        },
  { label: 'Other',         value: 'other'          },
];

export const STATUS_OPTIONS = ['planning', 'confirmed', 'completed', 'cancelled'];

export const STATUS_COLORS = {
  draft:     { bg: '#F1F5F9', text: '#64748B' },
  planning:  { bg: '#EEF2FF', text: '#4338CA' },
  confirmed: { bg: '#F0FDF4', text: '#166634' },
  completed: { bg: '#F8FAFC', text: '#94A3B8' },
  cancelled: { bg: '#FEF2F2', text: '#991B1B' },
};