import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MetricChart from './MetricChart';

describe('MetricChart Component', () => {
  it('should render title', () => {
    render(
      <MetricChart
        title="CPU Usage"
        data={[10, 20, 30, 40, 50]}
        color="#ef4444"
      />
    );

    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
  });

  it('should render SVG chart with data points', () => {
    const { container } = render(
      <MetricChart
        title="Memory"
        data={[30, 40, 50, 60, 70]}
        color="#f59e0b"
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should display no data message when data is empty', () => {
    render(<MetricChart title="Empty Chart" data={[]} color="#10b981" />);

    expect(screen.getByText('No data')).toBeInTheDocument();
  });

  it('should filter out non-numeric values from data', () => {
    const { container } = render(
      <MetricChart
        title="Filtered Data"
        data={[10, 'invalid', 20, null, 30]}
        color="#3b82f6"
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should handle single data point', () => {
    const { container } = render(
      <MetricChart title="Single Point" data={[50]} color="#8b5cf6" />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should handle data with all same values', () => {
    const { container } = render(
      <MetricChart
        title="Same Values"
        data={[50, 50, 50, 50, 50]}
        color="#ec4899"
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should use provided color', () => {
    const { container } = render(
      <MetricChart
        title="Colored Chart"
        data={[10, 20, 30]}
        color="#ff0000"
      />
    );

    const polyline = container.querySelector('polyline');
    expect(polyline).toHaveAttribute('stroke', '#ff0000');
  });

  it('should use default color when not provided', () => {
    const { container } = render(
      <MetricChart title="Default Color" data={[10, 20, 30]} />
    );

    const polyline = container.querySelector('polyline');
    expect(polyline).toHaveAttribute('stroke', '#3b82f6');
  });

  it('should use default height when not provided', () => {
    const { container } = render(
      <MetricChart title="Default Height" data={[10, 20, 30]} />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should respect custom height', () => {
    const { container } = render(
      <MetricChart
        title="Custom Height"
        data={[10, 20, 30]}
        height={150}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 300 150');
  });

  it('should handle objects with value property', () => {
    const { container } = render(
      <MetricChart
        title="Object Data"
        data={[{ value: 10 }, { value: 20 }, { value: 30 }]}
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should have polyline element with correct attributes', () => {
    const { container } = render(
      <MetricChart
        title="Attributes Test"
        data={[10, 20, 30, 40, 50]}
        color="#123456"
      />
    );

    const polyline = container.querySelector('polyline');
    expect(polyline).toHaveAttribute('fill', 'none');
    expect(polyline).toHaveAttribute('stroke', '#123456');
    expect(polyline).toHaveAttribute('stroke-width', '2');
  });
});