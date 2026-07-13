# STOP VEO — regle owner (NON NEGOCIABLE)

## Interdit agent

- **JAMAIS** `python generate_pilot_veo.py` sans :
  1. `CREATIVE_BRIEF_INTRO.md` rempli **avec** l'owner
  2. Prompt copie dans `01_scripts/intro_veo.txt` **valide par l'owner**
  3. Message explicite owner : **« go veo »** ou **« lance 1 gen »**

- **JAMAIS** « je teste pour voir » — 1 gen = argent reel.

## Workflow obligatoire AVANT toute generation

```
1. Brief creatif (scene, lumiere, sujet, duree, ce qu'on NE veut PAS)
2. Owner valide le texte du prompt mot pour mot
3. Owner dit go
4. UNE seule generation → owner preview → go suivant OU stop
```

## Fichiers

| Etape | Fichier |
|-------|---------|
| Brief | `00_brief/CREATIVE_BRIEF_INTRO.md` (a remplir ensemble) |
| Prompt valide | `01_scripts/intro_veo.txt` (fige apres OK owner) |
| Output | `02_generative/veo/intro_veo_9x16_silent.mp4` |

## Intro pipeline (ordre — pas encore execute)

1. Veo intro (apres brief OK seulement)
2. Logos slate (gratuit)
3. VO + scrcpy

**Statut Veo actuel : BLOQUE jusqu'a brief owner.**
