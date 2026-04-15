# Publishing to GitHub

## First push

```bash
cd bluetooth-to-wifi
git init
git add .
git commit -m "Initial commit: bluetooth-to-wifi monorepo"
git branch -M main
git remote add origin git@github.com:oguzhan18/bluetooth-to-wifi.git
git push -u origin main
```

This project uses the remote `git@github.com:oguzhan18/bluetooth-to-wifi.git` (SSH).

## README badge

The CI badge in [`README.md`](../README.md) points at `oguzhan18/bluetooth-to-wifi` and updates after GitHub Actions runs on `main`.

## Recommended repository settings

- **Branch protection** on `main`: require PR reviews or CI success (optional).
- **Security**: enable Dependabot alerts if you use npm/PyPI lockfiles in CI.
- **Secrets**: never commit `.env`; use GitHub Actions secrets for publishing tokens (`PYPI_TOKEN`, `NPM_TOKEN`).

## Translations

Localized overviews live under [`docs/i18n/`](i18n/). When you change critical user-facing sections of the English README, update the corresponding locale files or add a note in the PR.
