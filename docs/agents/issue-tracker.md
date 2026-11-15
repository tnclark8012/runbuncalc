# Issue tracker: GitHub

Issues, specs, and wayfinder maps live in GitHub Issues in `tnclark8012/runbuncalc`. Use the `gh` CLI. Before the first issue creation in a session, verify `gh repo view --json nameWithOwner` targets this repository, not an upstream project or the skills source repository. Use `--repo tnclark8012/runbuncalc` explicitly if necessary.

## Conventions

- Create: `gh issue create --title "..." --body-file -`, supplying a heredoc for multiline bodies.
- Read: `gh issue view <number> --json number,title,body,labels,comments,assignees`.
- List: `gh issue list --state open --json number,title,body,labels,assignees`, with label/state filters as needed.
- Comment: `gh issue comment <number> --body "..."`.
- Label: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`.
- Resolve: post the explanation as a comment, then `gh issue close <number>`.
- Publishing to the issue tracker means creating a GitHub issue; fetching a ticket means reading its issue.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## Wayfinding operations

- Map: a single issue labelled `wayfinder:map`.
- Tickets: child issues of the map, each labelled `wayfinder:research`, `wayfinder:prototype`, `wayfinder:grilling`, or `wayfinder:task`. Create any missing wayfinder labels when first needed; do not apply triage labels.
- Parent/child: `gh issue create --parent <map> ...`, or `gh issue edit <map> --add-sub-issue <child>`. If sub-issues are unavailable, maintain a task list in the map body and put `Part of #<map>` at the top of each child body.
- Blocking: use native dependencies with `gh issue edit <child> --add-blocked-by <blocker>`. Only if unavailable, put `Blocked by: #<number>, ...` at the top of the child body. A ticket is unblocked when every blocker is closed.
- Frontier: query the map's sub-issues with `gh api --paginate repos/tnclark8012/runbuncalc/issues/<map>/sub_issues` (or read its fallback task list). Keep only open, unassigned children without open blockers, preserving map order. Count open native blockers with `gh api repos/tnclark8012/runbuncalc/issues/<number> --jq .issue_dependencies_summary.blocked_by`; inspect blocker issues when using the body fallback.
- Claim: assign the ticket to the driving developer before work: `gh issue edit <number> --add-assignee @me`.
- Resolve: comment with the answer, close the ticket, and append a linked title plus one-line gist to the map's Decisions so far. Keep the detailed decision in the ticket, not duplicated in the map.
