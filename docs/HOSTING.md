# Buildverse hosting

- Repository: https://github.com/solmyst/buildverse
- Public URL: https://buildverse.anush.tech
- GitHub Pages source: GitHub Actions, `.github/workflows/ci-cd.yml`.
- Pushes to `main` run lint, types, tests, and static export before deploying.
- Cloudflare DNS: CNAME `buildverse` → `solmyst.github.io`, DNS only.
- GitHub repository Settings → Pages owns the custom domain and HTTPS setting.
- `public/CNAME`, page metadata, and sitemap use the Buildverse subdomain.

This repository is independent of `solmyst/last_of_us`, which serves the main portfolio. Future Buildverse changes should be made here. To roll back a release, revert its commit on `main` and let the deployment workflow run again.
