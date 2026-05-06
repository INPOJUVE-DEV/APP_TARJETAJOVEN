import institutionalLogo from '../../Recurso 3.png';
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
      <img src={institutionalLogo} alt="Logotipo institucional Tarjeta Joven" className="app-brand__image" />
      {caption ? <span className="app-brand__caption">{caption}</span> : null}
    </div>
  );
};

export default AppBrand;
