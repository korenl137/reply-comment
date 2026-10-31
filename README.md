# reply-comment

> **Superseded.** This plugin is replaced by `reply-tools`, which merges reply-comment and code-copy and lives in the author's private `claude-mods` repository.
> Distribution stopped on 2026-10-31. This repository is kept for reference only.

Quote parts of Claude's reply into your prompt, with a comment. Nothing is sent: the quote lands in the prompt draft and you press Enter yourself.

- **❝ per paragraph.** In a fullscreen terminal, each paragraph of a reply gets a dim ❝ at its left. Press it and that paragraph is appended to your prompt as a `> ` quote, followed by a `comment: ` line for your answer.
- **`/quote`.** Opens a pane with the last reply split into paragraphs. Tick the ones you want, type a note, press Enter, and they go into the prompt draft as one quote followed by the note.

Fenced code blocks stay in one piece, and a list with blank lines between its items stays one block.

## Install

```sh
claude plugin marketplace add korenl137/reply-comment
claude plugin install reply-comment@reply-comment
```

Then restart Claude Code, or run `/reload-plugins` in an open session.

## Requirements

- Claude Code 2.1.287 or later (mods were introduced there).
- The ❝ buttons need the fullscreen terminal; it is the only place a plugin receives clicks. `/quote` is registered in every session.

## Good to know

- **Other mods that draw replies.** This mod draws the `AssistantMessage` itself. It calls the hooks below it first, so a reply another mod drew (for example display math) is kept, and it gets one ❝ over the whole reply instead of one per paragraph. Mods that draw replies in some other way may still conflict.
- **Known quirk.** In one live session the first paragraph's ❝ did not respond to three presses and worked after a later paragraph had been quoted. The cause is not found.
- **Not yet observed natively.** The tests use stubs. The paragraph-by-paragraph layout and the cursor position after a ❝ press have been seen in a native fullscreen session only in part.

## What it can touch

The hook uses only Claude Code's own `$` calls: `command.register`, `session.messages`, `prompt.read`, `prompt.fill`, `ui.*`. It has no filesystem, process, network or storage access, and it never submits anything.

## Develop

```sh
claude plugin validate .
claude plugin test .
```

See [CONTRIBUTING.md](CONTRIBUTING.md) and [CHANGELOG.md](CHANGELOG.md).

## AI disclosure

This mod was written with AI assistance.

## License

[MIT](LICENSE)
