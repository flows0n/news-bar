# News Bar

Prosta tablica aktualności na szkolny ekran z panelem administratora.

- `/` – ekran z widocznymi newsami (pełny ekran, zegar, automatyczne odświeżanie co 60 s i przewijanie, gdy newsów jest dużo)
- `/admin` – panel: dodawanie, edycja, usuwanie, zmiana kolejności (przeciąganie lub strzałki) i ukrywanie newsów

Logika API jest w `server/api.ts` i działa w dwóch wariantach:

| Wariant       | Plik                       | Gdzie trzymane są newsy |
| ------------- | -------------------------- | ----------------------- |
| Netlify       | `netlify/functions/api.ts` | Netlify Blobs           |
| Własny serwer | `server/index.ts`          | `data/news.json`        |

## Deploy na Netlify

1. Wrzuć repozytorium na GitHuba.
2. W Netlify: **Add new site → Import an existing project** i wybierz repozytorium.
   Ustawienia buildu zostaną wczytane z `netlify.toml`.
3. **Site configuration → Environment variables** → dodaj `ADMIN_PASSWORD` z wybranym hasłem.
   Bez tej zmiennej panel admina jest wyłączony.
4. Zrób redeploy (**Deploys → Trigger deploy**), żeby funkcja zobaczyła nowe hasło.

Każdy kolejny `git push` automatycznie robi deploy. Newsy w Netlify Blobs nie znikają przy deployach.

Na komputerze podłączonym do ekranu otwórz adres strony w przeglądarce w trybie pełnoekranowym
(F11 lub tryb kiosku, np. `chrome --kiosk https://twoja-strona.netlify.app`).

## Development

Wariant z lokalnym serwerem Node (newsy w `data/news.json`), w dwóch terminalach:

```bash
npm run server   # API na porcie 3001 (hasło: admin)
npm run dev      # frontend na http://localhost:3000
```

Wariant jak na Netlify (funkcja + lokalny emulator Blobs), w jednym terminalu:

```bash
npm run dev:netlify   # http://localhost:8888
```

Hasło ustaw w pliku `.env` (`ADMIN_PASSWORD=...`), który nie trafia do repozytorium.

## Własny serwer (bez Netlify)

Wymaga Node.js 22.18+.

```bash
npm install
npm run build
ADMIN_PASSWORD=twoje-haslo npm start
```

W PowerShell: `$env:ADMIN_PASSWORD='twoje-haslo'; npm start`. Aplikacja działa na porcie 3001 (zmienna `PORT`),
newsy zapisuje w `data/` (zmienna `DATA_DIR`).
