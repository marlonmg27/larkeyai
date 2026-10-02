<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Cursor Cloud specific instructions

- Install dependencies with Bun, not npm. `bun install --frozen-lockfile` fails because `package.json` pins `@lovable.dev/vite-tanstack-config` at `2.23.1` while `bun.lock` still records `2.20.0`. Use `bun install --no-save` so the lockfile is left unchanged.
- Dev server: `bun run dev -- --host 0.0.0.0 --port 3000`. `/` redirects to `/es`.
- `bun run build` is the production check. `bun run lint` currently fails on existing Prettier formatting in the repo.
