# ANPT Toolkit

**Automated Network Penetration Testing Toolkit**
*Authorized Network Security Assessment Platform*

## Overview

ANPT Toolkit is a frontend for organizing and reporting on **authorized** network security assessments: defining scope, tracking discovered hosts/services, managing vulnerability findings, and generating professional reports. It is built to deploy as a static site on GitHub Pages.

## Important: What this application does and does not do

**GitHub Pages provides static hosting only.** A browser tab cannot open raw sockets, run Nmap, or otherwise perform real network reconnaissance — and this application does not pretend otherwise. It supports three ways of getting assessment data in:

1. **Demo Mode** — a clearly labeled, fully synthetic dataset (5 hosts, a dozen services, ten findings) for exploring the UI. Every demo finding is marked `synthetic: true` and the interface displays a persistent "DEMO DATA — NOT A REAL SECURITY ASSESSMENT" notice wherever demo data is shown.
2. **Import Mode** — upload results from tools you've actually run yourself with authorization: Nmap XML (`nmap -oX`) or a custom ANPT JSON format. Imported files are parsed defensively and treated as untrusted input; malformed files produce a specific error rather than being silently accepted.
3. **Future Agent Mode** — the codebase includes an `AssessmentAgent`-shaped interface and a Settings → Agent panel for configuring an endpoint, in preparation for a future local agent or self-hosted backend that could execute authorized tools and return structured results. **No such agent exists yet, and the app never connects to an endpoint automatically.**

There is no code path anywhere in this repository that scans, probes, or sends traffic to a target from the browser.

## Features

- Dashboard with risk overview, attack-surface summary, assessment phase tracker
- Assessment / Target management with explicit scope + authorization tracking
- Host and service inventory with per-host detail views
- Vulnerability correlation with an explicit **Confirmed / Potential / Informational** confidence distinction — findings are never presented as confirmed vulnerabilities without evidence
- Findings workflow (Open → Confirmed/False Positive/Remediated/etc.) with analyst notes
- Import Center for Nmap XML and ANPT JSON
- Executive Summary and Technical report generation, print-to-PDF, JSON export
- Analytics (severity distribution, findings over time, exposure by service/port)
- Dark, information-dense UI designed for technical/analyst use

## Architecture

```
GitHub Pages UI (React + TypeScript + Vite)
       |
       +---- Demo Engine        (src/data/demoData.ts)
       |
       +---- Import Engine      (src/services/importParsers.ts -- Nmap XML, ANPT JSON)
       |
       +---- Storage Provider   (src/services/storage.ts -- swappable; currently localStorage)
       |
       +---- Future: Local Assessment Agent / self-hosted backend
```

State lives in a React context (`src/services/store.tsx`) backed by `StorageProvider`, an abstraction designed so a real backend/IndexedDB implementation can replace the current localStorage-backed one without touching the UI layer.

## Development

```bash
npm install
npm run dev       # local dev server
npm run lint       # oxlint
npm test           # vitest (import-parser unit tests)
npm run build       # tsc + vite build -> dist/
```

## GitHub Pages Deployment

`.github/workflows/deploy.yml` runs lint -> test -> build -> deploy on every push to `main`, using GitHub's official Pages actions. `vite.config.ts` uses a relative (`./`) base path by default so the build works from any repository subpath without extra configuration; override with the `VITE_BASE_PATH` env var if you need an absolute base.

## Security Model & Authorized Use

This tool is intended for **authorized** security testing: systems, networks, and applications you own or have explicit written permission to assess. It does not implement destructive exploitation, credential harvesting, persistence, or IDS/IPS evasion, and imported scan data is always treated as untrusted input before being rendered.

## Limitations

- No real scanning capability -- by design (see above)
- Client-side storage only (localStorage); large datasets (thousands of hosts/findings) are not yet virtualized
- Report templates are fixed layouts (Executive Summary, Technical Report); custom templates are not yet supported
- No authentication/multi-user support -- this is a single-analyst local tool

## Roadmap

1. Frontend dashboard & shell -- done
2. Demo engine -- done
3. Nmap XML / JSON import -- done
4. Finding correlation (Confirmed/Potential/Informational) -- done
5. Report generation -- done
6. Local assessment agent (`AssessmentAgent` interface, no implementation yet)
7. Optional self-hosted backend / `FutureApiProvider`
8. Advanced authorized assessment modules, IndexedDB migration, virtualized tables

## Contributing

Issues and PRs welcome. Please keep any new functionality within the authorized-testing scope described above -- no destructive exploitation or evasion features will be accepted.
