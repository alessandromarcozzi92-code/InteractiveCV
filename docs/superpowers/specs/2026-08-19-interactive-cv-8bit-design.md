# Interactive CV 8-bit — Design

Data: 2026-08-19
Stato: approvato (sezioni 4-6 da confermare)

## 1. Obiettivo

CV personale come sito multipagina con estetica arcade 8-bit. L'utente
naviga schermate in stile console (title screen, stats, skill tree,
quest log) invece di scorrere un documento. Non e un videogioco: niente
game loop, niente fisica, niente livelli platform.

## 2. Vincoli e decisioni prese

| Tema | Decisione |
|---|---|
| Accesso ai contenuti | Nessun contenuto e "sbloccabile": ogni sezione raggiungibile dal menu in un click |
| Gameplay | Nessuno. Solo navigazione tra schermate |
| Navigazione | Tastiera (frecce/WASD, Enter, Esc) **e** mouse/touch, stessa logica |
| Stile | Full 8-bit con asset pack CC0 (nessun disegno originale richiesto) |
| Dati | Placeholder ora in un unico file tipizzato, contenuti reali dopo |
| PDF | Voce "SAVE GAME" che scarica il CV classico |
| Hosting | GitHub Pages ora, dominio custom dopo (cambio di una variabile) |
| Fuori scope | Audio, effetti CRT, sprite personaggio animato, minigiochi, i18n, CMS, backend |

## 3. Stack

- Vite + React + TypeScript
- React Router (route reali, una per sezione)
- CSS nativo con custom properties + CSS Modules per componente. Nessun
  framework CSS: il look e cosi specifico che una utility library
  aggiungerebbe peso senza risparmiare lavoro
- Vitest + React Testing Library
- Deploy: GitHub Actions -> GitHub Pages

## 4. Struttura del progetto

```
src/
  data/cv.ts            # UNICA fonte dati + tipi TS
  routes/               # una cartella per pagina
  components/ui/        # design system: Frame, PixelButton, StatBar, Panel, Cursor, Icon
  components/layout/    # ArcadeShell, NavMenu
  hooks/                # useMenuNavigation, useTypewriter, useAnimatedNumber
  styles/tokens.css     # palette, spaziature, font, z-index
public/
  assets/ui/            # pack CC0 (cornici, bottoni, icone)
  cv.pdf                # file servito da "SAVE GAME"
```

Confine chiave: le pagine compongono solo componenti `ui/` e leggono
solo da `data/cv.ts`. Nessuna stringa di contenuto e nessun path di
asset dentro le pagine. Cambiare pack grafico tocca solo
`components/ui/`; cambiare contenuti tocca solo `data/cv.ts`.

## 5. Pagine

| Route | Schermata | Contenuto |
|---|---|---|
| `/` | Title screen | Nome/logo, "PRESS START" lampeggiante, menu iniziale |
| `/stats` | Player Profile | Dati personali, class, level, bio |
| `/skills` | Skill Tree | Competenze con barre di livello, per categoria |
| `/quests` | Quest Log | Esperienze lavorative: ruolo, azienda, date, risultati, tech |
| `/training` | Training Grounds | Istruzione, corsi, certificazioni |
| `/inventory` | Inventory | Lingue, soft skill, interessi come "passive abilities" |
| `/contact` | Contact | Email, link, "SAVE GAME" -> `cv.pdf` |

`ArcadeShell` avvolge tutte le route tranne `/`: menu orizzontale
persistente, cursore `>` sulla voce attiva, area schermo sotto.

## 6. Modello dati

Tutto in `src/data/cv.ts`, tipizzato ed esportato come singolo oggetto
`cv`. Forma indicativa:

```ts
type SkillCategory = 'lang' | 'framework' | 'tool' | 'soft'

type Skill = { name: string; level: number; category: SkillCategory }

type Quest = {
  title: string; org: string; from: string; to: string | 'NOW'
  achievements: string[]; tech: string[]
}

type Training = { title: string; org: string; year: string; note?: string }

type InventoryItem = { name: string; kind: 'language' | 'ability'; detail: string }

type Profile = {
  name: string; class: string; level: number; location: string
  bio: string; email: string; links: { label: string; url: string }[]
}
```

`level` di `Skill` e 0-100 e guida la larghezza della barra. Nessun
componente calcola contenuto: solo presentazione.

## 7. Sistema visivo

**Palette** (6 colori, definiti in `tokens.css`):

- `--c-bg` #10131c fondo notte
- `--c-panel` #1d2233 pannelli
- `--c-ink` #e8e6da testo
- `--c-accent` #f2c94c oro/coin (voce attiva, valori)
- `--c-accent-2` #38b6ff ciano (link, focus)
- `--c-hp` #6ee06e barre positive

Regola: `--c-accent` solo per lo stato attivo e i numeri. Se un colore
compare ovunque smette di significare qualcosa.

**Tipografia**: font pixel leggibile (Silkscreen o Departure Mono, OFL,
self-hosted in `public/fonts` per non dipendere da CDN esterni).
Titoli in maiuscolo con letter-spacing, corpo minimo 16px e interlinea
1.7. Paragrafi max 65 caratteri di larghezza: e la contromisura
principale al font pixel che affatica.

**Asset CC0**: pack Kenney (UI Pack / RPG expansion, licenza CC0,
nessuna attribuzione obbligatoria) per cornici, bottoni, icone. Le
cornici si scalano con `border-image` a 9 riquadri, cosi un unico PNG
serve pannelli di qualsiasi dimensione senza sfocature. Tutte le
immagini con `image-rendering: pixelated`.

**Componenti `ui/`**:

- `Frame` — pannello con bordo 9-slice, prop `variant`
- `Panel` — Frame + titolo a nastro
- `PixelButton` — bottone con stato press (traslazione 2px + ombra dura)
- `StatBar` — barra a blocchi discreti, non gradiente continuo
- `Cursor` — indicatore `>` della voce attiva
- `Icon` — wrapper su icone del pack, con `alt` sempre testuale

## 8. Animazioni

Tutte in CSS, `steps()` dove serve lo scatto retro (nessuna easing
morbida: il movimento continuo tradisce l'estetica 8-bit).

- Transizione tra route: wipe orizzontale a bande, ~220ms
- Title screen: "PRESS START" blink 1s steps(1)
- Typewriter su bio e titoli di sezione al mount (`useTypewriter`)
- `StatBar`: riempimento a blocchi al mount, uno ogni 40ms
- Numeri (level, anni): conteggio incrementale (`useAnimatedNumber`)
- Hover/focus voce di menu: cursore che salta di posizione, scatto
- `prefers-reduced-motion: reduce`: typewriter, wipe e riempimenti
  disattivati, stato finale mostrato subito. Non negoziabile

## 9. Accessibilita

- Ogni voce di menu e un link reale: raggiungibile con Tab, apribile in
  nuova scheda, indicizzabile
- `aria-current="page"` sulla voce attiva; il cursore `>` e decorativo
  (`aria-hidden`)
- Focus visibile a contrasto alto (outline 2px `--c-accent-2`), mai
  rimosso
- Contrasto testo/fondo conforme AA
- Nessuna informazione veicolata solo da colore o solo da icona
- Skip link verso il contenuto della schermata

## 10. Testing

Vitest + React Testing Library. Copertura mirata al comportamento, non
alla resa grafica:

- `useMenuNavigation`: le frecce spostano la selezione, Enter naviga,
  Esc torna alla title screen, il wrap-around funziona ai bordi
- Routing: ogni route monta la schermata giusta; route ignota -> 404 interna
- Pagine data-driven: aggiungere una skill a `cv.ts` produce una barra in
  piu; nessun testo hardcoded nelle pagine
- `StatBar`: `level` fuori range viene limitato a 0-100
- Reduced motion: con la media query attiva il contenuto e presente
  subito nel DOM

Fuori scope: test end-to-end con browser reale (Playwright). Il valore
non giustifica la manutenzione per un sito di 7 schermate statiche.

## 11. Deploy

- `vite.config.ts` legge `base` da `VITE_BASE_PATH` (default `/` in dev,
  `/InteractiveCV/` in produzione GitHub Pages)
- `basename` del router dalla stessa variabile
- `404.html` copiato da `index.html` in build, cosi il refresh su
  `/skills` non da errore su Pages
- GitHub Action: build su push a `main`, publish su Pages
- Passaggio a dominio custom: `VITE_BASE_PATH=/` e file `CNAME`. Nessuna
  modifica al codice

## 12. Punti aperti

1. `public/cv.pdf` — file da fornire (fino ad allora, placeholder)
2. Contenuti reali del CV — da fornire, sostituiscono i placeholder
3. Scelta finale del pack CC0 e del font pixel: da validare a schermo sul
   primo componente costruito
