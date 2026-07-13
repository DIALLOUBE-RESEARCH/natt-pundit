# Playbook pitch — ambiance Coupe du monde + preuve produit

**Mise à jour finale (12 juil) :** 
L'erreur de logique était de cacher les téléphones par peur de foirer l'écran, ou de vouloir générer un écran visible en Veo.

La solution parfaite : **On montre des fans de face. Le supporter regarde son téléphone tenu devant lui. Comme on filme de face, l'écran du smartphone fait face à l'utilisateur et présente donc son dos métallique ou sa coque épurée à la caméra. L'écran lui-même est 100% invisible à l'objectif sans nécessiter de flou. Cela donne une mise en scène ultra-réaliste de notre app mobile sans aucun risque de générer une UI fake ou buggée en IA.**

L'interface réelle de l'application prend le relais immédiatement après via un scrcpy net et fluide à 60fps.

---

## La Formule de la vidéo (5:00)

```
[0:00 - 0:22] AMBIANCE WC + PHONE (Humains avec téléphones cadrés sans écran visible en Veo)
[0:22 - 0:26] LOGOS (Slate propre Hackathon + TxODDS)
[0:26 - 5:00] PREUVE PRODUIT (scrcpy mobile + desktop agent)
```

| Segment | Durée | Ce qu'on voit | Rôle |
|---------|-------|---------------|------|
| **Ambiance** | ~22s | Gens avec téléphones génériques, bar en tension, tribune de stade, émotion pure | Donner le frisson et poser l'usage mobile |
| **Logos** | 4s | Logos officiels Hackathon + TxODDS s'estompent sur noir | Crédibilité |
| **Hook VO** | 10s | Début de la démo scrcpy en mouvement | Cadrer le pitch |
| **Démo mobile** | ~2min | scrcpy mobile ultra-pro : match France vs Espagne, pari, Merkle proof | Prouver que le produit tourne |
| **Démo agent** | ~1min30 | `/agent` desktop, ledger autonome, connexion MCP | Preuve technique de l'autonomie |
| **Trust & Archi** | ~30s | Diagramme réseau, 220 tests, patch F95N | Preuve de sécurité (AlreadyClaimed) |
| **CTA** | ~30s | Slate de fin avec repo GitHub et date limite 19 juillet | Call to action |

---

## Ce que montre chaque seconde de l'intro (0:00 - 0:26)

### 1. Ambiance bar en tension (0:00 - 0:08) — Veo Plan A1 (Phone de dos/profil)
* **Ce qu'on voit :** Plan de profil d'un fan au bar qui tient un téléphone générique d'une main. L'écran est complètement tourné vers son visage (invisible pour la caméra, on ne voit que le dos mat et épuré du téléphone). Le fan a le visage tendu de suspense.
* **Ce qu'on entend :** Bourdonnement sourd de stade, bruit de pub, et montée lente d'une basse.

### 2. Explosion de joie au stade (0:08 - 0:16) — Veo Plan A2 (Phone célébration)
* **Ce qu'on voit :** Plan d'un fan dans une tribune ensoleillée qui brandit son téléphone vers le ciel en célébrant un but. La caméra est face à lui, l'écran du téléphone est donc tourné vers le fan et totalement caché à l'objectif (on ne voit que le dos métallique). 
* **Ce qu'on entend :** Clameur explosive du stade, cri de joie de la foule.

### 3. Gros plan visage - L'émotion (0:16 - 0:22) — Veo Plan A3 (Phone incliné)
* **Ce qu'on voit :** Gros plan serré sur le visage d'un fan qui regarde son téléphone incliné. Ses doigts cachent le bas de l'appareil et l'angle de vue masque l'écran. Son visage crispé par l'attente s'illumine brusquement d'un sourire libérateur.
* **Ce qu'on entend :** Son du stade atténué, démarrage de la musique orchestrale.

### 4. Transition Logos (0:22 - 0:26)
* **Ce qu'on voit :** Cut sur fond noir. Les logos du Hackathon et de TxODDS s'affichent proprement au centre.
* **Ce qu'on entend :** Silence soudain, début de la voix Charon (VO).

---

## Storyboard ambiance officiel

### Pack A (Recommandé, 3 gens)

* **A1_bar_tension_dur8sec :** Tension au bar, téléphone tenu de profil (écran caché).
* **A2_stadium_joy_dur8sec :** Explosion de joie au stade, téléphone brandi de dos.
* **A3_fan_face_emotion_dur6sec :** Gros plan émotionnel, téléphone incliné dans la main.

### Pack B (Alternative, 2 gens)

* **B1_fanzone_sun_dur8sec :** Foule fanzone, ferveur et drapeaux.
* **B2_living_room_joy_dur6sec :** Amis au salon qui sautent de joie collectivement.

### Pack C (Stock, 0 crédit)
Télécharger des vidéos de supporters et d'interactions mobiles sur Pexels.

---

## Directives Droits & Marques

* **Aucune marque visible :** Pas de logo Apple, Samsung, Nike, Adidas ou FIFA.
* **Smartphones 100% génériques :** Design épuré, dos lisse et uni, aucune encoche distinctive.
* **Pas d'écran à l'image en IA :** Pour éviter de foirer la crédibilité avec une fausse UI. L'application réelle n'est montrée que via le scrcpy propre.
