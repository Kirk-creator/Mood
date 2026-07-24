/**
 * Fill unrated points by interpolating between neighbours so chart lines stay
 * continuous. Leading/trailing gaps extend the nearest known value. Returns the
 * input untouched when a series has no ratings at all.
 */
export function fillGaps(values: Array<number | null>): Array<number | null> {
  const known: number[] = []
  values.forEach((v, i) => {
    if (v !== null) known.push(i)
  })
  if (known.length === 0) return values

  const out = [...values]
  const first = known[0]
  const last = known[known.length - 1]

  for (let i = 0; i < first; i++) out[i] = values[first]
  for (let i = last + 1; i < values.length; i++) out[i] = values[last]

  for (let k = 0; k < known.length - 1; k++) {
    const a = known[k]
    const b = known[k + 1]
    const va = values[a] as number
    const vb = values[b] as number
    for (let i = a + 1; i < b; i++) {
      out[i] = va + ((vb - va) * (i - a)) / (b - a)
    }
  }
  return out
}
