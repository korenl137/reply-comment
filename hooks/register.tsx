/**
 * reply-comment: pick paragraphs of a reply, add a note, and have them appended to the
 * prompt draft as a quote. Nothing is submitted; you review the draft and press Enter.
 *
 * A dim ❝ at the head of each paragraph of a reply (fullscreen terminal) quotes that paragraph into the prompt.
 * /quote opens a pane of the last reply's paragraphs; picked paragraphs plus a note are appended
 * to the prompt draft as a quote. Nothing is submitted.
 *
 * Calls on `$`: command.register, session.messages, prompt.read, prompt.fill, ui.open,
 * ui.close, ui.invalidate, ui.resolve, ui.toast. No fs, process, http or store.
 */
import type { Register } from 'claude-code'

const PANE = 'reply-comment'
// Blank-line separated blocks; a fenced code block stays in one piece.
export function paragraphs(text: string): string[] {
  const out: string[] = []
  let cur: string[] = []
  let fenced = false
  const flush = () => {
    if (cur.length) out.push(cur.join('\n'))
    cur = []
  }
  for (const line of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
    if (!fenced && line.trim() === '' && !/^\s*(```|~~~)/.test(line)) flush()
    else cur.push(line)
  }
  flush()
  // a list with blank lines between its items stays one block, or each item would restart at "1."
  const item = /^\s*([-*+]|\d+[.)])\s/
  return out.reduce<string[]>((acc, block) => {
    const prev = acc[acc.length - 1]
    if (prev !== undefined && item.test(block) && item.test(prev.split('\n').at(-1) ?? '') || (prev !== undefined && item.test(prev) && /^\s{2,}\S/.test(block))) {
      acc[acc.length - 1] = `${prev}\n\n${block}`
    } else acc.push(block)
    return acc
  }, [])
}

export function quoted(parts: string[], note: string): string {
  const q = parts.map(p => p.split('\n').map(l => (l ? `> ${l}` : '>')).join('\n')).join('\n>\n')
  return note.trim() ? `${q}\n\n${note.trim()}` : q
}

let paras: string[] = []
let picked = new Set<number>()

async function openFor($: any, text: string) {
  paras = paragraphs(text)
  picked = new Set()
  await $.ui.open({ id: PANE, title: 'quote', focus: true, closeOnEscape: true })
  $.ui.invalidate('ui.render')
}

// trailer: text after the quote, e.g. "\ncomment: " so the cursor lands on a labelled answer line
async function fillPrompt($: any, parts: string[], note: string, trailer = ''): Promise<boolean> {
  const box = await $.prompt.read()
  const r = await $.prompt.fill({ text: (box.text.trim() ? '\n\n' : '') + quoted(parts, note) + trailer, mode: 'append' })
  // the quote showing in the prompt is the confirmation; only a failure needs a word
  if (!r.isFilled) $.ui.toast("Couldn't fill the prompt (is a dialog open?)")
  return r.isFilled
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'quote', description: 'Pick paragraphs of the last reply and quote them into your prompt', immediate: true }).catch(() => undefined)
    return next(e)
  })

  on('command.run', { command: 'quote' }, async $ => {
    const last = [...(await $.session.messages())].reverse().find(m => m.role === 'assistant' && m.text.trim())
    if (!last) $.ui.toast('No reply to quote yet')
    else await openFor($, last.text)
    return {}
  })

  // The reply drawn as the engine draws it, paragraph by paragraph, each with a dim ❝ at its left
  // head that appends that paragraph to the prompt as a quote. Fullscreen terminal only (the only
  // place a plugin gets clicks). A reply another hook drew (tex-display's math) keeps that drawing:
  // its paragraphs cannot be lined up with ours, so one ❝ goes over the whole reply instead.
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (e.surface !== 'terminal' || !e.viewport?.isFullscreen) return next(e)
    const drawn = await next(e)
    const blocks = paragraphs(e.props.text)
    if (!blocks.length) return drawn
    // the engine's own drawing (any ref: next(e) numbers each answer) is what the paragraphs replace
    if (drawn.type !== 'engine') {
      const { Box, Button } = $.ui.resolve(e)
      return (
        <Box flexDirection="row">
          <Box flexShrink={0} minWidth={2} marginTop={1}>
            <Button key="quote-reply" label="❝" plain dimColor onPress={() => fillPrompt($, [e.props.text], '', '\ncomment: ')} />
          </Box>
          <Box flexDirection="column" flexGrow={1} flexShrink={1}>
            {drawn}
          </Box>
        </Box>
      )
    }
    const { Box, Text, Button, Markdown } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" marginTop={1}>
        <Box minWidth={2}>
          <Text>{e.props.isFirstOfReply ? '⏺' : ' '}</Text>
        </Box>
        <Box flexDirection="column" flexGrow={1}>
          {blocks.map((block, i) => (
            <Box key={`b${i}`} flexDirection="row" columnGap={1} alignItems="flex-start" marginTop={i === 0 ? 0 : 1}>
              {/* a fixed cell on the paragraph's first line, so every paragraph's text starts in the same column */}
              <Box flexShrink={0}>
                <Button key={`q${i}`} label="❝" plain dimColor onPress={() => fillPrompt($, [block], '', '\ncomment: ')} />
              </Box>
              <Box flexGrow={1} flexShrink={1}>
                <Markdown key={`m${i}`} text={block} />
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    if (e.requestId !== PANE) return next(e)
    const { Box, Text, Button, Input, Markdown } = $.ui.resolve(e)
    const redraw = () => $.ui.invalidate('ui.render')
    const send = async (note: string) => {
      const parts = [...picked].sort((a, b) => a - b).map(i => paras[i]!)
      if (!parts.length) return void $.ui.toast('Pick at least one paragraph (❝)')
      if (await fillPrompt($, parts, note)) await $.ui.close({ id: PANE })
    }
    return (
      <Box flexDirection="column">
        <Input key="note" label="Note" placeholder="comment on the picked paragraphs, Enter adds them to the prompt" value="" submitLabel="add" autoFocus onSubmit={send} />
        {paras.map((p, i) => (
          <Box key={`p${i}`} flexDirection="row" columnGap={1}>
            <Button key={`pick-${i}`} label={picked.has(i) ? '☑' : '☐'} plain onPress={() => { picked.has(i) ? picked.delete(i) : picked.add(i); redraw() }} />
            <Markdown key={`m${i}`} text={p} />
          </Box>
        ))}
      </Box>
    )
  })
}
