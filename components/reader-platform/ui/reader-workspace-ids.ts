export type ReaderWorkspaceSection = 'translation' | 'ai' | 'annotations'

export function getReaderWorkspaceRootId(idPrefix: string) {
  return `${idPrefix}-root`
}

export function getReaderWorkspaceSectionId(
  idPrefix: string,
  section: ReaderWorkspaceSection,
) {
  return `${idPrefix}-${section}`
}
