import type { ScoreClaimSessionPhase, ScoreClaimSessionSnapshot } from "./score-claim-session-store";

export function getScoreClaimPhaseLabel(phase: ScoreClaimSessionPhase) {
  switch (phase) {
    case "idle":
      return "Prêt";
    case "submitting":
      return "Sauvegarde du score";
    case "discarded":
      return "Score ignoré";
    case "saved":
      return "Score sauvegardé";
    case "claim_pending":
      return "En attente de scan";
    case "claim_approved":
      return "Score rattaché";
    case "claim_expired":
      return "Claim expiré";
    case "error":
      return "Erreur";
  }
}

export function getScoreClaimDmdMessage(snapshot: ScoreClaimSessionSnapshot) {
  switch (snapshot.phase) {
    case "idle":
      return "GAME OVER";
    case "submitting":
      return "SAVING SCORE";
    case "discarded":
      return "SCORE NOT SAVED";
    case "saved":
      return "SCORE SAVED";
    case "claim_pending":
      return "SCAN TO CLAIM";
    case "claim_approved":
      return "SCORE LINKED";
    case "claim_expired":
      return "CLAIM EXPIRED";
    case "error":
      return "";
  }
}

export function getScoreClaimDescription(snapshot: ScoreClaimSessionSnapshot) {
  switch (snapshot.phase) {
    case "idle":
      return "Lancez une fin de partie technique pour tester le flux.";
    case "submitting":
      return "La borne enregistre le score final et évalue s'il doit être claimable.";
    case "discarded":
      return "Le backend a décidé de ne pas conserver ce score.";
    case "saved":
      return "Le score est conservé, mais aucun rattachement mobile n'est proposé.";
    case "claim_pending":
      return "Le score est sauvegardé et attend une confirmation explicite sur le téléphone.";
    case "claim_approved":
      return "Le score est désormais rattaché à un compte joueur.";
    case "claim_expired":
      return "La fenêtre de rattachement est terminée.";
    case "error":
      return snapshot.errorMessage ?? "Le flux de claim a échoué.";
  }
}
