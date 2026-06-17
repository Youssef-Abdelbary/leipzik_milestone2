import LogoMark from './componentLogoMark';
import './componentAppHeader.css';

export default function AppHeader({ crumb, right }) {
  return (
    <header className="app-header">
      <div className="app-header__glass" aria-hidden="true" />
      <div className="app-header__content">
        <div className="app-header__brand">
          <LogoMark size={64} />
          {crumb && <span className="app-header__crumb">{crumb}</span>}
        </div>
        <div className="app-header__right">{right}</div>
      </div>
    </header>
  );
}