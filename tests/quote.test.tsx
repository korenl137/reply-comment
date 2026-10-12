import { describe, expect, test } from 'claude-code/testing'
import { paragraphs, quoted } from '../hooks/register.tsx'

describe('paragraphs and quote', () => {
  test('splits on blank lines and keeps a fenced block whole', () => {
    const text = 'one\ntwo\n\n```js\na\n\nb\n```\n\nthree'
    expect(paragraphs(text)).toEqual(['one\ntwo', '```js\na\n\nb\n```', 'three'])
  })

  test('keeps a list with blank lines between its items in one block', () => {
    expect(paragraphs('1. a\n\n2. b\n\ntext')).toEqual(['1. a\n\n2. b', 'text'])
    expect(paragraphs('intro\n\n- x\n\n- y')).toEqual(['intro', '- x\n\n- y'])
  })

  test('quotes every line and appends the note', () => {
    expect(quoted(['a\nb', 'c'], ' why? ')).toBe('> a\n> b\n>\n> c\n\nwhy?')
    expect(quoted(['a'], '')).toBe('> a')
  })
})

describe('the pane', () => {
  test('picked paragraphs plus a note are appended to the prompt, nothing is submitted', async ($, on) => {
    const filled: unknown[] = []
    on('session.start', async ($, e) => ({ cwd: e.cwd }) as never)
    on('command.register', () => ({ value: undefined }) as never)
    on('session.messages', () => ({ value: [{ role: 'assistant', text: 'alpha\n\nbeta', toolUses: [] }] }) as never)
    on('ui.open', () => ({ value: { isPlaced: true } }) as never)
    on('ui.close', () => ({ value: undefined }) as never)
    on('ui.invalidate', () => ({ value: undefined }) as never)
    on('ui.toast', () => ({ value: undefined }))
    on('ui.render', async () => ({ type: 'engine', ref: 'x' }) as never)
    on('prompt.read', () => ({ value: { text: '' } }) as never)
    on('prompt.fill', (_$, e) => {
      filled.push(e)
      return { isFilled: true } as never
    })
    await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true } as never)
    await $.command.run({ command: 'quote', args: '' } as never)
    const ui = await $.ui.mount({ plugin: 'reply-comment', surface: 'terminal', component: 'Pane', requestId: 'reply-comment', props: { title: 'quote', bodyColumns: 80 } as never })
    await ui.press({ key: 'pick-1' })
    await ui.input({ key: 'note', text: 'why beta?' })
    expect(filled).toHaveLength(1)
    expect((filled[0] as { text: string }).text).toBe('> beta\n\nwhy beta?')
    await ui.unmount()
  })
})

describe('the reply', () => {
  // `drawn` stands in for what the hooks below reply-comment drew; the engine's own drawing by default
  const world = (on: any, filled: string[], drawn: unknown = { type: 'engine', ref: 0 }) => {
    on('session.start', async (_$: any, e: any) => ({ cwd: e.cwd }) as never)
    on('command.register', () => ({ value: undefined }) as never)
    on('ui.render', async () => drawn as never)
    on('prompt.read', () => ({ value: { text: '' } }) as never)
    on('prompt.fill', (_$: any, e: any) => {
      filled.push(e.text)
      return { isFilled: true } as never
    })
    on('ui.toast', () => ({ value: undefined }))
  }
  const props = (text: string) => ({ text, isFirstOfReply: true }) as never

  test('each paragraph gets a ❝ that quotes just that paragraph', async ($, on) => {
    const filled: string[] = []
    world(on, filled)
    await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true } as never)
    const ui = await $.ui.mount({ plugin: 'reply-comment', surface: 'terminal', component: 'AssistantMessage', requestId: 'm1', viewport: { columns: 100, rows: 40, isFullscreen: true }, props: props('alpha\n\nbeta') } as never)
    expect(await ui.find({ type: 'Button', label: '❝' })).toBeDefined()
    await ui.press({ key: 'q1' })
    expect(filled).toEqual(['> beta\ncomment: '])
    await ui.unmount()
  })

  test('a reply naming .md files gets a ❝ per paragraph too', async ($, on) => {
    const filled: string[] = []
    world(on, filled)
    await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true } as never)
    const ui = await $.ui.mount({ plugin: 'reply-comment', surface: 'terminal', component: 'AssistantMessage', requestId: 'm2', viewport: { columns: 100, rows: 40, isFullscreen: true }, props: props('see docs/a.md\n\nmore') } as never)
    expect(await ui.findAll({ type: 'Button', label: '❝' })).toHaveLength(2)
    await ui.unmount()
  })

  test('the engine\'s own drawing gets a ❝ per paragraph whatever its ref', async ($, on) => {
    const filled: string[] = []
    world(on, filled, { type: 'engine', ref: 1 })
    await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true } as never)
    const ui = await $.ui.mount({ plugin: 'reply-comment', surface: 'terminal', component: 'AssistantMessage', requestId: 'm4', viewport: { columns: 100, rows: 40, isFullscreen: true }, props: props('alpha\n\nbeta') } as never)
    expect(await ui.findAll({ type: 'Button', label: '❝' })).toHaveLength(2)
    await ui.unmount()
  })

  test('a reply another hook drew keeps that drawing, with one ❝ over it', async ($, on) => {
    const filled: string[] = []
    world(on, filled, { type: 'Text', children: ['E = mc²'] })
    await $.session.start({ cwd: '/repo', surface: 'terminal', isInteractive: true } as never)
    const ui = await $.ui.mount({ plugin: 'reply-comment', surface: 'terminal', component: 'AssistantMessage', requestId: 'm3', viewport: { columns: 100, rows: 40, isFullscreen: true }, props: props('energy $$E = mc^2$$\n\nmore') } as never)
    expect(await ui.find({ text: 'E = mc²' })).toBeDefined()
    expect(await ui.findAll({ type: 'Button', label: '❝' })).toHaveLength(1)
    await ui.press({ key: 'quote-reply' })
    expect(filled).toEqual(['> energy $$E = mc^2$$\n>\n> more\ncomment: '])
    await ui.unmount()
  })
})
