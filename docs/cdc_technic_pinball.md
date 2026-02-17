# Cahier des charges Technique pour le projet de Pinball

**Auteurs**: 
- [Adiren Allard]
- Christopher DE PASQUAL


---

## **Vision**

---

## **Objectifs et perimetre**

---

## **Use cases**

---

## **Architecture technique**

---

## **Diagrammes UML**

---

## **Stack technique**

---

## **Risques et contraintes**

Les risques et contraintes principaux de l'intégration de ce projet seront tant dévéloppement web que physique (Intéractiuon avec le matériel)

### Les Risques :
#### Risque Physique (matériel)

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
|Accès à la machine pour les tests | Elevée | Fort | Planifier des sessions de test, préparer une checklist, créer un mode simulation (MQTT events mock) pour avancer sans la machine.
| Surchage des solénoïdes | Moyenne | Critique |Mettre en place un arrêt des solénoïdes après x temps |
| Connectique instable (vibrations ou et faux contacts) | Moyenne | faible | En cas de beug vérifier si le problème n'est pas côté materiel |
| Bruits/parasites | Moyenne | Fort | Eviter les sons de collisions trop forts ou les filtrés pour éviter qu'ils ne soient pas confondus à de la triche (neudge) |


#### Risuques Virtuel ( côté code )

|Risque | Probabilité | Impact | Mitigation |
|-------|-------------|--------|------------|
| 3D (Colission, Physique, réactivité) | élevée | Critique | Fixed timestep (ex 60Hz), CCD sur la balle, colliders simples/épais (pas mesh high-poly), réglages friction/restitution, debug colliders. | 
| Performances WebGL insuffisantes | Moyenne | Fort | Optimiser scène : instancing, limiter lights/ombres, textures compressées, LOD, réduire re-renders (selectors Zustand), profiling |
| Désynchronisation entre Playfield, Backglass et DMD | Moyenne | Critique | Définir une source de vérité (serveur ou “game state” central). Envoyer des events (pas des états “calculés partout”). Ajouter un eventId + timestamp + version de state. Prévoir “state snapshot” périodique pour resync.
| Double déclenchement (rebond électrique / bounce) sur boutons | Elevée | Critique | Garder l’input “local-first” côté Playfield : l’action visuelle/physique part immédiatement puis on réconcilie via events. Optimiser payloads MQTT (petits messages). WebSocket/MQTT sur LAN, éviter surcharges. |
| State management instable (Zustand + flux MQTT) | Moyenne | Moyenne | Séparer state temps réel (events, score, flags) et state UI. Utiliser selectors Zustand + shallow compare. Bufferiser certains events (batch).|
| Reconnexion Wifi mal gérée | Elevée | Fort | Reconnect + backoff, handshake, demander snapshot, mode “degraded/offline”, timeouts + retry contrôlés. |

#### Autres risques

|Risque | Probabilité | Impact | Mitigation |
|-------|-------------|--------|------------|
| Intégration IoT “trop tard” → démo cassée | Elevée | Critique | Intégrer IoT plus tôt possible en version minimale : recevoir X/C/D/F et déclencher 1 solénoïde “dummy”. Itérer ensuite.

### Les contraintes :

#### Contraintes physiques et matérielles :

- Matériel existant non modifiable (ou modifications minimales)

- L’intégration ne pas dégrader le flipper d’origine

- Le temps de test sur machine physique est contraint (cours, disponibilités, transport).

#### Contraintes logicielles (3D + apps) : 
- Réactivité ressentie : actions (flippers/nudge) doivent être visibles immédiatement (latence faible)
- Playfield / Backglass / DMD doivent rester cohérents via une source de vérité et des events.
- Delai : 6 semaines environs
- Equipe : 4 personnes


---

## **Conventions equipe**

---

## **Roadmap et questions ouvertes**
