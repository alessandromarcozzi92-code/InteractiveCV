# InteractiveCV

CV personale come sito multipagina con estetica arcade 8-bit. Invece di
scorrere un documento, si naviga tra schermate in stile console:
title screen, profilo giocatore, skill tree, quest log.

## Intento

Trasformare la lettura di un curriculum in un'esperienza memorabile,
senza sacrificare accessibilita e leggibilita. La metafora videoludica
e solo linguaggio visivo: **non e un videogioco**. Niente game loop,
niente fisica, niente livelli.

Tre principi guidano il progetto:

- **Nessun contenuto nascosto.** Niente e "da sbloccare": ogni sezione
  e raggiungibile dal menu in un click. Un recruiter deve trovare cio
  che cerca subito.
- **Doppia navigazione, stessa logica.** Tastiera (frecce/WASD, Enter,
  Esc) e mouse/touch sono equivalenti. Ogni voce di menu e un link
  reale, indicizzabile e apribile in nuova scheda.
- **Estetica retro, standard moderni.** Font pixel e cornici 9-slice,
  ma contrasto AA, focus sempre visibile e rispetto di
  `prefers-reduced-motion`.

## Sezioni

| Route | Schermata | Contenuto |
|---|---|---|
| `/` | Title screen | Nome, "PRESS START", menu iniziale |
| `/stats` | Player Profile | Dati personali, bio |
| `/skills` | Skill Tree | Competenze con barre di livello |
| `/quests` | Quest Log | Esperienze lavorative |
| `/training` | Training Grounds | Istruzione e certificazioni |
| `/inventory` | Inventory | Lingue e soft skill come passive abilities |
| `/contact` | Contact | Contatti e "SAVE GAME" -> download del CV in PDF |

## Stack

Vite + React + TypeScript, React Router, CSS nativo con custom
properties e CSS Modules, Vitest + React Testing Library. Asset grafici
da pack CC0. Deploy su GitHub Pages via GitHub Actions.

## Sviluppo

```bash
npm install
npm run dev     # dev server
npm test        # Vitest
npm run build   # type-check, build, e copia 404.html
npm run lint    # oxlint
```

## Contenuti

Tutti i contenuti stanno in `src/data/cv.ts`. I componenti non contengono
testo del CV: per aggiornare il curriculum si modifica solo quel file.
Il PDF scaricabile e `public/cv.pdf`.

## Architettura

Tre confini tengono il progetto manutenibile:

- **Contenuti**: tutto il CV vive in `src/data/cv.ts`, tipizzato. Le
  pagine non contengono nessuna stringa di contenuto.
- **Grafica**: ogni dettaglio pixel-art vive in `components/ui/`.
  Cambiare pack grafico non tocca le pagine.
- **Scenografia**: cielo, stelle e skyline vivono in
  `src/components/scenery/`, disegnati in SVG inline. Non conoscono il
  contenuto e il contenuto non conosce loro: togliendo l'intero layer il
  CV resta completo. La palette ambientale (`--sky-*`, `--city-*`) e
  separata da quella dell'interfaccia e nessun componente di UI puo usarla.

## Deploy

Push su `main` -> GitHub Action -> GitHub Pages, con
`VITE_BASE_PATH=/InteractiveCV/`. Il build copia `index.html` in
`404.html`, cosi un refresh su `/skills` non da errore su Pages.

Passaggio a dominio custom: impostare `VITE_BASE_PATH=/` nel workflow e
aggiungere `public/CNAME` con il dominio. Nessuna modifica al codice.

## Documentazione

- Design: [docs/superpowers/specs/2026-08-19-interactive-cv-8bit-design.md](docs/superpowers/specs/2026-08-19-interactive-cv-8bit-design.md)
- Piano di implementazione: [docs/superpowers/plans/2026-08-19-interactive-cv-8bit.md](docs/superpowers/plans/2026-08-19-interactive-cv-8bit.md)

## Stato

Implementazione completa: routing, sette schermate, navigazione doppia
(tastiera e puntatore), animazioni con guardia `prefers-reduced-motion`,
deploy automatico.

Restano da fornire:

- `public/cv.pdf` — al momento e un placeholder, non un PDF valido.
- I contenuti reali in `src/data/cv.ts` — al momento placeholder.
- Il pack grafico CC0 e opzionale: `Frame` disegna il bordo in CSS, il
  sito e completo senza.
