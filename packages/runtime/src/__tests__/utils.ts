export function singleHtmlLine(str: string[]) {
  return str[0].replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim()
}
