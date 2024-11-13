import { ChildNodeType } from '../h'

export function withoutNulls(
  arr: ChildNodeType[]
): Exclude<ChildNodeType, null | undefined>[] {
  return arr.filter((item) => item != null)
}
