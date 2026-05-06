import { Link } from 'react-router-dom';
import AppBrand from '../components/AppBrand';
import procedurePointsContent from '../../puntos de ramite.md?raw';
import './ProcedurePoints.css';

type ProcedurePoint = {
  title: string;
  municipality: string;
  delegation: string;
  address: string;
  mapsUrl: string;
  schedule: string;
};

type ProcedureDelegation = {
  name: string;
  offices: ProcedurePoint[];
};

type ProcedureRegion = {
  name: string;
  municipalOffices: ProcedurePoint[];
  delegations: ProcedureDelegation[];
};

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');

const cleanHeading = (value: string) =>
  value
    .replace(/^#+\s*/, '')
    .replace(/^\*+|\*+$/g, '')
    .replace(/\.+$/, '')
    .trim();

const getValue = (record: Record<string, string>, keys: string[]) => {
  const matchingKey = Object.keys(record).find((key) => keys.includes(key));
  return matchingKey ? record[matchingKey].trim() : '';
};

const formatValue = (value: string) => value || 'Por confirmar';

const isMunicipalPoint = (point: ProcedurePoint) => {
  const normalizedTitle = normalizeKey(point.title);
  const normalizedDelegation = normalizeKey(point.delegation);

  return normalizedTitle.includes('imjuve') || normalizedDelegation.length === 0;
};

const parseProcedureRegions = (content: string): ProcedureRegion[] => {
  const regions = new Map<
    string,
    {
      municipalOffices: ProcedurePoint[];
      delegations: Map<string, ProcedurePoint[]>;
    }
  >();
  let currentRegion = 'General';
  let currentDelegation = 'Sin delegación';

  const blocks = content
    .split(/\r?\n\r?\n+/)
    .map((block) =>
      block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .filter((lines) => lines.length > 0);

  const ensureGroup = (regionName: string, delegationName: string) => {
    if (!regions.has(regionName)) {
      regions.set(regionName, {
        municipalOffices: [],
        delegations: new Map(),
      });
    }

    const delegations = regions.get(regionName)!.delegations;
    if (!delegations.has(delegationName)) {
      delegations.set(delegationName, []);
    }

    return delegations.get(delegationName)!;
  };

  blocks.forEach((lines) => {
    const [firstLine, ...restLines] = lines;
    const hasDetails = restLines.some((line) => line.includes(':'));
    const isHeadingBlock = !hasDetails && !firstLine.includes(':');

    if (isHeadingBlock) {
      const heading = cleanHeading(firstLine);
      if (normalizeKey(heading).includes('region')) {
        currentRegion = heading;
        currentDelegation = 'Sin delegación';
      } else {
        currentDelegation = heading;
        ensureGroup(currentRegion, currentDelegation);
      }
      return;
    }

    const title = firstLine.replace(/:$/, '').trim();
    const detailRecord = restLines.reduce<Record<string, string>>((accumulator, line) => {
      const separatorIndex = line.indexOf(':');
      if (separatorIndex === -1) {
        return accumulator;
      }

      const rawKey = line.slice(0, separatorIndex).trim();
      const rawValue = line.slice(separatorIndex + 1).trim();
      accumulator[normalizeKey(rawKey)] = rawValue;
      return accumulator;
    }, {});

    const point: ProcedurePoint = {
      title,
      municipality: getValue(detailRecord, ['municipio']),
      delegation: getValue(detailRecord, ['delegacion']),
      address: getValue(detailRecord, ['ubicaciondeoficinadireccion']),
      mapsUrl: getValue(detailRecord, ['ubicaciondeoficinalinkdegooglemaps']),
      schedule: getValue(detailRecord, ['horariodeoficina']),
    };

    if (!regions.has(currentRegion)) {
      regions.set(currentRegion, {
        municipalOffices: [],
        delegations: new Map(),
      });
    }

    if (isMunicipalPoint(point)) {
      regions.get(currentRegion)!.municipalOffices.push(point);
      return;
    }

    ensureGroup(currentRegion, point.delegation || currentDelegation || 'Delegación').push(point);
  });

  return Array.from(regions.entries()).map(([regionName, regionData]) => ({
    name: regionName,
    municipalOffices: regionData.municipalOffices,
    delegations: Array.from(regionData.delegations.entries()).map(([delegationName, offices]) => ({
      name: delegationName,
      offices,
    })),
  }));
};

const procedureRegions = parseProcedureRegions(procedurePointsContent);

const ProcedurePoints = () => {
  return (
    <main className="procedure-points-page" aria-labelledby="procedure-points-title">
      <AppBrand className="procedure-points-page__brand" caption="Trámite institucional" />

      <section className="procedure-points-hero surface-card section-shell">
        <div className="page-header">
          <p className="page-header__eyebrow">Tarjeta Joven</p>
          <h1 id="procedure-points-title" className="page-header__title">
            Puntos de trámite
          </h1>
          <p className="page-header__summary">
            Consulta las sedes disponibles para tramitar tu tarjeta y revisa sus datos
            de atención antes de acudir.
          </p>
        </div>
      </section>

      <section className="procedure-points-regions" aria-label="Regiones y delegaciones">
        {procedureRegions.map((region) => (
          <section key={region.name} className="procedure-region surface-card">
            <header className="procedure-region__header">
              <p className="procedure-region__eyebrow">Región</p>
              <h2>{region.name}</h2>
            </header>

            <div className="procedure-region__delegations">
              {region.delegations.map((delegation) => (
                <section key={`${region.name}-${delegation.name}`} className="procedure-delegation">
                  <header className="procedure-delegation__header">
                    <h3>{delegation.name || 'Delegación'}</h3>
                    <p>
                      {delegation.offices.length} {delegation.offices.length === 1 ? 'oficina' : 'oficinas'}
                    </p>
                  </header>

                  <div className="procedure-delegation__offices">
                    {delegation.offices.map((point) => (
                      <article key={`${delegation.name}-${point.title}`} className="procedure-point-card">
                        <div className="procedure-point-card__header">
                          <p className="procedure-point-card__eyebrow">{formatValue(point.municipality)}</p>
                          <h4>{point.title}</h4>
                        </div>

                        <dl className="procedure-point-card__details">
                          <div>
                            <dt>Dirección</dt>
                            <dd>{formatValue(point.address)}</dd>
                          </div>
                          <div>
                            <dt>Horario</dt>
                            <dd>{formatValue(point.schedule)}</dd>
                          </div>
                        </dl>

                        <div className="procedure-point-card__actions">
                          {point.mapsUrl ? (
                            <a href={point.mapsUrl} target="_blank" rel="noreferrer" className="secondary-button">
                              Ver en Google Maps
                            </a>
                          ) : (
                            <span>Link de mapa por confirmar</span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}

              {region.municipalOffices.length > 0 && (
                <section className="procedure-delegation procedure-delegation--municipal">
                  <header className="procedure-delegation__header">
                    <h3>Puntos municipales</h3>
                    <p>
                      {region.municipalOffices.length}{' '}
                      {region.municipalOffices.length === 1 ? 'oficina' : 'oficinas'}
                    </p>
                  </header>

                  <div className="procedure-delegation__offices">
                    {region.municipalOffices.map((point) => (
                      <article key={`${region.name}-${point.title}`} className="procedure-point-card">
                        <div className="procedure-point-card__header">
                          <p className="procedure-point-card__eyebrow">{formatValue(point.municipality)}</p>
                          <h4>{point.title}</h4>
                        </div>

                        <dl className="procedure-point-card__details">
                          <div>
                            <dt>Dirección</dt>
                            <dd>{formatValue(point.address)}</dd>
                          </div>
                          <div>
                            <dt>Horario</dt>
                            <dd>{formatValue(point.schedule)}</dd>
                          </div>
                        </dl>

                        <div className="procedure-point-card__actions">
                          {point.mapsUrl ? (
                            <a href={point.mapsUrl} target="_blank" rel="noreferrer" className="secondary-button">
                              Ver en Google Maps
                            </a>
                          ) : (
                            <span>Link de mapa por confirmar</span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </section>
        ))}
      </section>

      <div className="procedure-points-footer">
        <Link to="/" className="secondary-button procedure-points-footer__link">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
};

export default ProcedurePoints;
