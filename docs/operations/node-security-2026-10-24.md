# Mosalam.com — Node.js security handover — 2026-10-24

Host: `49.12.59.140` (`hosting.mosalam.com`, `dockerstation.mosalam.com`).

Security baseline: [Node.js October 2026 security releases](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases), published October 21. Fixed releases: 22.23.4, 24.22.1, 26.12.1. The release addresses CVE-2026-111497 and the other branch-specific issues listed in that advisory. End-of-life Node 16/18/20 deployments were moved to Node 22.

| Container | Before | Verified after | Runtime image |
| --- | --- | --- | --- |
| `backend` | v22.21.1 | v22.23.4 | `local/node-security/backend:22.23.4-20261024` |
| `amigoo-frontend-1` | v16.20.2 | v22.23.4 | `local/node-security/amigoo-frontend-1:22.23.4-20261024` |

## Deployment and source changes

- Compose project `amigoo`: `/root/Amigoo/docker-compose.yml`.

The production update used an image overlay that copies the exact patched official Node executable into the existing application image, preserving application code and installed dependencies. Images were built and checked before a sequential Compose recreation of the affected services only. Native addon load checks compared original and patched images; no new load failures were found. Brotli compression/decompression checks passed. Node process executable hashes matched the patched runtime at verification.

Application Dockerfiles now pin patched Node versions and official image digests for subsequent source builds. Compose image references identify the deployed security images. For services that previously used an image without a build definition, committed `ops/node-security` Dockerfiles make the overlay rebuildable on this host. Their `local/node-security-original/*:20261024` base tags must be retained; these custom application base images are not published to a registry. A clean machine must restore those originals or build the application from its pinned source Dockerfile first. Normal full application/dependency rebuilds were not performed in this emergency rollout.

Source commits preserve repository configuration and add only security image/build changes; unrelated live configuration, database files and credentials were excluded. Newly added deployment files require credentials through environment variables. Live Compose files retain the working host-specific settings. `[skip ci]` records the already-applied deployment without triggering a second full-stack pipeline run.

## Verification and limitations

Verification captured at 2026-10-24T00:19:17.004328+00:00. All 44 in-scope containers report patched versions (43 updated; one already patched). All 32 checked virtual-host root HTTP statuses matched the pre-update baseline. The 113 containers outside the recreation set retained their original IDs, including database services. These are runtime, native-addon and HTTP smoke checks; authenticated business workflows were not exhaustively tested.

Amigoo backend `backend` already had a long-running restart loop before this maintenance (baseline restart count over 43,000). Its root API endpoint returned HTTP 404 before and after. Updating Node does not resolve that existing application fault.

The unrelated healthcare site returned HTTP 500 before and after maintenance. API root HTTP 404 responses were retained as baseline behavior, not treated as proof of a failed rollout.

## Operations and rollback

Server evidence and private backups: `/root/node-security-20261024/` (root-only). Key files: `inventory-before.json`, `image-results.json`, `deployment-results.json`, `verification.json`, `source-changes.json`, `backups/`, and per-project build/deploy logs. Do not publish raw Compose backups or environment files.

For a routine redeploy, use the project Compose file and its pinned Dockerfiles. Check `docker compose config -q`, build the selected service if needed, then run `docker compose up -d --no-deps --no-build --pull never SERVICE`. Run `node --version` inside each affected container and repeat route/health checks. For overlays, retain both the original base tag and patched image tag.

Emergency rollback: record current private settings, restore only the affected service image reference to its retained `local/node-security-original/...:20261024` tag, then recreate only that service with `--no-deps --no-build --pull never`. Do not restore entire Compose backups over corrected credentials or stop database services. A rollback reintroduces the vulnerable runtime and is temporary incident recovery only.
