import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import AppBrand from '../src/components/AppBrand';
import InstitutionalHeader from '../src/components/InstitutionalHeader';

describe('Branding por tema', () => {
  it('renderiza ambos assets de marca en AppBrand para que CSS elija por tema', () => {
    const { container } = render(<AppBrand caption="Programa institucional" />);

    expect(container.querySelector('img[src="/icons/inpojuve.png"]')).toBeTruthy();
    expect(container.querySelector('img[src="/icons/logo.svg"]')).toBeTruthy();
  });

  it('renderiza ambos assets de marca en InstitutionalHeader para que CSS elija por tema', () => {
    const { container } = render(
      <InstitutionalHeader
        eyebrow="Mapa"
        title="Ubicaciones"
        titleId="branding-test-title"
      />
    );

    expect(container.querySelector('img[src="/icons/inpojuve.png"]')).toBeTruthy();
    expect(container.querySelector('img[src="/icons/logo.svg"]')).toBeTruthy();
  });
});
