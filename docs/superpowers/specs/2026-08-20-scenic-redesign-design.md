# Interactive CV — Restyle scenografico

Data: 2026-08-20
Stato: approvato
Spec precedente: `2026-08-19-interactive-cv-8bit-design.md` (resta valida,
questa la estende)

## 1. Obiettivo

Il sito funziona ed e accessibile, ma e piatto: fondo tinta unita, una
colonna da 960px, pannelli tutti sullo stesso piano, nessuna profondita.
Questo restyle gli da un ambiente e un ritmo, senza toccare i contenuti,
il routing o il modello dati.

Non e una riscrittura. `src/data/`, `src/routes/*.tsx` e `src/hooks/`
restano sostanzialmente come sono: cambia il sistema visivo, nasce un
layer scenografico, si ricompone la shell.

## 2. Decisioni prese

| Tema | Decisione |
|---|---|
| Registro | Doppio: spettacolo su title screen, sfondo e transizioni; contenuto sobrio e leggibile |
| Ambiente | Cielo notturno con skyline urbano pixel, tre piani in parallasse |
| Asset | Nessuno esterno: SVG inline disegnato nel repo |
| Motore del movimento | CSS `animation-timeline`, dentro `@supports`, con lo stato finale come default |
| Scroll | Scorre la pagina; header e scenografia sono `position: fixed` |
| Effetti CRT | Solo scanline, solo sulla title screen, `opacity` <= 0.06 |
| Fuori scope | Audio, sprite animati, minigiochi, canvas, WebGL, librerie di animazione |

La spec precedente escludeva gli effetti CRT del tutto. Questa riapre
quella decisione limitatamente alla title screen: e l'unica schermata
senza testo da leggere.

## 3. Sistema visivo esteso

### 3.1 Colori

I sei token esistenti restano invariati e mantengono il loro
significato. `--c-accent` continua a valere solo per stato attivo e
valori numerici.

I nuovi token sono **ambientali**: descrivono la scena, non l'interfaccia.
Nessun componente di UI puo usarli.

```css
--sky-zenith:  #070912;  /* cielo alto */
--sky-horizon: #2a2038;  /* verso l'orizzonte, piu caldo */
--city-far:    #161b2e;  /* palazzi lontani */
--city-near:   #080a12;  /* palazzi vicini, quasi neri */
--star:        #e8e6da;  /* = --c-ink, alias semantico */
--window:      #f2c94c;  /* = --c-accent, alias semantico */

--glow-accent: 0 0 12px rgb(242 201 76 / 0.45);
--glow-cyan:   0 0 12px rgb(56 182 255 / 0.40);
```

Gli alias `--star` e `--window` esistono perche una finestra accesa non e
"lo stato attivo": condividono il valore, non il ruolo. Se un giorno la
palette dell'UI cambia, la scena non deve cambiare con lei.

### 3.2 Tipografia

Oggi le dimensioni sono sparse a mano nei moduli: 12, 13, 14, 16, 18, 48px,
senza sistema. Diventano token.

```css
--fs-1: 12px;   --fs-2: 14px;   --fs-3: 16px;   --fs-4: 20px;
--fs-5: 24px;   --fs-6: 32px;   --fs-7: 48px;   --fs-8: 64px;
```

Valori interi, non una scala modulare frazionaria: un font pixel
renderizzato a 17.6px sfarfalla. Il corpo del testo resta `1rem` con
interlinea 1.7 e misura massima 65 caratteri.

Il titolo della title screen usa `clamp(var(--fs-6), 9vw, var(--fs-8))`.
E l'unica eccezione al vincolo dell'intero: e display, non testo da
leggere, e la sfocatura sui valori intermedi non e percepibile a quella
dimensione.

### 3.3 Profondita

Tre piani, dichiarati come z-index token:

```css
--z-scenery: 0;   /* cielo, stelle, skyline */
--z-content: 10;  /* pannelli e testo */
--z-shell:   20;  /* header e menu, sempre sopra */
```

I `--z-shell` e `--z-overlay` esistenti vengono assorbiti da questa scala.

`Frame` guadagna una prop `depth` con due valori: `flat` (default, come
oggi) e `raised` (ombra piu marcata e alone tenue). Nessun altro
componente cambia interfaccia.

## 4. Layer scenografico

Nuova cartella `src/components/scenery/`. Tutto SVG inline, tutto
`aria-hidden="true"`, nessun contenuto accessibile.

| Componente | Cosa disegna |
|---|---|
| `Sky` | Gradiente verticale zenith -> horizon, piu vignetta radiale |
| `Stars` | ~60 rect da 1-2px su tre livelli di luminosita |
| `Moon` | Disco pixel con alone |
| `Skyline` | Due strati di palazzi; quello vicino ha finestre accese |
| `Scenery` | Compone i quattro, gestisce il posizionamento fisso |

`Scenery` e montato una volta sola, in `ArcadeShell` e in `TitleScreen`.
Prende una prop `intensity: 'full' | 'muted'`: `full` sulla title screen
(skyline alto, stelle luminose), `muted` sulle sezioni (skyline basso,
stelle attenuate) cosi non compete col testo.

**Confine:** la scenografia non conosce il contenuto e il contenuto non
conosce la scenografia. Nessuna schermata importa da `scenery/`.
Sostituire l'intero ambiente tocca solo quella cartella.

Le stelle sono generate da un array di posizioni costanti nel modulo, non
casuali a runtime: un layout stabile tra un render e l'altro, e nessuna
dipendenza da `Math.random` nei test.

## 5. Struttura della shell

### 5.1 Il modello di scroll, e perche

L'idea intuitiva — cornice fissa con dentro un contenitore che scorre —
**non e costruibile con `animation-timeline`**. `scroll()` risale la
catena degli antenati per trovare il proprio scroller: la scenografia
sarebbe sorella del contenitore che scorre, non discendente, e il
parallasse non aggancerebbe nulla.

Il modello corretto rende a schermo lo stesso risultato:

- Scorre la pagina (`document`), non un contenitore interno
- `header` e `Scenery` sono `position: fixed`
- `main` ha `padding-top` pari all'altezza dell'header

Visivamente identico: header e cielo inchiodati, contenuto che scorre.
In piu, funziona senza JavaScript e mantiene lo scroll nativo del
browser — barra di scorrimento di sistema, gesture, `Home`/`End`,
ricerca nella pagina.

### 5.2 Header

Resta com'e nella sostanza (skip link, brand, `NavMenu`), ma prende un
fondo semi-opaco con `backdrop-filter` cosi il contenuto che gli passa
sotto non lo rende illeggibile. Fallback dichiarato: dove
`backdrop-filter` manca, fondo pieno `--c-panel`.

## 6. Title screen

L'unica schermata pensata per essere guardata, non letta.

- `Scenery` a `intensity="full"`, skyline che arriva a meta viewport
- Nome in `clamp(--fs-6, 9vw, --fs-8)` con `--glow-accent`, typewriter
- Sottotitolo con il livello che conta
- `PRESS START` che lampeggia
- Scanline: `repeating-linear-gradient` a 2px, `opacity: 0.06`,
  `pointer-events: none`, `aria-hidden`

Le scanline sono confinate qui. Su qualunque schermata con testo da
leggere abbassano il contrasto senza aggiungere informazione.

## 7. Schermate di sezione

Il contenuto non cambia. Cambia il ritmo attorno.

- Il titolo di sezione esce dal pannello e diventa `--fs-6`, allineato a
  sinistra, con un filetto sotto
- Un indice `02 / 07` a lato del titolo, in `--fs-1`, colore `--c-accent`
- Su viewport >= 1024px, griglia asimmetrica: colonna stretta per titolo e
  indice, colonna larga per il contenuto. Sotto quella soglia, una colonna
- I pannelli restano `depth="flat"`; solo la voce piu recente del Quest Log
  usa `raised`

`Panel` oggi rende il titolo come `<h2>` al suo interno. Con il titolo
fuori dal pannello, l'`<h2>` si sposta nel nuovo componente
`ScreenHeader` e `Panel` guadagna una variante senza titolo. **La
gerarchia dei heading non cambia**: resta un solo `<h2>` per schermata,
e i test esistenti che lo cercano continuano a passare.

## 8. Movimento

### 8.1 Il contratto

Tre stati, in quest'ordine di precedenza:

1. `prefers-reduced-motion: reduce` -> nessuna animazione, stato finale
2. Nessun supporto per `animation-timeline` -> nessuna animazione legata
   allo scroll, stato finale
3. Altrimenti -> animazioni attive

**Lo stato finale e il default del CSS.** Le animazioni si aggiungono
dentro `@supports (animation-timeline: view())`, mai il contrario. Un
elemento non puo restare invisibile perche il browser non ha capito una
regola: se non capisce la regola, l'elemento e semplicemente li.

Questa e la differenza pratica rispetto a scrivere `opacity: 0` nel CSS
base e alzarlo con l'animazione — approccio comune e fragile, qui
escluso.

### 8.2 Cosa si muove

| Cosa | Come |
|---|---|
| Parallasse cielo | `animation-timeline: scroll(root)`, tre velocita: stelle 0.1, skyline lontano 0.25, vicino 0.5 |
| Rivelazione pannelli | `animation-timeline: view()`, `translateY(8px)` + `opacity`, `steps(4)` |
| Finestre accese | `opacity` alternata, `steps(1)`, durate primarie fra loro cosi il pattern non si ripete a occhio |
| Stelle | Ammiccano solo alcune, `steps(1)` |
| Wipe fra route | Resta com'e oggi |

`steps()` ovunque: un movimento continuo tradisce l'estetica. Il
parallasse e l'unica eccezione — a scatti darebbe l'impressione di un bug,
non di un gioco a 8 bit.

## 9. Accessibilita

Tutto quanto gia garantito resta garantito. In piu:

- Ogni nodo della scenografia e `aria-hidden="true"`
- Le scanline non intercettano il puntatore
- Il contrasto testo/fondo resta AA: il gradiente del cielo e sempre sotto
  `--c-panel`, mai direttamente sotto il testo
- L'header semi-opaco ha un fallback opaco dichiarato
- Lo scroll resta quello nativo: nessuno scroll-jacking, nessuno snap

Vincolo non negoziabile: nessuna informazione veicolata dalla scena.
Togliendo l'intero layer scenografico il CV resta completo.

## 10. Testing

I 52 test esistenti devono restare verdi **senza essere modificati**. Se
un test va cambiato per far passare il restyle, e un segnale che il
restyle ha superato il suo mandato: il comportamento non doveva cambiare.

Il punto piu a rischio e lo spostamento dell'`<h2>` da `Panel` a
`ScreenHeader` (sezione 7). Le query esistenti cercano un heading di
livello 2 con un dato nome, non la sua posizione nell'albero, quindi
devono continuare a trovarlo: `Panel` mantiene la prop `title` e il suo
`<h2>`, e guadagna in piu una variante senza titolo che le schermate
usano quando il titolo sta gia in `ScreenHeader`. Nessuna schermata puo
rendere due `<h2>`.

Nuovi test:

- `Scenery` non espone contenuto accessibile: `getByRole` non trova nulla
  al suo interno, ogni radice SVG e `aria-hidden`
- Le posizioni delle stelle sono deterministiche: due render danno lo
  stesso output
- Ogni schermata ha il suo testo nel DOM senza alcuna animazione — e la
  garanzia della sezione 8.1, ed e l'unico modo di verificarla
- `Frame` con `depth="raised"` applica la classe, `flat` no
- `ScreenHeader` rende titolo e indice, e l'indice non e leggibile solo
  come colore

Limite dichiarato: jsdom non valuta `@supports`, `@media` nei fogli di
stile, ne `animation-timeline`. Che i tre stati della sezione 8.1 si
comportino davvero come descritto non e verificabile automaticamente.
Vale gia oggi per `prefers-reduced-motion` nel CSS. La verifica e
manuale, ed e elencata fra i punti aperti.

## 11. Fuori scope

Audio, sprite di personaggi, minigiochi, canvas, WebGL, librerie di
animazione, i18n, CMS, backend, cambio di font, cambio di routing,
modifiche a `src/data/cv.ts`.

## 12. Punti aperti

1. Verifica manuale a schermo dei tre stati di movimento (sezione 8.1),
   inclusa una prova con `prefers-reduced-motion` attivo a livello di
   sistema
2. Numero e disposizione dei palazzi: da tarare guardando, non da
   decidere a tavolino
3. L'indice di sezione `02 / 07` presuppone un ordine fisso delle sezioni:
   e gia cosi in `MENU_ITEMS`, ma il numero va derivato da li e non
   scritto a mano
