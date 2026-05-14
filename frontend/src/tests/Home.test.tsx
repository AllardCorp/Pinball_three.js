import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import Home from '../pages/Home'

describe('Page Home', () => {
  // Petit utilitaire pour entourer le composant du Router nécessaire
  const renderWithRouter = (component: React.ReactNode) => {
    return render(<BrowserRouter>{component}</BrowserRouter>)
  }

  it('devrait afficher le message de bienvenue', () => {
    renderWithRouter(<Home />)
    // On vérifie que le "Hi 👋" est présent
    expect(screen.getByText(/Hi 👋/i)).toBeInTheDocument()
  })

})