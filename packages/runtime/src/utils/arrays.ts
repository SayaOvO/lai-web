import { ChildNodeType, VNode } from '../h'

export function withoutNulls(
  arr: ChildNodeType[]
): Exclude<ChildNodeType, null | undefined>[] {
  return arr.filter((item) => item != null)
}

export function arraysDiff<T>(
  newArray: T[],
  oldArray: T[]
): {
  added: T[]
  removed: T[]
} {
  const oldSet = new Set(oldArray)
  const newSet = new Set(newArray)
  const added = []
  const removed = []
  for (let i = 0, len = newArray.length; i < len; i++) {
    const item = newArray[i]
    if (!oldSet.has(item)) {
      added.push(item)
    }
  }
  for (let i = 0, len = oldArray.length; i < len; i++) {
    const item = oldArray[i]
    if (!newSet.has(item)) {
      removed.push(item)
    }
  }
  return {
    added,
    removed,
  }
}

export enum ARRAY_DIFF_OP {
  ADD,
  REMOVE,
  MOVE,
  NOOP,
}

interface Operation<T> {
  op: ARRAY_DIFF_OP
  index: number
  item: T
}

interface RemoveOperation<T> extends Operation<T> {
  op: ARRAY_DIFF_OP.REMOVE
}
export interface NoopOperation<T> extends Operation<T> {
  op: ARRAY_DIFF_OP.NOOP
  originalIndex: number
}
export interface MoveOperation<T> extends Operation<T> {
  op: ARRAY_DIFF_OP.MOVE
  originalIndex: number
  from: number
}

interface AdditionOperation<T> extends Operation<T> {
  op: ARRAY_DIFF_OP.ADD
}

class ArrayWithOriginalIndices<T> {
  #array: T[] = []
  #originalIndices: number[] = []
  #equalsFn

  constructor(array: T[], equalsFn: (nodeOne: T, nodeTwo: T) => boolean) {
    this.#array = [...array]
    this.#originalIndices = array.map((_, i) => i)
    this.#equalsFn = equalsFn
  }

  get length() {
    return this.#array.length
  }

  isRemoval(index: number, newArray: T[]) {
    if (index >= this.length) {
      return false
    }
    const item = this.#array[index]
    const indexInNewArray = newArray.findIndex((newItem) =>
      this.#equalsFn(newItem, item)
    )
    return indexInNewArray === -1
  }

  removeItem(index: number): RemoveOperation<T> {
    const operation: RemoveOperation<T> = {
      op: ARRAY_DIFF_OP.REMOVE,
      index,
      item: this.#array[index],
    }
    this.#array.splice(index, 1)
    this.#originalIndices.splice(index, 1)
    return operation
  }

  isNoop(index: number, newArray: T[]) {
    if (index >= this.length) {
      return false
    }
    const item = this.#array[index]
    const newItem = newArray[index]
    return this.#equalsFn(item, newItem)
  }

  noopItem(index: number): NoopOperation<T> {
    return {
      op: ARRAY_DIFF_OP.NOOP,
      originalIndex: this.originalIndexAt(index),
      index,
      item: this.#array[index],
    }
  }

  originalIndexAt(index: number) {
    return this.#originalIndices[index]
  }

  isAddition(item: T, fromIdx: number) {
    return this.findIndexFrom(item, fromIdx) === -1
  }

  findIndexFrom(item: T, fromIdx: number) {
    for (let i = fromIdx; i < this.length; i++) {
      if (this.#equalsFn(item, this.#array[i])) {
        return i
      }
    }
    return -1
  }

  addItem(item: T, index: number): AdditionOperation<T> {
    const operation: AdditionOperation<T> = {
      op: ARRAY_DIFF_OP.ADD,
      index,
      item,
    }
    this.#array.splice(index, 0, item)
    this.#originalIndices.splice(index, 0, -1)
    return operation
  }

  moveItem(item: T, toIndex: number): MoveOperation<T> {
    const fromIndex = this.findIndexFrom(item, toIndex)
    const operation: MoveOperation<T> = {
      op: ARRAY_DIFF_OP.MOVE,
      originalIndex: this.originalIndexAt(fromIndex),
      from: fromIndex,
      index: toIndex,
      item: this.#array[fromIndex],
    }
    const [_item] = this.#array.splice(fromIndex, 1)
    this.#array.splice(toIndex, 0, _item)
    const [originalIndex] = this.#originalIndices.splice(fromIndex, 1)
    this.#originalIndices.splice(toIndex, 0, originalIndex)
    return operation
  }

  removeItemsAfter(index: number) {
    const operations = []
    while (this.length > index) {
      operations.push(this.removeItem(index))
    }
    return operations
  }
}

export function arraysDiffSequence<T>(
  oldArray: T[],
  newArray: T[],
  equalsFn = (a: T, b: T) => a === b
) {
  const sequence: Operation<T>[] = []
  const array = new ArrayWithOriginalIndices(oldArray, equalsFn)

  for (let index = 0; index < newArray.length; index++) {
    if (array.isRemoval(index, newArray)) {
      sequence.push(array.removeItem(index))
      index--
      continue
    }
    if (array.isNoop(index, newArray)) {
      sequence.push(array.noopItem(index))
      continue
    }
    const item = newArray[index]
    if (array.isAddition(item, index)) {
      sequence.push(array.addItem(item, index))
      continue
    }

    sequence.push(array.moveItem(item, index))
  }
  sequence.push(...array.removeItemsAfter(newArray.length))

  return sequence
}
