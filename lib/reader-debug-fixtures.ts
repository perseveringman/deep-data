import { readFile } from 'node:fs/promises'
import path from 'node:path'

import type { ReaderDocumentIdentity } from '../components/reader-platform/core.ts'
import type { ContentItem } from './mock-data.ts'
import { contentItems } from './mock-data.ts'

const CONTENT_DIR = path.join(process.cwd(), 'content')

const debugContentFiles = {
  markdown: 'reader-proposal.md',
  pdf: 'The_Innovators_Dilemma_When_New_Techn_z_library_sk,_1lib_sk,.pdf',
  epub: 'Pitch_Perfect_How_to_Say_It_Right_the_z_library_sk,_1lib_sk,.epub',
  youtube: 'youtube-semiconductor.md',
  podcast: 'podcast-agent.md',
} as const

type DebugReaderType = 'youtube' | 'podcast' | 'markdown' | 'pdf' | 'epub'

interface DebugFixtureBase {
  id: DebugReaderType
  type: DebugReaderType
  label: string
  description: string
}

export interface DebugYouTubeFixture extends DebugFixtureBase {
  id: 'youtube'
  type: 'youtube'
  content: ContentItem
  markdownContent: string
}

export interface DebugPodcastFixture extends DebugFixtureBase {
  id: 'podcast'
  type: 'podcast'
  content: ContentItem
  markdownContent: string
}

export interface DebugMarkdownFixture extends DebugFixtureBase {
  id: 'markdown'
  type: 'markdown'
  identity: ReaderDocumentIdentity
  markdownContent: string
}

export interface DebugPdfFixture extends DebugFixtureBase {
  id: 'pdf'
  type: 'pdf'
  identity: ReaderDocumentIdentity
  source: { url: string }
}

export interface DebugEpubFixture extends DebugFixtureBase {
  id: 'epub'
  type: 'epub'
  identity: ReaderDocumentIdentity
  source: { url: string }
}

export type ReaderDebugFixture =
  | DebugYouTubeFixture
  | DebugPodcastFixture
  | DebugMarkdownFixture
  | DebugPdfFixture
  | DebugEpubFixture

function findContentFixture(type: 'youtube' | 'podcast', contentFile: string): ContentItem {
  const fixture = contentItems.find(
    (item) => item.type === type && item.contentFile === contentFile,
  )

  if (!fixture) {
    throw new Error(`Missing ${type} debug fixture for ${contentFile}`)
  }

  return fixture
}

function getContentPath(fileName: string): string {
  return path.join(CONTENT_DIR, fileName)
}

export function getDebugContentAssetUrl(fileName: string): string {
  return `/api/debug/content/${encodeURIComponent(fileName)}`
}

export function resolveDebugContentAssetPath(fileName: string): string | null {
  const allowedFiles = new Set(Object.values(debugContentFiles))
  if (!allowedFiles.has(fileName as (typeof debugContentFiles)[keyof typeof debugContentFiles])) {
    return null
  }

  return getContentPath(fileName)
}

export async function getReaderDebugFixtures(): Promise<ReaderDebugFixture[]> {
  const youtubeContent = findContentFixture('youtube', '/content/youtube-semiconductor.md')
  const podcastContent = findContentFixture('podcast', '/content/podcast-agent.md')

  const [youtubeMarkdown, podcastMarkdown, readerProposalMarkdown] = await Promise.all([
    readFile(getContentPath(debugContentFiles.youtube), 'utf8'),
    readFile(getContentPath(debugContentFiles.podcast), 'utf8'),
    readFile(getContentPath(debugContentFiles.markdown), 'utf8'),
  ])

  return [
    {
      id: 'youtube',
      type: 'youtube',
      label: 'YouTube Reader',
      description: debugContentFiles.youtube,
      content: youtubeContent,
      markdownContent: youtubeMarkdown,
    },
    {
      id: 'podcast',
      type: 'podcast',
      label: 'Podcast Reader',
      description: debugContentFiles.podcast,
      content: podcastContent,
      markdownContent: podcastMarkdown,
    },
    {
      id: 'markdown',
      type: 'markdown',
      label: 'Markdown Reader',
      description: debugContentFiles.markdown,
      identity: {
        readerType: 'markdown',
        documentId: 'debug-markdown-reader-proposal',
        title: 'Reader proposal',
        sourceUrl: `/content/${debugContentFiles.markdown}`,
        language: 'en',
      },
      markdownContent: readerProposalMarkdown,
    },
    {
      id: 'pdf',
      type: 'pdf',
      label: 'PDF Reader',
      description: debugContentFiles.pdf,
      identity: {
        readerType: 'pdf',
        documentId: 'debug-pdf-innovators-dilemma',
        title: 'The Innovator’s Dilemma',
        sourceUrl: getDebugContentAssetUrl(debugContentFiles.pdf),
        language: 'en',
      },
      source: {
        url: getDebugContentAssetUrl(debugContentFiles.pdf),
      },
    },
    {
      id: 'epub',
      type: 'epub',
      label: 'EPUB Reader',
      description: debugContentFiles.epub,
      identity: {
        readerType: 'epub',
        documentId: 'debug-epub-pitch-perfect',
        title: 'Pitch Perfect',
        sourceUrl: getDebugContentAssetUrl(debugContentFiles.epub),
        language: 'en',
      },
      source: {
        url: getDebugContentAssetUrl(debugContentFiles.epub),
      },
    },
  ]
}
