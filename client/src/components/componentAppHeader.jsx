import LogoMark from './componentLogomark';
import './componentAppHeader.css';

// AppHeader props:
//   back   — optional: { label, onClick } — renders a back/nav button right of the logo
//   crumb  — optional string: page name badge shown after the back button
//   right  — optional JSX: actions on the far right

export default function AppHeader({ back, crumb, right }) {
  return (
    <header className="app-header">
      <div className="app-header__glass" aria-hidden="true" />
      <div className="app-header__content">
        <div className="app-header__brand">
          <LogoMark size={64} />

          {back && (
            <button className="app-header__back" onClick={back.onClick} type="button">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              {back.label}
            </button>
          )}

          {crumb && <span className="app-header__crumb">{crumb}</span>}
        </div>
        <div className="app-header__right">{right}</div>
      </div>
    </header>
  );
}
