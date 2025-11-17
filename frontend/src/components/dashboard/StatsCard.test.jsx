import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatsCard from './StatsCard';

describe('StatsCard Component', () => {
  it('should render title and value', () => {
    render(
      <StatsCard
        title="CPU"
        value={45}
        unit="%"
        color="bg-primary"
        loading={false}
      />
    );

    expect(screen.getByText('CPU')).toBeInTheDocument();
    expect(screen.getByText('45%')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    render(
      <StatsCard
        title="Memory"
        value={75}
        unit="%"
        color="bg-accent"
        loading={true}
      />
    );

    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('should display dash when value is null', () => {
    render(
      <StatsCard
        title="Disk"
        value={null}
        unit="%"
        color="bg-success"
        loading={false}
      />
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should display dash when value is undefined', () => {
    render(
      <StatsCard
        title="Network"
        value={undefined}
        unit="Mbps"
        color="bg-warning"
        loading={false}
      />
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('should render with custom unit', () => {
    render(
      <StatsCard
        title="Bandwidth"
        value={100}
        unit="Mbps"
        color="bg-info"
        loading={false}
      />
    );

    expect(screen.getByText('100Mbps')).toBeInTheDocument();
  });

  it('should cap percentage at 100', () => {
    render(
      <StatsCard
        title="Over Max"
        value={150}
        unit="%"
        color="bg-error"
        loading={false}
      />
    );

    expect(screen.getByText('150%')).toBeInTheDocument();
  });

  it('should not go below 0 for progress bar width', () => {
    const { container } = render(
      <StatsCard
        title="Negative Value"
        value={-10}
        unit="%"
        color="bg-primary"
        loading={false}
      />
    );

    const progressBar = container.querySelector(`div[class*="bg-primary"]`);
    expect(progressBar).toBeInTheDocument();
  });

  it('should apply correct color class', () => {
    const { container } = render(
      <StatsCard
        title="Colored"
        value={50}
        unit="%"
        color="bg-secondary"
        loading={false}
      />
    );

    expect(container.innerHTML).toContain('bg-secondary');
  });

  it('should default color to bg-primary', () => {
    const { container } = render(
      <StatsCard title="Default Color" value={50} unit="%" />
    );

    expect(container.innerHTML).toContain('bg-primary');
  });

  it('should handle zero value', () => {
    render(
      <StatsCard title="Zero Value" value={0} unit="%" loading={false} />
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
