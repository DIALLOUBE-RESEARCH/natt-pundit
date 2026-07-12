# Charte graphique — Natt Settlement (TxODDS WC 2026)

Source de verite pour UI, Stitch, Nano Banana, et agents Cursor.

## 1. Contexte hackathon

| Element | Valeur |
|---------|--------|
| Produit | **Natt Settlement** |
| Track | TxODDS — Prediction Markets & Settlement |
| Evenement | FIFA World Cup 26 — USA / Canada / Mexico |
| Langue UI | **English** (jury international) |

## 2. Logos (assets repo)

| Fichier | Usage |
|---------|--------|
| `hackathon/Visuels/altLogo.avif` | **Logo concours hackathon** — header + hero (prioritaire) |
| `hackathon/Visuels/so8tn7cfinudbwpvlykv.webp` | Logo TxODDS partenaire — footer Powered by |
| Copie prod | `apps/web/public/branding/txodds-logo.webp`, `contest-logo.avif` |

**Header app** : TxODDS a gauche (badge partenaire), **Natt Settlement** titre produit a cote.  
**Ne pas** utiliser l'emblem FIFA officiel (IP protegee) — s'inspirer de la palette et des motifs seulement.

## 3. FIFA World Cup 26 — identite officielle (reference)

D'apres le brand system FIFA (mai 2023, FWC26 style guide) :

### Palette base (monochrome officiel)

| Nom | Hex | Usage Natt |
|-----|-----|------------|
| WC Black | `#0A0A0A` | Fonds profonds |
| WC White | `#FFFFFF` | Texte primaire, contraste |
| WC Gold | `#C8A951` | Accents premium, scores, kicker |

### Couleurs hotes (couche 2 — 48 nations / 3 pays)

| Pays | Hex approx. | Usage |
|------|-------------|--------|
| USA Blue | `#1D428A` | Liens TxLINE, accents tech |
| Mexico Green | `#006847` | LIVE tag secondaire |
| Canada Red | `#D52B1E` | Alertes rares uniquement |

### Typographie officielle

| Role | Police FIFA | Notre equivalent libre |
|------|-------------|------------------------|
| Display / event | FWC26 (custom) | **Barlow Condensed** 700-800 |
| Body | Noto Sans | **Inter** |
| Data / odds | — | **JetBrains Mono** tabular |

### Motifs (inspiration, pas copie trademark)

- **26 graphic** : 48 modules (carres + quarts de cercle) = 48 equipes — utiliser en grille CSS subtile 5% opacite
- Slogan campagne FIFA : *We Are 26* — **ne pas** afficher sauf si TxODDS l'autorise ; preferer *TxODDS · Prediction Markets & Settlement*

## 4. Tokens CSS (implementation)

```css
--txodds-navy: #1a234e;
--wc26-black: #0a0a0a;
--wc26-white: #ffffff;
--wc26-gold: #c8a951;
--wc26-usa-blue: #1d428a;
--wc26-mexico-green: #006847;
--wc26-canada-red: #d52b1e;
--natt-bg: #0c1020;        /* navy TxODDS + WC black */
--natt-panel: #141c32;
--natt-gold: var(--wc26-gold);
--natt-accent: var(--wc26-usa-blue);
--natt-setup: #2ecc71;
--natt-hold: #8b9cb3;
```

## 5. Composants UI

### Header
- Logo TxODDS 40px hauteur
- Titre : `NATT SETTLEMENT` Barlow Condensed uppercase
- Nav : Fixtures | TxLINE (bleu USA) | EN | Jury mode

### Footer (obligatoire hackathon)
- **Powered by TxODDS** — logo + lien https://txodds.com
- Visible sur toutes les pages (composant `PoweredByTxOdds`)

### Cartes match
- Fond panel navy, bordure gauche **gold** 3px
- Drapeaux flagcdn, pills SETUP (vert) / HOLD (gris-bleu)
- Competition : `WORLD CUP` en gold

### Hero home
- Fond : texture + gradient navy → transparent
- Kicker gold : `TxODDS · Prediction Markets & Settlement`
- Grille motif 48 modules en overlay 4% (optionnel)

### Match detail
- Score hero gold, decomposition mono, proof Merkle sobre

## 6. Interdits

- Glassmorphism violet / gradient IA generique
- Logo FIFA / trophy officiel dans l'UI
- Francais par defaut
- FOMO / copy betting consumer

## 7. Outils design (sans cle API Stitch)

Stitch web (stitch.withgoogle.com) **n'expose pas toujours** une cle API dans l'UI.

| Besoin | Outil |
|--------|--------|
| Images / textures | **Nano Banana MCP** dans Cursor (`GOOGLE_AI_API_KEY`) |
| Maquettes UI | Stitch **manuel** dans le navigateur → export HTML → `stitch-import/` |
| Stitch programmatique | `gcloud auth application-default login` + `@keeponfirst/kof-stitch-mcp` (pas de cle Stitch) |

Prompts Nano Banana / Stitch doivent **citer cette charte** (navy TxODDS, gold WC26, Barlow, pas FIFA emblem).

## 8. Data bindings (inchange)

- TxLINE live odds, edge SETUP si `c - pi_tx > 0.03`
- Drapeaux : `countryFlags.ts` WC 2026
