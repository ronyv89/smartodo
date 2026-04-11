import { render, screen } from '@testing-library/react';
import HomePage from '../app/page';

describe('HomePage', () => {
  it('renders the smarTODO heading', () => {
    render(<HomePage />);
    expect(screen.getByTestId('hero-heading')).toHaveTextContent('smarTODO');
  });

  it('renders the home page container', () => {
    render(<HomePage />);
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('renders the CTA get-started button', () => {
    render(<HomePage />);
    expect(screen.getByTestId('cta-get-started')).toBeInTheDocument();
  });

  it('renders all 6 feature cards', () => {
    render(<HomePage />);
    expect(screen.getAllByTestId(/^feature-card-/)).toHaveLength(6);
  });

  it('renders footer with login link', () => {
    render(<HomePage />);
    expect(screen.getByTestId('footer-login-link')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(<HomePage />);
    expect(container).toMatchSnapshot();
  });
});
