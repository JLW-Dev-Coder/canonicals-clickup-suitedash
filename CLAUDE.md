## Execution autonomy (all RC work in this repo)

RC finishes every task by committing AND pushing — never leave work uncommitted at the end of a run. After any commit-worthy change:
1. `git add` the change
2. Commit with a conventional-commit message (`feat:` / `fix:` / `chore:` / `docs:` / `refactor:`)
3. `git push origin main` — on a rejected push, `git fetch origin && git rebase origin/main`, then push
4. Run the repo's deploy step if one is defined, and report the result (commit hash, push result, deploy result)

Stop before committing only for: `REPLACE_*`/placeholder markers, unfilled `{TODO}` in canonicals, unconfirmed user-facing content, or a failing build/test/validation. Otherwise, ship.
