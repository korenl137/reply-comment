# Contributing

Keep changes small and checked. The Claude CLI is the only tool you need:

```sh
claude plugin validate .
claude plugin test .
```

Run both before opening a pull request. Raise `version` in `.claude-plugin/plugin.json` and
`.claude-plugin/marketplace.json` with every change to the hooks, and add a line to `CHANGELOG.md`.
`claude plugin update` refreshes an install only when the version changed.

A passing test does not prove the layout. Say in the pull request what you saw in a real fullscreen session.
