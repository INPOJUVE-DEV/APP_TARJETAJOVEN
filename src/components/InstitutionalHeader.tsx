import { ReactNode } from 'react';

interface InstitutionalHeaderProps {
  eyebrow: string;
  title: string;
  titleId: string;
  summary?: string;
  aside?: ReactNode;
  className?: string;
}

const InstitutionalHeader = ({
  eyebrow,
  title,
  titleId,
  summary,
  aside,
  className = '',
}: InstitutionalHeaderProps) => {
  const classes = ['institutional-hero', className].filter(Boolean).join(' ');

  return (
    <section className={classes} aria-labelledby={titleId}>
      <img
        src="/icons/inpojuve.png"
        alt="Identidad institucional de INPOJUVE"
        className="institutional-hero__icon"
      />

      <div className="institutional-hero__body">
        <header className="page-header institutional-hero__header">
          <p className="page-header__eyebrow">{eyebrow}</p>
          <h1 id={titleId} className="page-header__title">
            {title}
          </h1>
          {summary ? <p className="page-header__summary">{summary}</p> : null}
        </header>

        {aside ? <div className="institutional-hero__aside">{aside}</div> : null}
      </div>
    </section>
  );
};

export default InstitutionalHeader;
