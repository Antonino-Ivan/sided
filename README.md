# Sided

Il social delle scelte: due lati, nessuna via di mezzo.
Scorri un feed verticale di scelte contrapposte, voti, vedi dove ti colloca il
tuo voto e apri la discussione.

**Questo repository contiene solo il frontend.** Non esiste un backend, ed è una
scelta deliberata: finché il prodotto è in validazione, tutto lo stato
dell'utente vive nel browser. L'app è però completamente funzionante — i voti
spostano davvero le percentuali, la ricerca cerca, i commenti si aggiungono e
tutto sopravvive a un refresh.

---

## Avvio rapido

Serve Node.js `>= 22.13`.

```bash
npm ci
npm run dev
```

| Comando | Cosa fa |
|---|---|
| `npm run dev` | Server di sviluppo con HMR |
| `npm run build` | Build di produzione in `dist/` |
| `npm start` | Serve la build di produzione |
| `npm test` | Test sulla logica di dominio (veloci, senza build) |
| `npm run test:ssr` | Build + smoke test del render sul server |
| `npm run test:all` | Tutti i test |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript in modalità strict |

---

## Come è fatto

```text
app/
  page.tsx            Punto d'ingresso: monta <SidedApp />
  layout.tsx          Metadata, lingua, favicon
  globals.css         Importa Tailwind e i file di styles/
lib/
  types.ts            Il dominio: Choice, ChoiceOption, Comment, Person…
  seed.ts             Contenuto dimostrativo, ancorato a un timestamp
  format.ts           Percentuali, numeri compatti, tempi relativi
  router.ts           Rotte basate su hash
  storage.ts          Accesso sicuro e versionato a localStorage
  ids.ts              Generazione id
state/
  store.ts            Lo "pseudo-backend": stato utente + persistenza
  context.tsx         Provider React, fonde seed e dati utente
  selectors.ts        Funzioni derivate pure (feed, ricerca, statistiche)
hooks/
  useHashRoute.ts     Navigazione legata all'URL
  useSwipeDeck.ts     Gesture verticale del feed
  useTheme.ts         Tema chiaro/scuro/sistema
  ui.ts               Reveal, dialog accessibili, clipboard, haptics
components/
  SidedApp.tsx        Guscio e router
  shell/              Brand rail, topbar, bottom nav, toast
  screens/            Una schermata per file
  choice/             Scheda di voto, risultati, riga compatta
  ui/                 Primitive: Avatar, Sheet, Switch, Chip…
  sheets/             Impostazioni, modifica profilo, onboarding
styles/
  tokens.css          Colori, spazi, tipografia, motion
  base.css            Reset e stili condivisi
  ui.css              Primitive
  shell.css           Layout e navigazione
  choice.css          La scheda di scelta
  discussion.css      Thread e commenti
  screens.css         Stili per schermata
  motion.css          Animazioni e prefers-reduced-motion
tests/
  logic.test.mjs      Unit test sul dominio
  ssr.test.mjs        Smoke test del render sul server
```

### Le tre decisioni che spiegano il resto

**1. Il voto è un conteggio, non una percentuale.**
Ogni opzione ha un numero di voti reale; le percentuali si derivano con il
metodo dei resti più grandi, così sommano sempre a 100 e il tuo voto sposta
davvero il risultato. Il prototipo precedente teneva un `percentA` fisso: votare
non cambiava nulla.

**2. Lo stato utente vive in uno store esterno, non in `useState`.**
`state/store.ts` è un piccolo store con `subscribe`/`getSnapshot`, letto da
React con `useSyncExternalStore`. Serve perché il primo render avviene sul
server, dove `localStorage` non esiste: lo store dichiara uno snapshot "server"
stabile e passa a quello reale dopo l'idratazione, senza mismatch e senza
scrivere stato dentro un effect.

Tutti i contenuti seed sono ancorati a `state.now`. Server e client partono
dallo stesso valore, quindi "45 min" resta "45 min" in entrambi i render.

**3. La schermata attiva è nell'URL.**
Ogni sezione ha un suo hash (`#/scelta/c6`, `#/esplora?q=mare`, `#/chat/sara`).
Avanti/indietro del browser funzionano e un link a una singola scelta si può
condividere. È l'hash e non un path reale perché il sito gira su un Worker che
serve una sola route: con path veri un refresh su `/esplora` darebbe 404 senza
un fallback lato server.

---

## Cosa fa davvero

- **Feed** — tre modalità che ordinano diversamente: *Per te* (attività pesata
  sulla freschezza), *Trend* (voti totali), *Seguiti* (solo chi segui). Swipe,
  rotella del mouse, frecce ↑/↓.
- **Voto** — quattro formati: due lati, multi (3–8 opzioni), chained (scelte
  consecutive a coppie), contest (torneo a eliminazione).
- **Discussione** — commenti con risposte, upvote, ordinamento hot/recenti,
  filtro per lato. I commenti sono legati all'opzione votata, quindi funzionano
  anche con otto opzioni.
- **Esplora** — ricerca su scelte, persone e categorie, insensibile agli
  accenti; filtro per categoria. Query e filtro finiscono nell'URL.
- **Amici** — cosa ha scelto chi segui, follow/unfollow che cambia il feed
  *Seguiti*, profili con affinità calcolata sui tuoi voti.
- **Crea** — composizione con anteprima dal vivo, media per opzione, background
  condiviso, audio.
- **Attività** — notifiche con stato letto/non letto e chat persistenti, con
  possibilità di allegare una scelta.
- **Profilo** — statistiche derivate dai tuoi voti veri, "choice map" per
  categoria, scelte recenti, gestione di quelle che hai pubblicato.
- **Impostazioni** — tema, notifiche, profilo privato, simulazione della
  community live, cancellazione dei dati locali.

Tutto è in italiano, funziona in chiaro e scuro, rispetta
`prefers-reduced-motion` e si usa da tastiera.

---

## Limiti noti (conseguenze del non avere un backend)

- **I dati sono solo tuoi e solo su questo dispositivo.** Nessuna
  sincronizzazione, nessun account, nessuna moderazione.
- **I media non sopravvivono al refresh.** Gli upload diventano URL `blob:`,
  validi solo per la sessione: al reload vengono scartati invece di mostrare
  immagini rotte.
- **Le opinioni degli altri sono simulate**, in modo deterministico a partire
  dagli id, così i numeri restano stabili fra un render e l'altro.
- **La "community live"** che fa salire i voti è una simulazione, disattivabile
  dalle impostazioni.
- **`db/`, `drizzle/` ed `examples/d1/`** sono scaffolding rimasto dallo starter
  e non sono usati da nessuna parte.

## Quando arriverà il backend

`state/store.ts` è il punto di innesto: è l'unico file che sa dove finiscono i
dati. Sostituire i suoi metodi con chiamate HTTP, mantenendo la stessa forma
dello stato, non richiede di toccare i componenti. I selettori in
`state/selectors.ts` sono già puri e testati.

L'helper `app/chatgpt-auth.ts` (Sign in with ChatGPT) è pronto ma non collegato:
le route `/signin-with-chatgpt`, `/signout-with-chatgpt` e `/callback` sono
riservate alla piattaforma e non vanno implementate qui.

---

## Vincoli tecnici da rispettare

- **Non cambiare a caso la catena vinext / Vite / Cloudflare**: è ciò che rende
  il codice compatibile con l'hosting attuale.
- **Conservare `.openai/hosting.json`** e il suo `project_id` se l'obiettivo è
  aggiornare lo stesso sito.
- **Usare `npm ci`** e conservare `package-lock.json`: Next, React RSC, Vite e i
  plugin Cloudflare sono strettamente accoppiati.
- **TypeScript strict e output Worker ESM** fanno parte della pipeline
  funzionante.

`HANDOFF.md` descrive lo stato del prototipo *precedente* a questa riscrittura:
va letto come documento storico, non come descrizione del codice attuale.

## Licenza

MIT — vedi [LICENSE](LICENSE).
