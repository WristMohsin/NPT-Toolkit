# ANPT Toolkit

**Automated Network Penetration Testing Toolkit**  
*Authorized Network Security Assessment Platform*

---

## Current Branches

| Branch | Description |
|--------|-------------|
| `main` | Web version (GitHub Pages) |
| `feature/tauri-desktop` | **Desktop version (Tauri)** – Work in progress |

---

## Desktop Version (Tauri) – Status

We are converting the React web app into a **native desktop application** using **Tauri** so that:

- Real authorized Nmap scanning becomes possible (local agent)
- Login / authentication can be enforced
- The app can be distributed as a Windows installer / portable exe

### Progress

- [x] Tauri foundation + project structure
- [x] Windows build workflow (`tauri-build.yml`)
- [ ] Login / Authentication system
- [ ] Local Assessment Agent (real Nmap)
- [ ] Authorization checks on targets
- [ ] Final polish + FYP documentation

### How to get the desktop build

1. Go to **Actions** tab → **Tauri Build (Windows)**
2. Download the artifact named `ANPT-Toolkit-Windows`
3. Extract and run the `.exe` or install the `.msi`

> **Note:** First successful build may take a few minutes. Icons are currently placeholders.

---

## Web Version (main branch)

Still available at: https://wristmohsin.github.io/NPT-Toolkit/

This version is **static only** (no real scanning).

---

## Security Notice

This toolkit is intended **only** for systems you own or have explicit written authorization to assess. Unauthorized scanning is illegal.

---

## Development (Desktop)

```bash
# Install dependencies
npm install

# Run in development mode (requires Rust + Tauri CLI)
npm run tauri:dev

# Build for production
npm run tauri:build
```

Requirements:
- Node.js 20+
- Rust (stable)
- Windows 10/11 (for Windows builds)
- Nmap installed on the system (for real assessment – coming soon)
