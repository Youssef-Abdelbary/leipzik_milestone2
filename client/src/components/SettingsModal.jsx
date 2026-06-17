import { useState } from 'react';
import { createPortal } from 'react-dom';
import { updateEvent, createEvent } from '../services/serviceEvent';
import { EVENT_TYPES }   from '../utils/constants';
import { P, icons, STATUS_OPTIONS } from '../utils/theme';

const Field = ({ label, children }) => (
  <div style={{ marginBottom:16, flex:1, minWidth:0 }}>
    <label style={{ display:'block', fontSize:11, fontWeight:600, color:P.sub, marginBottom:7, textTransform:'uppercase', letterSpacing:'0.06em' }}>
      {label}
    </label>
    {children}
  </div>
);

export default function SettingsModal({ event, onSave, onClose, createMode = false }) {
  const [form, setForm] = useState({
    title:             event?.title || '',
    description:       event?.description || '',
    date:              event?.date ? new Date(event.date).toISOString().split('T')[0] : '',
    startTime:         event?.startTime || '',
    endTime:           event?.endTime || '',
    eventType:         event?.eventType || '',
    expectedAttendees: event?.expectedAttendees || '',
    location:          event?.locationSnapshot?.venueName !== 'TBD' ? (event?.locationSnapshot?.venueName || '') : '',
    dressCode:         event?.dressCode || '',
    status:            createMode ? 'planning' : (event?.status || 'planning'),
  });
  const [saving,          setSaving]          = useState(false);
  const [saveError,       setSaveError]       = useState(null);
  const [confirmComplete, setConfirmComplete] = useState(false);

  const set = (k,v) => setForm(p => ({...p,[k]:v}));

  const isMarkingComplete = !createMode && form.status === 'completed' && event?.status !== 'completed';

  const handleSave = async () => {
    setSaveError(null);
    if (!form.title?.trim()) { setSaveError('Title is required'); return; }
    if (isMarkingComplete && !confirmComplete) {
      setConfirmComplete(true);
      return;
    }
    setSaving(true);
    try {
      const payload = createMode ? { ...form, status: 'planning' } : form;
      const result  = createMode
        ? await createEvent(payload)
        : await updateEvent(event._id, payload);
      onSave(result);
      onClose();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inp = {
    width:'100%', padding:'12px 14px', borderRadius:9,
    border:`1px solid ${P.border}`, background:P.hover,
    color:P.text, fontSize:14, outline:'none',
    boxSizing:'border-box', fontFamily:'inherit',
    transition:'border-color 0.15s',
  };
  const focusBlue  = e => e.target.style.borderColor = P.blue;
  const blurBorder = e => e.target.style.borderColor = P.border;

  return createPortal(
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.80)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', padding:20, overflowY:'auto' }}
      onClick={onClose}
    >
      <style>{`
        @keyframes modalIn {
          from { opacity:0; transform:scale(0.96) translateY(10px); }
          to   { opacity:1; transform:scale(1)    translateY(0);     }
        }
      `}</style>
      <div
        style={{ background:P.panel, borderRadius:16, padding:'32px', width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', border:`1px solid ${P.border}`, boxShadow:'0 20px 48px rgba(0,0,0,0.8)', animation:'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:28 }}>
          <span style={{ color:P.blue, background:P.blueGlow, padding:9, borderRadius:10, display:'flex' }}>
            {createMode ? icons.plus : icons.settings}
          </span>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:P.text }}>
            {createMode ? 'Create Event' : 'Event Settings'}
          </h2>
        </div>

        {saveError && (
          <div style={{ background:P.redGlow, color:P.red, border:`1px solid ${P.red}33`, borderRadius:8, padding:'12px 16px', fontSize:13, marginBottom:20, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ flexShrink:0 }}>{icons.warning}</span>
            {saveError}
          </div>
        )}

        {/* Title */}
        <Field label="Event Title *">
          <input style={inp} value={form.title} onChange={e => set('title',e.target.value)} onFocus={focusBlue} onBlur={blurBorder} placeholder="e.g. Annual Gala 2026" />
        </Field>

        {/* Type + Status */}
        <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
          <Field label="Event Type">
            <select style={{ ...inp, cursor:'pointer' }} value={form.eventType} onChange={e => set('eventType',e.target.value)}>
              <option value="">Select type…</option>
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>

          {createMode ? (
            <Field label="Status">
              <div style={{ ...inp, display:'flex', alignItems:'center', gap:8, cursor:'default' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:P.purple, flexShrink:0 }} />
                <span style={{ color:P.purple, fontWeight:700, fontSize:12, letterSpacing:'0.06em' }}>PLANNING</span>
                <span style={{ color:P.muted, fontSize:11, marginLeft:'auto' }}>auto-set</span>
              </div>
            </Field>
          ) : (
            <Field label="Status">
              <select style={{ ...inp, cursor:'pointer' }} value={form.status} onChange={e => set('status',e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </Field>
          )}
        </div>

        {/* Date + Attendees */}
        <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
          <Field label="Date">
            <input style={inp} type="date" value={form.date} onChange={e => set('date',e.target.value)} onFocus={focusBlue} onBlur={blurBorder} />
          </Field>
          <Field label="Expected Attendees">
            <input style={inp} type="number" min="0" value={form.expectedAttendees} onChange={e => set('expectedAttendees',e.target.value)} onFocus={focusBlue} onBlur={blurBorder} />
          </Field>
        </div>

        {/* Times */}
        <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
          <Field label="Start Time">
            <input style={inp} type="time" value={form.startTime} onChange={e => set('startTime',e.target.value)} onFocus={focusBlue} onBlur={blurBorder} />
          </Field>
          <Field label="End Time">
            <input style={inp} type="time" value={form.endTime} onChange={e => set('endTime',e.target.value)} onFocus={focusBlue} onBlur={blurBorder} />
          </Field>
        </div>

        {/* Venue + Dress code */}
        <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
          <Field label="Venue / Location">
            <input style={inp} value={form.location} onChange={e => set('location',e.target.value)} placeholder="e.g. The Garden Hall" onFocus={focusBlue} onBlur={blurBorder} />
          </Field>
          <Field label="Dress Code">
            <input style={inp} value={form.dressCode} onChange={e => set('dressCode',e.target.value)} onFocus={focusBlue} onBlur={blurBorder} />
          </Field>
        </div>

        {/* Description */}
        <Field label="Description">
          <textarea style={{ ...inp, minHeight:100, resize:'vertical' }} value={form.description} onChange={e => set('description',e.target.value)} onFocus={focusBlue} onBlur={blurBorder} />
        </Field>

        {/* Completion confirmation prompt */}
        {confirmComplete && (
          <div style={{ background:'rgba(251,191,36,0.1)', border:`1px solid ${P.amber}44`, borderRadius:10, padding:'16px 18px', marginBottom:16, animation:'modalIn 0.2s ease both' }}>
            <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ color:P.amber, flexShrink:0, marginTop:1 }}>{icons.warning}</span>
              <div>
                <p style={{ margin:'0 0 6px', fontSize:14, fontWeight:700, color:P.amber }}>Send feedback emails to guests?</p>
                <p style={{ margin:0, fontSize:13, color:P.sub, lineHeight:1.6 }}>
                  Marking this event as <strong style={{ color:P.text }}>Completed</strong> will automatically send feedback request emails to all attending guests. This action cannot be undone.
                </p>
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginTop:14 }}>
              <button
                onClick={() => setConfirmComplete(false)}
                style={{ flex:1, padding:'10px 0', borderRadius:8, border:`1px solid ${P.border}`, background:'transparent', color:P.sub, fontWeight:600, cursor:'pointer', fontFamily:'inherit', fontSize:13 }}
              >
                Go Back
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ flex:2, padding:'10px 0', borderRadius:8, border:'none', background:saving?P.muted:P.amber, color:'#111', fontWeight:700, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
              >
                {saving ? 'Saving…' : <>{icons.checkCircle} Confirm &amp; Send Emails</>}
              </button>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display:'flex', gap:10, marginTop:4 }}>
          <button
            onClick={onClose}
            style={{ flex:1, padding:'12px 0', borderRadius:9, border:`1px solid ${P.border}`, background:'transparent', color:P.sub, fontWeight:600, cursor:'pointer', fontFamily:'inherit', fontSize:14, transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color=P.text; e.currentTarget.style.borderColor=P.sub; }}
            onMouseLeave={e => { e.currentTarget.style.color=P.sub;  e.currentTarget.style.borderColor=P.border; }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ flex:1, padding:'12px 0', borderRadius:9, border:'none', background:saving?P.muted:P.blue, color:'#fff', fontWeight:600, cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', fontSize:14, transition:'background 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
          >
            {saving ? 'Saving…' : createMode ? 'Create Event' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
