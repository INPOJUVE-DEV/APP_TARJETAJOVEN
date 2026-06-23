import './AppBrand.css';

type AppBrandProps = {
  caption?: string;
  className?: string;
  compact?: boolean;
};

const AppBrand = ({ caption, className = '', compact = false }: AppBrandProps) => {
  const classes = ['app-brand', compact ? 'app-brand--compact' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      <div className="app-brand__image-stack" aria-hidden="true">
        <img src="/icons/inpojuve.png" alt="" className="app-brand__image theme-brand-asset--light" />
        <img src="/icons/logo.svg" alt="" className="app-brand__image theme-brand-asset--dark" />
      </div>
      {caption ? <span className="app-brand__caption">{caption}</span> : null}
    </div>
  );
};

export default AppBrand;
