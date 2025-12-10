# ShipAny Template Two

## Getting Started

read [ShipAny Document](https://shipany.ai/docs/quick-start) to start your AI SaaS project.

## Local Development (Docker + Postgres)

1. Copy `env.example` to `.env.development` (or `.env.local`) and fill values, especially `AUTH_SECRET` and `DATABASE_URL`.
2. Start the local Postgres container: `docker-compose up -d db`.
3. Install deps: `pnpm install`.
4. Apply the schema: `pnpm db:push`.
5. (Optional) Seed RBAC roles: `pnpm rbac:init`.
6. Run the app: `pnpm dev`.

## Buy Templates

check [ShipAny Templates](https://shipany.ai/templates) to buy Business Templates.

## Feedback

submit your feedbacks on [Github Issues](https://github.com/shipanyai/shipany-template-two/issues)

## LICENSE

!!! Please do not publicly release ShipAny's Code. Illegal use will be prosecuted

[ShipAny LICENSE](./LICENSE)
