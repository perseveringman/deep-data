import fs from 'fs'
import path from 'path'

import { docToContentItem, getDocument, getDocumentRaw } from '@/lib/api'
import type { ContentItem } from '@/lib/types'

export interface ContentDetailData {
  content: ContentItem
  markdown: string
}

export async function loadContentDetail(id: string): Promise<ContentDetailData | null> {
  try {
    const doc = await getDocument(id, true)
    let markdown = doc.body || ''
    if (!markdown) markdown = await getDocumentRaw(id)
    return { content: docToContentItem(doc), markdown: markdown || '内容加载中…' }
  } catch (error) {
    if (process.env.NODE_ENV === 'production') throw error
    const { getContentById } = await import('@/lib/__mocks__')
    const content = getContentById(id)
    if (!content) return null
    try {
      const filePath = path.join(process.cwd(), 'content', content.contentFile.replace('/content/', ''))
      return { content, markdown: fs.readFileSync(filePath, 'utf-8') }
    } catch {
      return { content, markdown: '内容加载失败' }
    }
  }
}
