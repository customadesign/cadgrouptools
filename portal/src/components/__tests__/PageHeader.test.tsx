import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PageHeader from '../common/PageHeader';

describe('PageHeader Component', () => {
  const defaultProps = {
    title: 'Test Title',
    subtitle: 'Test Subtitle',
  };

  it('renders title and subtitle', () => {
    render(<PageHeader {...defaultProps} />);
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('renders without subtitle', () => {
    render(<PageHeader title="Only Title" />);
    
    expect(screen.getByText('Only Title')).toBeInTheDocument();
  });

  it('renders extra content', () => {
    const extraContent = <button>Extra Button</button>;
    render(<PageHeader {...defaultProps} extra={extraContent} />);
    
    expect(screen.getByText('Extra Button')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    const onBackMock = jest.fn();
    render(<PageHeader {...defaultProps} onBack={onBackMock} />);
    
    const backButton = screen.getByRole('img', { hidden: true });
    fireEvent.click(backButton.parentElement!);
    
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });

  it('renders status badge when provided', () => {
    render(
      <PageHeader
        {...defaultProps}
        status={{ text: 'Active', color: 'green' }}
      />
    );
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders tags when provided', () => {
    const tags = ['Tag 1', 'Tag 2'];
    render(<PageHeader {...defaultProps} tags={tags} />);
    
    expect(screen.getByText('Tag 1')).toBeInTheDocument();
    expect(screen.getByText('Tag 2')).toBeInTheDocument();
  });

  it('renders action buttons when provided', () => {
    const actions = [
      <button key="1">Action 1</button>,
      <button key="2">Action 2</button>,
    ];
    render(<PageHeader {...defaultProps} actions={actions} />);
    
    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PageHeader {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
