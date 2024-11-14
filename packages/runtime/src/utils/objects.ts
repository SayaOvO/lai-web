export function objectsDiff<T>(
  oldObject: Record<string, T>,
  newObject: Record<string, T>
): {
  added: string[]
  removed: string[]
  updated: string[]
} {
  const oldKeys = Object.keys(oldObject)
  const newKeys = Object.keys(newObject)
  const added = []
  const updated = []
  const removed = []

  for (let i = 0, len = newKeys.length; i < len; i++) {
    const newKey = newKeys[i]
    if (!(newKey in oldObject)) {
      added.push(newKey)
    } else if (oldObject[newKey] !== newObject[newKey]) {
      updated.push(newKey)
    }
  }
  for (let i = 0, len = oldKeys.length; i < len; i++) {
    const oldKey = oldKeys[i]
    if (!(oldKey in newObject)) {
      removed.push(oldKey)
    }
  }
  return {
    added,
    updated,
    removed,
  }
}
