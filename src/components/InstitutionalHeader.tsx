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
      <div className="institutional-hero__icon-stack" aria-hidden="true">
        <img
          src="/icons/inpojuve.png"
          alt=""
          className="institutional-hero__icon theme-brand-asset--light"
        />
        <img
          src="/icons/logo.svg"
          alt=""
          className="institutional-hero__icon theme-brand-asset--dark"
        />
      </div>

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
