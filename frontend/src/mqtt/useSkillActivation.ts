import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore/useGameStore";
import { useInputStore } from "@/store/inputStore/useInputStore";

export function useSkillActivation() {
  useEffect(() => {
    // S'abonne aux changements des inputs venant du MQTT
    const unsubscribe = useInputStore.subscribe((state, prev) => {
      const isPlaying = useGameStore.getState().isPlaying;

      // On n'active la compétence que si la partie est en cours
      if (!isPlaying) return;

      // On détecte un appui (front montant : passe de false à true)
      const blackLeftPressed =
        state.buttons.black_left && !prev.buttons.black_left;
      const blackRightPressed =
        state.buttons.black_right && !prev.buttons.black_right;

      if (blackLeftPressed || blackRightPressed) {
        // Appelle la fonction d'activation du pouvoir
        useGameStore.getState().useClassPower();

        // On repasse manuellement le bouton à false pour être sûr de bien détecter le prochain appui
        if (blackLeftPressed) {
          useInputStore
            .getState()
            .updateInputs({ buttons: { black_left: false } });
        }
        if (blackRightPressed) {
          useInputStore
            .getState()
            .updateInputs({ buttons: { black_right: false } });
        }
      }
    });

    return unsubscribe;
  }, []);
}
