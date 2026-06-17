import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  url?: string;
}

interface State {
  hasError: boolean;
}

export class AudioErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error: Error): State {
    // Met à jour l'état pour que le prochain rendu affiche l'interface de secours.
    return { hasError: true };
  }

  componentDidCatch(error: Error, _errorInfo: any) {
    // Tu peux aussi enregistrer l'erreur dans un service de rapport d'erreurs
    console.warn(`[AudioErrorBoundary] Impossible de charger le son "${this.props.url}" :`, error);
  }

  render() {
    if (this.state.hasError) {
      // On peut afficher n'importe quelle UI de secours
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}
