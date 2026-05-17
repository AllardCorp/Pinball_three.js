import { useEffect, useRef } from "react";
import { PositionalAudio } from "@react-three/drei";
import * as THREE from "three";
import { useControls } from "leva"; // 👈 1. Ajoute cet import
import { AudioErrorBoundary } from "@/components/AudioErrorBoundary";

type ObjectSoundProps = {
  url: string | string[];
  playTrigger: boolean | number;
  volume?: number;
  distance?: number;
};

export default function ObjectSound({
  url,
  playTrigger,
  volume = 3,
  distance = 15
}: ObjectSoundProps) {
  const urls = Array.isArray(url) ? url : [url];
  const soundRefs = useRef<(THREE.PositionalAudio | null)[]>([]);
  const isMounted = useRef(false);

  // 👇 2. Ajout du contrôle global Leva dans un dossier "Audio"
  const { masterVolume } = useControls("Audio", {
    masterVolume: { value: 1, min: 0, max: 5, step: 0.1 },
  });

  // 👇 3. On multiplie le volume spécifique de l'objet par le masterVolume global
  const finalVolume = volume * masterVolume;

  // 👇 1er useEffect : Gère UNIQUEMENT le volume en direct (silencieux)
  useEffect(() => {
    soundRefs.current.forEach((sound) => {
      if (sound) sound.setVolume(finalVolume);
    });
  }, [finalVolume]); // 👈 Ne s'active que si le volume change

  // 👇 2ème useEffect : Gère UNIQUEMENT le fait de jouer le son
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    if (playTrigger) {
      const randomIndex = Math.floor(Math.random() * urls.length);
      const chosenSound = soundRefs.current[randomIndex];

      if (chosenSound) {
        soundRefs.current.forEach((sound) => {
          try {
            if (sound && sound.isPlaying) sound.stop();
          } catch (err) {
            console.warn("Impossible d'arrêter le son :", err);
          }
        });

        try {
          chosenSound.play();
        } catch (err) {
          console.warn(`Impossible de jouer le son (${chosenSound.name || "inconnu"}) :`, err);
        }
      }
    }
  }, [playTrigger, urls.length]); // 👈 Ne s'active que lors d'un vrai trigger !

  return (
    <>
      {urls.map((singleUrl, index) => (
        <AudioErrorBoundary key={singleUrl} url={singleUrl}>
          <PositionalAudio
            ref={(el) => {
              soundRefs.current[index] = el;
            }}
            url={singleUrl}
            loop={false}
            volume={finalVolume}
            distance={distance}
          />
        </AudioErrorBoundary>
      ))}
    </>
  );
}
