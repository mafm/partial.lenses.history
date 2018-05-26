import * as I from 'infestines'
import * as L from 'partial.lenses'

import * as S from './trie'

//

const dec = x => x - 1

//

const construct = (i, t, v, c) => ({i, t, v, c})

//

function setPresentU(value, history) {
  const v = history.v
  const i = history.i
  const c = history.c
  if (c.e) {
    if (I.acyclicEqualsU(S.nth(i, v), value)) {
      return history
    }
  }
  const t = history.t
  const now = Date.now()
  const j = i + (c.p <= now - S.nth(i, t))
  const j0 = Math.max(0, j - c.m)
  return construct(
    j - j0,
    S.append(now, S.slice(j0, j, t)),
    S.append(value, S.slice(j0, j, v)),
    c
  )
}

const setIndexU = (index, history) =>
  construct(
    Math.max(0, Math.min(index, count(history) - 1)),
    history.t,
    history.v,
    history.c
  )

// Creating

export const init = I.curryN(2, config => {
  config = config || 0
  const c = {
    p: config.replacePeriod || 0,
    e: !config.pushEquals,
    m: Math.max(1, config.maxCount || -1 >>> 1) - 1
  }
  return value => construct(0, S.of(Date.now()), S.of(value), c)
})

// Time travel

export const count = history => S.length(history.v)
export const index = history => history.i
export const setIndex = I.curry(setIndexU)
export const viewIndex = L.lens(index, setIndexU)

// Present

export const present = history => S.nth(history.i, history.v)
export const setPresent = I.curry(setPresentU)
export const viewPresent = L.lens(present, setPresentU)

// Undo

export {index as undoCount}
export {viewIndex as viewUndoCount}
export const undo = L.modify(viewIndex, dec)
export const undoForget = history =>
  construct(
    0,
    S.drop(history.i, history.t),
    S.drop(history.i, history.v),
    history.c
  )

// Redo

export const redoCount = history => count(history) - 1 - history.i
export const viewRedoCount = L.lens(redoCount, (index, history) =>
  setIndex(count(history) - 1 - index, history)
)
export const redo = L.modify(viewRedoCount, dec)
export const redoForget = history =>
  construct(
    history.i,
    S.take(history.i + 1, history.t),
    S.take(history.i + 1, history.v),
    history.c
  )
