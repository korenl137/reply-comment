# Changelog

All notable changes to this mod. This file follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.0] - 2026-10-12

First public release. The mod moved out of a private collection into this repository.

### Changed

- The marketplace is now named `reply-comment` (it was `reply-comment-local`) and lists a real owner.
  Install with `claude plugin install reply-comment@reply-comment`.
- Added README, LICENSE and this changelog. No change to the hooks.

## [0.1.1] - 2026-10-10

### Changed

- Version bump only, so `claude plugin update` refreshes the install cache.

## [0.1.0] - 2026-10-09

First version, built up over 2026-10-07 to 2026-10-09.

### Added

- `/quote` opens a pane with the last reply split into paragraphs; picked paragraphs plus a note are appended to the prompt draft.
- In a fullscreen terminal, a dim ❝ at the head of each paragraph of a reply quotes that paragraph into the prompt.
- After a ❝ press the prompt gets a line break and a `comment: ` label, so the cursor lands on a labelled answer line.

### Fixed

- A reply that another hook drew (for example display math) was replaced by this mod's drawing. The hook now lets the hooks below it draw first and keeps a drawing that is not the engine's own, with one ❝ over the whole reply.
