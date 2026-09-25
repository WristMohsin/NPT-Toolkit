# ANPT Toolkit

**Automated Network Penetration Testing Toolkit**  
*Authorized Network Security Assessment Platform*

---

## Two Desktop Versions

| Version | Target OS | Use Case | Artifact Name |
|---------|-----------|----------|---------------|
| **Electron** | Windows 7 / 8 / 10 / 11 | Testing & development on older PCs | `ANPT-Toolkit-Electron-Windows7` |
| **Tauri** | Windows 10 / 11 | Final FYP demo (smaller & faster) | `ANPT-Toolkit-Windows` |

---

## How to get the builds

1. Go to **Actions** tab
2. Choose the workflow:
   - **Electron Build (Windows 7 Compatible)** → for Windows 7 testing
   - **Tauri Build (Windows)** → for Windows 10/11 final demo
3. Download the artifact from a **green (successful)** run
4. Extract and run the `.exe`

### Login (both versions)

```
Username : admin
Password : Admin@ChangeMe1
```

---

## Development

```bash
npm install

# Web only
npm run dev

# Electron (Windows 7 compatible)
npm run electron:dev

# Tauri (Windows 10+)
npm run tauri:dev
```

---

## Security Notice

This toolkit is intended **only** for systems you own or have explicit written authorization to assess. Unauthorized scanning is illegal.

---

## Current Progress

- [x] React frontend (Dashboard, Findings, Reports, etc.)
- [x] Login / Authentication
- [x] Tauri desktop (Windows 10+)
- [x] Electron desktop (Windows 7 compatible)
- [ ] Real Nmap Assessment Agent
- [ ] Authorization checks on targets
