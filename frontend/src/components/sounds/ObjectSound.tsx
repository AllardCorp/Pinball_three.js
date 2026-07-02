import { useEffect, useRef } from "react";
import { PositionalAudio } from "@react-three/drei";
import * as THREE from "three";
import { AudioErrorBoundary } from "@/components/sounds/AudioErrorBoundary";
import { useGameDebug } from "@/config/useGameDebug";

type ObjectSoundProps = {
  url: string | string[];
  playTrigger: boolean | number;
  volume?: number;
  distance?: number;
  playbackRate?: number;
  pitchMin?: number;
  pitchMax?: number;
};

export default function ObjectSound({
  url,
  playTrigger,
  volume = 3,
  distance = 15,
  playbackRate = 1,
  pitchMin,
  pitchMax,
}: ObjectSoundProps) {
  const urls = Array.isArray(url) ? url : [url];
  const soundRefs = useRef<(THREE.PositionalAudio | null)[]>([]);
  const isMounted = useRef(false);

  // Leva
  const { masterVolume } = useGameDebug();
  // Gestion du volume final
  const finalVolume = volume * masterVolume;

  // 1er useEffect : Gère UNIQUEMENT le volume en direct (silencieux)
  useEffect(() => {
    soundRefs.current.forEach((sound) => {
      if (sound) sound.setVolume(finalVolume);
    });
  }, [finalVolume]); // Ne s'active que si le volume change

  // 2ème useEffect : Gère UNIQUEMENT le fait de jouer le son
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
          let finalPlaybackRate = playbackRate;
          if (pitchMin !== undefined && pitchMax !== undefined) {
            finalPlaybackRate =
              Math.random() * (pitchMax - pitchMin) + pitchMin;
          }
          chosenSound.setPlaybackRate(finalPlaybackRate);
          chosenSound.play();
        } catch (err) {
          console.warn(
            `Impossible de jouer le son (${chosenSound.name || "inconnu"}) :`,
            err,
          );
        }
      }
    }
  }, [playTrigger, urls.length, pitchMin, pitchMax, playbackRate]); // Ne s'active que lors d'un vrai trigger !

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
            // volume={finalVolume}
            distance={distance}
          />
        </AudioErrorBoundary>
      ))}
    </>
  );
}
