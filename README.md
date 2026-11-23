# Verbotene Lande — Owlbear-Rodeo-Extension

Quasar-SPA (Vue 3 + Vite + TypeScript), geladen als **Owlbear-Rodeo**-Extension
im VTT-Iframe. Sie verbindet sich per Loopback-WebSocket
(`ws://localhost:47823`) mit der nativen Charakterbogen-App `forbidden_lands`
und leitet Würfe über Owlbears `OBR.broadcast`-API an die **Dice+**-Extension
weiter.

Die Extension-Manifest-Datei liegt in `public/manifest.json` (Popover `/`,
400×600). Der Wire-Format-Ablauf ist im Hauptrepo in
`erklaerungen/owlbear-bridge.md` dokumentiert — eine Protokolländerung betrifft
immer beide Repos.

## Voraussetzungen

- Node.js `>= 26 || ^24 || ^22.12`
- yarn 1.22

## Installation

```bash
yarn install
```

`postinstall` führt `quasar prepare` aus und erzeugt das (gitignorierte)
`.quasar/`-Verzeichnis für Typen und Basis-tsconfig.

## Entwicklung

```bash
yarn dev
```

Startet den Quasar-Dev-Server (SPA-Modus) auf Port **5173**. Zum Testen im
echten Kontext muss die native App `forbidden_lands` laufen, damit die
WebSocket-Bridge erreichbar ist.

## Prüfen

```bash
yarn lint:check
yarn typecheck
```

Es ist kein Testframework konfiguriert; `lint:check` (oxfmt + oxlint) und
`typecheck` (vue-tsc) sind die Verifikationsschritte.

## Build

```bash
yarn build
```

Erzeugt die App in `dist/spa`, die als Owlbear-Extension geladen wird.

## Lizenz

MIT — siehe [LICENSE](LICENSE). © 2026 crimsen.
