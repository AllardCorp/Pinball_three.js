import type { ScoreClaimSessionPhase, ScoreClaimSessionSnapshot } from "./score-claim-session-store";

export function getScoreClaimPhaseLabel(phase: ScoreClaimSessionPhase) {
  switch (phase) {
    case "idle":
      return "Prêt";
    case "submitting":
      return "Préparation du QR code";
    case "discarded":
      return "Score non enregistré";
    case "saved":
      return "Score enregistré";
    case "claim_pending":
      return "Scannez le QR code";
    case "claim_approved":
      return "Score enregistré";
    case "claim_expired":
      return "QR code expiré";
    case "error":
      return "QR code indisponible";
  }
}

export function getScoreClaimDmdMessage(snapshot: ScoreClaimSessionSnapshot) {
  switch (snapshot.phase) {
    case "idle":
      return "FIN DE PARTIE";
    case "submitting":
      return "SAUVEGARDE SCORE";
    case "discarded":
      return "SCORE NON ENREGISTRE";
    case "saved":
      return "SCORE SAUVEGARDE";
    case "claim_pending":
      return "SCANNEZ LE QR";
    case "claim_approved":
      return "SCORE ENREGISTRE";
    case "claim_expired":
      return "QR EXPIRE";
    case "error":
      return "";
  }
}

export function getScoreClaimDescription(snapshot: ScoreClaimSessionSnapshot) {
  switch (snapshot.phase) {
    case "idle":
      return "Le QR code apparaîtra à la fin de la partie.";
    case "submitting":
      return "Sauvegarde du score en cours...";
    case "discarded":
      return "Ce score n'a pas été conservé.";
    case "saved":
      return "Le score est enregistré.";
    case "claim_pending":
      return "Scannez avec votre téléphone pour rattacher le score.";
    case "claim_approved":
      return "Le score est rattaché à un compte joueur.";
    case "claim_expired":
      return "Ce QR code n'est plus utilisable.";
    case "error":
      return snapshot.errorMessage ?? "Impossible d'afficher le QR code pour le moment.";
  }
}
