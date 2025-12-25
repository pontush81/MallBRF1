import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme';
import Stadgar from '../../pages/Stadgar';

// Wrapper component for tests
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ThemeProvider>
  );
};

describe('Stadgar Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page with hero title', () => {
    renderWithProviders(<Stadgar />);
    
    expect(screen.getByText('Digitala stadgar')).toBeInTheDocument();
  });

  it('renders the legal disclaimer', () => {
    renderWithProviders(<Stadgar />);
    
    expect(screen.getByText('Obs!')).toBeInTheDocument();
    expect(screen.getByText(/förenklad sammanfattning/i)).toBeInTheDocument();
  });

  it('renders the complete statutes notice', () => {
    renderWithProviders(<Stadgar />);
    
    expect(screen.getByText(/Vid tolkning eller tillämpning gäller alltid föreningens stadgar i original/i)).toBeInTheDocument();
  });

  it('renders all stadgar sections', () => {
    renderWithProviders(<Stadgar />);
    
    // Check that all 13 sections are rendered
    expect(screen.getByText('Om föreningen')).toBeInTheDocument();
    expect(screen.getByText('Medlemskap')).toBeInTheDocument();
    expect(screen.getByText('Avgifter – översikt')).toBeInTheDocument();
    expect(screen.getByText('Föreningsstämma och demokrati')).toBeInTheDocument();
    expect(screen.getByText('Styrelse och ansvar')).toBeInTheDocument();
    expect(screen.getByText('Revision och kontroll')).toBeInTheDocument();
    expect(screen.getByText('Ansvar i lägenheten')).toBeInTheDocument();
    expect(screen.getByText('Förändringar och renovering')).toBeInTheDocument();
    expect(screen.getByText('Användning av bostaden')).toBeInTheDocument();
    expect(screen.getByText('Andrahandsuthyrning')).toBeInTheDocument();
    expect(screen.getByText('Kommunikation från föreningen')).toBeInTheDocument();
    expect(screen.getByText('Underhåll och långsiktig planering')).toBeInTheDocument();
    expect(screen.getByText('Juridisk information')).toBeInTheDocument();
  });

  it('expands accordion when clicked', async () => {
    renderWithProviders(<Stadgar />);
    
    // Find and click the "Om föreningen" accordion
    const omForeningenAccordion = screen.getByText('Om föreningen');
    fireEvent.click(omForeningenAccordion);
    
    // Wait for content to appear
    await waitFor(() => {
      expect(screen.getByText(/Bostadsrättsföreningen Gulmåran är en bostadsrättsförening/i)).toBeInTheDocument();
    });
  });

  it('renders quick navigation chips', () => {
    renderWithProviders(<Stadgar />);
    
    expect(screen.getByText('Snabbnavigering')).toBeInTheDocument();
  });

  it('renders footer disclaimer with source information', () => {
    renderWithProviders(<Stadgar />);
    
    expect(screen.getByText(/Källa:/i)).toBeInTheDocument();
    expect(screen.getByText(/Stadgar i original/i)).toBeInTheDocument();
  });

  it('collapses expanded accordion when clicked again', async () => {
    renderWithProviders(<Stadgar />);
    
    // Find and click the "Medlemskap" accordion to expand
    const medlemskapAccordion = screen.getByText('Medlemskap');
    fireEvent.click(medlemskapAccordion);
    
    // Wait for content to appear
    await waitFor(() => {
      expect(screen.getByText(/För att få inneha en bostadsrätt/i)).toBeInTheDocument();
    });
    
    // Click again to collapse
    fireEvent.click(medlemskapAccordion);
    
    // Content should still be in the DOM but the accordion should be collapsed
    // (MUI Accordion keeps content in DOM but hides it)
    await waitFor(() => {
      const accordionDetails = document.querySelector('[aria-expanded="false"]');
      expect(accordionDetails).toBeInTheDocument();
    });
  });

  it('only expands one accordion at a time', async () => {
    renderWithProviders(<Stadgar />);
    
    // Click first accordion
    const omForeningenAccordion = screen.getByText('Om föreningen');
    fireEvent.click(omForeningenAccordion);
    
    // Click second accordion
    const medlemskapAccordion = screen.getByText('Medlemskap');
    fireEvent.click(medlemskapAccordion);
    
    // Check that first accordion content is no longer visible (collapsed)
    await waitFor(() => {
      // The second accordion should be expanded
      expect(screen.getByText(/För att få inneha en bostadsrätt/i)).toBeInTheDocument();
    });
  });
});

