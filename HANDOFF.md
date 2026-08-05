# Handoff tecnico — Sided

> **Documento storico.** Descrive il prototipo *prima* della riscrittura del
> frontend. Per lo stato attuale del codice — architettura, comandi, cosa
> funziona e cosa manca — vedi [`README.md`](./README.md).

Questo documento descrive lo stato reale del commit sorgente della versione Sites 29 (`7b3379a76f1eda8bfbaa3f9b129d5d58808b2051`), verificato il 3 agosto 2026. Le osservazioni su build, test, lint e dipendenze si riferiscono esattamente a questo codice più i soli file di handoff (`HANDOFF.md`, `.env.example` e l'eccezione corrispondente in `.gitignore`).

## 1. Cosa fa l'app

Sided è un prototipo di social network italiano basato su domande a scelta contrapposta, pensato per persone che vogliono confrontare gusti e opinioni.  
L'utente scorre verticalmente un feed di scelte, vota un'opzione e vede percentuali, commenti e presunte scelte degli amici.  
Può aprire la discussione, aggiungere un commento, esplorare temi e visualizzare attività, chat e un profilo personale.  
Può anche creare scelte classiche, a quattro opzioni, concatenate o a torneo, allegando media e audio locali.  
Il flusso principale è: apri Home → scorri una scheda → vota → consulta il risultato/discussione → passa alla scelta successiva.

## 2. Stato attuale

### Cosa funziona davvero

- La pagina `/` viene renderizzata correttamente e la build di produzione termina con successo.
- La navigazione client tra Home, Esplora, Amici, Crea, Attività e Profilo funziona senza cambiare URL.
- Il feed supporta click/tap, trascinamento verticale, gesture con inerzia, rotella del mouse e transizioni; rispetta `prefers-reduced-motion`.
- Il voto, il cambio voto, i filtri dei commenti, l'aggiunta di un commento, le chat locali e la creazione di una nuova scelta funzionano finché la pagina resta aperta.
- I formati `classic`, `four`, `chain` e `contest` hanno logica UI locale; immagini, video e audio vengono mostrati tramite URL `blob:` del browser.
- Tema (`system`/`light`/`dark`), toggle notifiche e profilo privato restano salvati in `localStorage` sul dispositivo.
- Layout responsive, modalità scura, focus visibile e diversi accorgimenti di accessibilità/motion sono implementati nel CSS.

### Cosa è mockato o finto

- Tutto il contenuto sociale iniziale è hardcoded in `app/page.tsx`: scelte, utenti, amici, commenti, chat, notifiche, statistiche, profilo, trend e categorie.
- Le percentuali binarie sono valori statici; quelle multi-opzione sono generate da pesi decrescenti fissi. Un nuovo voto non modifica i totali della community.
- Il contatore della discussione aggiunge sempre `36`; voti degli amici, attività, match, utenti online e metriche della community sono puramente dimostrativi.
- I tre feed `Per te`, `Trend` e `Seguiti` cambiano solo lo stato visivo del selettore: non cambiano realmente i dati.
- Pubblicazione, commenti e messaggi aggiornano solo lo stato React in memoria. Non esistono chiamate HTTP applicative.
- Upload media/audio significa solo anteprima locale: nessun file viene caricato su un server o storage.

### Cosa è solo abbozzato o inerte

- Autenticazione ChatGPT: esiste un helper completo in `app/chatgpt-auth.ts`, ma la pagina non lo importa e non lega alcun dato all'utente autenticato.
- D1/Drizzle: client e configurazione sono presenti, ma lo schema reale è vuoto, il binding D1 è disattivato e non ci sono migration SQL.
- Ricerca Esplora, categorie, “Vedi tutte”, hot thread, follow, upvote/risposta ai commenti, modifica profilo e allegato in chat non hanno logica reale.
- Notifiche e privacy sono preferenze cosmetiche locali e non controllano consegna eventi o autorizzazioni server.
- `examples/d1/` è solo esempio di starter e non viene montato come route dell'app.

## 3. Stack

| Area | Tecnologia e versione effettiva | Motivo/stato |
|---|---|---|
| Linguaggio | TypeScript `5.9.3`, modalità `strict` | Tipizzazione del codice React e del Worker. |
| UI | React `19.2.6`, React DOM `19.2.6` | Interfaccia client ricca e stato locale. |
| Framework API | Next.js `16.2.6` (App Router) | Convenzioni di layout, metadata, route e header; non usa il builder Next standard. |
| Runtime/build | vinext `0.0.50` su Vite `8.0.13` | Adatta le API Next al build ESM per Cloudflare Workers/Sites. Questa scelta deriva dallo starter Sites. |
| Hosting locale/edge | `@cloudflare/vite-plugin 1.37.1`, Wrangler `4.92.0` | Simulazione locale e output compatibile con Worker/Assets/Images. |
| Stili | Tailwind CSS `4.2.1` via `@tailwindcss/postcss 4.2.1`, più circa 4.000 righe di CSS scritto a mano | Tailwind è importato, ma quasi tutto il design usa classi CSS custom e variabili. |
| Icone | `lucide-react 1.28.0` | Icone UI React. |
| Dati opzionali | `drizzle-orm 0.45.2`, `drizzle-kit 0.31.10`, SQLite/D1 | Scaffold predisposto per Cloudflare D1, attualmente non usato. |
| Lint | ESLint `9.39.4`, `eslint-config-next 16.2.6` | Regole Next/TypeScript; al momento il lint fallisce. |
| Test | Node test runner incorporato | Esistono due test SSR, ma sono rimasti quelli dello starter e falliscono. |
| Package manager | npm; `package-lock.json` lockfile v3 | Usare `npm ci` per riprodurre le versioni. npm non è pin-nato nel repo. |
| Runtime richiesto | Node.js `>=22.13.0` | Dichiarato in `package.json`. Verificato localmente con Node `24.18.0` e npm `11.16.0`. |

Le versioni sopra sono quelle risolte dal lockfile, non stime. Il nome npm (`site-creator-vinext-starter`) e la versione `0.1.0` sono ancora quelli del template.

## 4. Mappa delle cartelle

```text
.
├─ app/
│  ├─ page.tsx                  [CUORE] Tutti i dati mock, tipi, stato, gesture, form e schermate Sided.
│  ├─ globals.css               [CUORE] Intero design system visuale, responsive, temi e animazioni.
│  ├─ layout.tsx                Metadata, favicon, lingua italiana e root layout.
│  └─ chatgpt-auth.ts           Helper SIWC/ChatGPT pronto ma non usato dalla UI.
├─ public/
│  ├─ sided-icon.png            Asset brand usato nell'app e come icona.
│  └─ favicon.svg, file.svg,
│     globe.svg, window.svg     [BOILERPLATE] Asset dello starter non usati dalla UI principale.
├─ worker/
│  └─ index.ts                  Entry Cloudflare Worker; delega a vinext e gestisce /_vinext/image.
├─ build/
│  └─ sites-vite-plugin.ts      Script sorgente di build: copia metadata Sites e migration in dist.
├─ db/
│  ├─ index.ts                  Factory Drizzle per binding D1 `DB`; oggi non viene chiamata.
│  └─ schema.ts                 Schema reale intenzionalmente vuoto.
├─ drizzle/
│  └─ meta/_journal.json        Journal vuoto; nessuna migration applicativa esiste.
├─ examples/d1/                 [BOILERPLATE] Esempio notes D1 non incluso nelle route attive.
│  ├─ app/api/notes/route.ts    Esempio GET/POST, non è /app/api e quindi non viene pubblicato.
│  └─ db/schema.ts              Tabella notes di esempio, non importata dallo schema reale.
├─ tests/
│  └─ rendered-html.test.mjs    [OBSOLETO] Test dello skeleton starter; entrambi falliscono su Sided.
├─ .openai/
│  └─ hosting.json              ID del progetto Sites; D1 e R2 sono null. Non contiene segreti.
├─ .env.example                 Nessuna variabile richiesta; documenta solo default opzionali.
├─ package.json                 Script, engine e dipendenze dirette.
├─ package-lock.json            Lockfile completo npm; conservarlo.
├─ vite.config.ts               [CUORE BUILD] vinext, plugin Sites e simulazione binding Cloudflare.
├─ next.config.ts               [BOILERPLATE] Config Next vuota.
├─ drizzle.config.ts            Config generazione migration SQLite.
├─ eslint.config.mjs            Regole lint Next/TypeScript.
├─ postcss.config.mjs           Pipeline Tailwind/PostCSS.
├─ tsconfig.json                TypeScript strict e alias `@/*`.
├─ README.md                    [OBSOLETO] README generico dello starter, non descrive Sided.
└─ HANDOFF.md                   Questo documento.
```

`build/sites-vite-plugin.ts` è codice sorgente necessario, non un artifact. Gli artifact veri (`dist/`, `.next/`, `.vinext/`, `.wrangler/`) e `node_modules/` sono ignorati e non fanno parte dell'export.

## 5. Come si avvia in locale

Prerequisito: Node.js `>=22.13.0`. Da una cartella vuota, usando lo ZIP consegnato:

```bash
unzip /percorso/sided-handoff.zip
cd sided
npm ci
npm run dev
```

Su PowerShell, il primo comando equivalente è:

```powershell
Expand-Archive -Path C:\percorso\sided-handoff.zip -DestinationPath .
Set-Location .\sided
npm ci
npm run dev
```

Aprire l'URL locale stampato da vinext/Vite. Altri comandi:

```bash
npm run build      # PASSA: genera dist/ per il Worker
npm run start      # avvia il build di produzione dopo npm run build
npm run lint       # FALLISCE oggi: 1 errore e 16 warning
npm test           # FALLISCE oggi: esegue prima una build riuscita, poi 2 test starter obsoleti
npm run db:generate # genera migration dopo modifiche reali a db/schema.ts
```

Risultati verificati il 3 agosto 2026:

- `npm ci`: riuscito, 503 pacchetti installati.
- `npm run build`: riuscito; vinext compila la sola route `/`.
- `npm run lint`: fallito per `react-hooks/set-state-in-effect` in `app/page.tsx:423`; inoltre 16 warning `@next/next/no-img-element`.
- `npm test`: 0 passati, 2 falliti perché cercano ancora metadata e file di `app/_sites-preview` rimossi dal prodotto.

## 6. Variabili d'ambiente

Non sono richieste variabili applicative e la configurazione runtime del sito pubblicato non contiene env var. `.env.example` è quindi volutamente privo di valori attivi.

| Nome | Obbligatoria | Descrizione / origine |
|---|---:|---|
| `CODEX_SANDBOX` | No | Se vale `seatbelt`, abilita polling HMR per l'ambiente Codex su macOS. Viene fornita dall'ambiente Codex, non va creata per lo sviluppo normale. |
| `WRANGLER_WRITE_LOGS` | No | Default `false` impostato in `vite.config.ts`; controlla i log di Wrangler. |
| `WRANGLER_LOG_PATH` | No | Default `.wrangler/logs` impostato nel codice; percorso locale, non segreto. |
| `MINIFLARE_REGISTRY_PATH` | No | Default `.wrangler/registry` impostato nel codice; percorso locale, non segreto. |

L'identità ospitata arriva attraverso gli header `oai-authenticated-user-id`, `oai-authenticated-user-email` e, opzionalmente, `oai-authenticated-user-full-name`; non sono env var e vengono iniettati dalla piattaforma Sites. Non aggiungere token o credenziali al repository.

## 7. Dati

### Modello dati effettivo del prototipo

Tutti i dati sono oggetti TypeScript in `app/page.tsx`:

- `Choice`: `id`, `optionA`, `optionB`, `category`, `author`, `engagement`, `percentA`, `comments`; opzionalmente `format`, `options`, `chainLength`, media per opzione, background condiviso e audio.
- `Comment`: `author`, `initial`, `side` (`a`/`b`), `body`, `votes`, `time`, `replies`.
- `FriendChat`: profilo chat e array di `ChatMessage`; ogni messaggio ha `id`, mittente, testo e orario.
- `votes`: mappa in memoria `choiceId -> option key`.
- `extraComments`, `chatMessages`, `tournamentProgress`, `chainProgress`: mappe React in memoria indicizzate per scelta o chat.
- `categories`, `friendPosts`, `generalNotifications`, `friendChats`, `seedChoices`: seed hardcoded senza relazioni verificabili.

Non c'è persistenza server. Un refresh perde nuove scelte, voti, commenti, messaggi e media. I file scelti restano URL `blob:` validi solo nella sessione della pagina. Solo tre preferenze sono persistite in `localStorage`: `sided-theme`, `sided-notifications`, `sided-private-profile`.

### Database predisposto ma non attivo

- `.openai/hosting.json` dichiara `"d1": null`.
- `db/schema.ts` non contiene tabelle.
- `drizzle/meta/_journal.json` non contiene entry e non esistono file SQL.
- `db/index.ts` si aspetterebbe un binding Cloudflare D1 chiamato `DB`, ma nessun codice prodotto lo chiama.
- La tabella `notes` sotto `examples/d1/` è esclusivamente dimostrativa e non appartiene al modello Sided.

## 8. API e integrazioni

### Route attive

| Metodo | Path | Scopo |
|---|---|---|
| `GET` | `/` | Render SSR iniziale e bootstrap dell'unica applicazione React. Tutte le “schermate” sono tab client-side su questo URL. |
| `GET` | `/_vinext/image` | Endpoint interno di ottimizzazione immagini gestito dal Worker/vinext con Cloudflare Images. |
| `GET` | `/assets/*` e `/sided-icon.png` | Asset statici tramite binding Cloudflare `ASSETS`. |

Non esistono route API applicative attive, Server Actions o chiamate `fetch`. `examples/d1/app/api/notes/route.ts` mostra un ipotetico `GET`/`POST /api/notes`, ma la sua posizione sotto `examples/` lo rende non raggiungibile nel build corrente.

### Integrazioni

- **OpenAI Sites / Cloudflare Workers**: hosting, dispatch, asset e runtime edge.
- **Cloudflare Images**: usato dal Worker solo per l'endpoint interno di ottimizzazione.
- **Sign in with ChatGPT (SIWC)**: la piattaforma può iniettare header e possiede le route riservate `/signin-with-chatgpt`, `/signout-with-chatgpt` e `/callback`; l'helper locale è presente ma inutilizzato.
- **Cloudflare D1 / Drizzle**: dipendenze e scaffold presenti, integrazione disattivata.
- **R2, pagamenti, email, AI, analytics e storage esterno**: non presenti.

## 9. Deploy

Il sito è ospitato su OpenAI Sites con runtime Cloudflare Worker-compatible. URL live al momento dell'handoff: `https://sided-scelte.pyr3d.chatgpt.site`.

Stato della versione pubblicata:

- progetto Sites: identificato in `.openai/hosting.json`;
- versione live/sorgente più recente: `29`;
- commit sorgente della versione 29: `7b3379a76f1eda8bfbaa3f9b129d5d58808b2051`;
- build locale corrispondente: riuscita;
- dominio personalizzato: nessuno;
- variabili runtime nel pannello: nessuna;
- D1 e R2: non configurati;
- accesso nel pannello: modalità `custom`, limitata all'owner corrente; non è un sito pubblico anonimo.

Il flusso Sites usato dalla piattaforma è: `npm run build` → commit/push del sorgente al repository gestito Sites → packaging di `dist/`, `.openai/hosting.json` ed eventuali migration → salvataggio di una versione → deploy della versione. Non esistono script o credenziali locali per pubblicare direttamente sullo stesso hostname. Claude Code può sviluppare e verificare tutto in locale, ma per aggiornare questo progetto Sites serve l'owner tramite Codex/Sites; non creare un nuovo `project_id` e non sostituire quello esistente se l'obiettivo è aggiornare lo stesso sito.

Per un hosting diverso occorre adattare il Worker/output Cloudflare o migrare intenzionalmente da vinext; il repository non contiene `wrangler.jsonc`, account ID, zone, token o configurazione DNS.

## 10. Problemi noti e debito tecnico

1. **Non è ancora un social network funzionante**: non ci sono backend, account applicativi, autorizzazioni, database, API, storage, moderazione o sincronizzazione tra utenti.
2. **Test rotti**: entrambi i test descrivono ancora lo skeleton del template, cercano `app/_sites-preview` e falliscono sempre sul prodotto reale. Non esiste copertura del comportamento Sided.
3. **Lint rosso**: inizializzazione da `localStorage` chiama `setState` sincrono in un effect (`app/page.tsx:423`), violando `react-hooks/set-state-in-effect`. Ci sono anche 16 warning per `<img>`.
4. **Audit dipendenze**: `npm audit` riporta 18 vulnerabilità (13 high, 4 moderate, 1 low, 0 critical). Tra le dipendenze dirette coinvolte: Next `16.2.6` (fix indicato `16.2.12`), Vite `8.0.13` (fix `8.2.0`), `react-server-dom-webpack 19.2.6` (fix `19.2.8`), Cloudflare Vite plugin `1.37.1`, Wrangler `4.92.0` e Drizzle Kit. Aggiornare come set compatibile e rigenerare il lockfile; non usare `npm audit fix --force` alla cieca.
5. **Componente monolitico**: `app/page.tsx` è circa 90 KB/1.900 righe e `globals.css` circa 101 KB/4.000 righe. Dati, dominio, gesture e tutte le schermate sono accoppiati; ogni modifica ha un alto rischio di regressione.
6. **Statistiche ingannevoli**: percentuali, conteggi e “amici” non derivano da dati reali. Per più di due opzioni le percentuali privilegiano sempre le prime opzioni per formula.
7. **Bug semantico nei commenti multi-opzione**: `Comment.side` accetta solo `a`/`b`; un voto a C/D/E ecc. viene registrato come lato A quando si commenta.
8. **Azioni visivamente cliccabili ma inerti**: ricerca, categorie, follow, upvote, reply, modifica profilo, allegati chat e vari link/button non producono alcuna azione.
9. **Persistenza parziale e fuorviante**: i toggle impostazioni sopravvivono al refresh, ma non cambiano policy o notifiche reali; tutto il contenuto utente si perde.
10. **Media non robusti**: nessun limite di dimensione, validazione server, upload, transcoding, antivirus, moderazione o testo alternativo utente. Gli URL `blob:` non sono condivisibili né persistenti.
11. **Auth incompleta**: l'hosting limita l'accesso, ma l'app ignora l'identità ricevuta; profilo e autore `@tu/@pietro` sono hardcoded. Se il sito diventasse pubblico, l'app non distinguerebbe anonimi e autenticati.
12. **Documentazione starter obsoleta**: `README.md`, nome pacchetto, versione e test non sono stati aggiornati per Sided. `examples/d1` e asset SVG generici aggiungono rumore.
13. **Route unica senza URL state**: tab, dettaglio scelta e chat non sono linkabili, condivisibili o ripristinabili con back/forward del browser.
14. **Nessuna CI**: non ci sono workflow per imporre build, test, lint, audit o migration.

## 11. Cosa NON è stato fatto

Funzionalità previste dall'interfaccia ma mancanti: registrazione/profilo reale, feed personalizzato, follow graph, ricerca, voti aggregati, commenti/thread persistenti, messaggistica, notifiche, privacy, upload, moderazione, report/blocco, analytics, condivisione/deep link, API e pannello amministrativo.

Prossime 5 cose, in ordine:

1. **Mettere in sicurezza la base**: aggiornare in modo compatibile Next/React RSC/Vite/Cloudflare, rigenerare `package-lock.json`, correggere lint e sostituire i test starter con smoke test reali; aggiungere CI.
2. **Disegnare e implementare il dominio persistente**: schema D1 e migration per users, choices, options, votes, comments, follows, conversations/messages e notifications; definire API/Server Actions con validazione.
3. **Collegare identità e autorizzazioni**: usare `getChatGPTUser`/`requireChatGPTUser`, mappare l'utente a record DB, proteggere write/ownership e decidere consapevolmente accesso pubblico vs custom.
4. **Implementare upload e sicurezza dei contenuti**: abilitare R2, upload firmati/server-side, limiti MIME/dimensione, cleanup, moderazione e alt text; eliminare la dipendenza dagli URL `blob:` come persistenza.
5. **Separare UI e logica e completare il prodotto**: componenti/hook/moduli per feed, voting, create, comments, chat e profile; poi collegare ricerca, feed modes, notifiche, deep link e azioni oggi inerti ai dati reali.

## 12. Vincoli e decisioni prese

- **Non cambiare casualmente la catena vinext/Vite/Cloudflare**: è ciò che rende il codice compatibile con Sites. Migrare al builder Next standard è possibile solo insieme a una decisione esplicita di hosting e a nuovi test.
- **Conservare `.openai/hosting.json` e il suo `project_id`** per aggiornare lo stesso sito. D1/R2 devono restare `null` finché non esistono schema, migration e storage implementati.
- **Conservare `package-lock.json` e usare `npm ci`**. Gli aggiornamenti di sicurezza vanno fatti come set verificato perché vinext, React RSC, Next, Vite e plugin Cloudflare sono strettamente accoppiati.
- **Mantenere TypeScript strict e l'output Worker ESM**; sono già parte della pipeline funzionante.
- **Preservare il cuore UX** salvo redesign esplicito: interfaccia italiana, scheda scelta touch-first, swipe verticale, risultato immediato, bottom navigation mobile e brand rail desktop.
- **Non trattare i dati mock come contratto definitivo**: sono copy/demo, non fixture affidabili. Il modello vero deve supportare un numero arbitrario di opzioni; non perpetuare `Comment.side` limitato ad A/B.
- **Il singolo file non è un vincolo**: `page.tsx` e `globals.css` vanno spezzati prima di aggiungere molta logica, mantenendo però il comportamento visivo esistente mediante test.
- **Le route SIWC riservate sono della piattaforma**: non implementare localmente `/signin-with-chatgpt`, `/signout-with-chatgpt` o `/callback`.
- **Nessun segreto nel repo**: credenziali Sites/Cloudflare e valori runtime restano nel pannello o in env locali ignorati. L'export è stato controllato e non contiene token reali.
