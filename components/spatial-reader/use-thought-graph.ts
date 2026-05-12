'use client'

import { useCallback, useMemo, useRef, useState } from 'react'

import type { ReaderAnalysisContext } from '@/components/reader-platform/analysis'
import type { ReaderDocumentIdentity } from '@/components/reader-platform/core'

import { mockThoughtActionExecutor } from './actions'
import type {
  ThoughtActionDefinition,
  ThoughtActionExecutor,
  ThoughtAiNode,
  ThoughtNode,
  ThoughtNodeChange,
  ThoughtPoint,
  ThoughtSourceSelection,
  ThoughtView,
  ThoughtViewMode,
} from './thought-graph'
import {
  createThoughtId,
  snapshotThoughtAction,
} from './thought-graph'

interface UseThoughtGraphOptions {
  identity: ReaderDocumentIdentity
  analysisContext?: ReaderAnalysisContext | null
  initialNodes?: ThoughtNode[]
  actionExecutor?: ThoughtActionExecutor
  onThoughtNodeChange?: (change: ThoughtNodeChange) => void
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function getDefaultPosition(selection: ThoughtSourceSelection, index: number): ThoughtPoint {
  const side = index % 2 === 0 ? -1 : 1
  const depth = Math.floor(index / 2)
  const anchor = selection.anchorRect

  if (!anchor || typeof window === 'undefined') {
    return {
      x: 80 + depth * 36,
      y: 120 + depth * 44,
    }
  }

  const width = 360
  const x = side < 0
    ? anchor.left - width - 48 - depth * 28
    : anchor.right + 48 + depth * 28

  return {
    x: clamp(x, 24, Math.max(24, window.innerWidth - width - 24)),
    y: clamp(anchor.top - 24 + depth * 42, 72, Math.max(72, window.innerHeight - 280)),
  }
}

function createDefaultView(
  selection: ThoughtSourceSelection,
  index: number,
  mode: ThoughtViewMode,
  zIndex: number,
): ThoughtView {
  return {
    mode,
    position: getDefaultPosition(selection, index),
    size: {
      width: 380,
      height: 300,
    },
    status: mode === 'window' ? 'open' : 'minimized',
    zIndex,
  }
}

export function useThoughtGraph({
  identity,
  analysisContext,
  initialNodes = [],
  actionExecutor = mockThoughtActionExecutor,
  onThoughtNodeChange,
}: UseThoughtGraphOptions) {
  const [nodes, setNodes] = useState<ThoughtNode[]>(initialNodes)
  const zIndexRef = useRef(220)

  const getNextZIndex = useCallback(() => {
    zIndexRef.current += 1
    return zIndexRef.current
  }, [])

  const emitChange = useCallback(
    (type: ThoughtNodeChange['type'], node: ThoughtNode) => {
      onThoughtNodeChange?.({ type, node })
    },
    [onThoughtNodeChange],
  )

  const replaceNodes = useCallback((nextNodes: ThoughtNode[]) => {
    setNodes(nextNodes)
    zIndexRef.current = Math.max(
      zIndexRef.current,
      220,
      ...nextNodes.map((node) => node.view.zIndex),
    )
  }, [])

  const patchNode = useCallback(
    (nodeId: string, patch: (node: ThoughtNode) => ThoughtNode) => {
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== nodeId) return node

          const nextNode = patch(node)
          emitChange('update', nextNode)
          return nextNode
        }),
      )
    },
    [emitChange],
  )

  const runAction = useCallback(
    async (
      node: ThoughtAiNode,
      action: ThoughtActionDefinition,
      sourceNode?: ThoughtNode | null,
    ) => {
      patchNode(node.id, (current) =>
        current.kind === 'ai-result'
          ? {
              ...current,
              status: 'streaming',
              error: undefined,
              updatedAt: new Date().toISOString(),
            }
          : current,
      )

      const prompt = action.prompt({
        sourceText: node.sourceText,
        analysisContext,
        sourceNode,
      })

      try {
        await actionExecutor(
          {
            node,
            action,
            prompt,
            analysisContext,
            sourceNode,
          },
          {
            onChunk: (deltaMarkdown) => {
              patchNode(node.id, (current) =>
                current.kind === 'ai-result'
                  ? {
                      ...current,
                      contentMarkdown: `${current.contentMarkdown}${deltaMarkdown}`,
                      status: 'streaming',
                      updatedAt: new Date().toISOString(),
                    }
                  : current,
              )
            },
          },
        )

        patchNode(node.id, (current) =>
          current.kind === 'ai-result'
            ? {
                ...current,
                status: 'done',
                updatedAt: new Date().toISOString(),
              }
            : current,
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        patchNode(node.id, (current) =>
          current.kind === 'ai-result'
            ? {
                ...current,
                status: 'error',
                error: message,
                updatedAt: new Date().toISOString(),
              }
            : current,
        )
      }
    },
    [actionExecutor, analysisContext, patchNode],
  )

  const createAiNode = useCallback(
    (
      selection: ThoughtSourceSelection,
      action: ThoughtActionDefinition,
      {
        mode = 'window',
        sourceNode,
        fanIndex,
      }: {
        mode?: ThoughtViewMode
        sourceNode?: ThoughtNode | null
        fanIndex?: number
      } = {},
    ) => {
      const timestamp = new Date().toISOString()
      const node: ThoughtAiNode = {
        id: createThoughtId(action.id),
        kind: 'ai-result',
        documentId: identity.documentId,
        readerType: identity.readerType,
        sourceRange: selection.range,
        sourceText: selection.text,
        sourceNodeId: selection.sourceNodeId,
        action: snapshotThoughtAction(action),
        contentMarkdown: '',
        status: 'pending',
        view: createDefaultView(
          selection,
          fanIndex ?? nodes.length,
          mode,
          getNextZIndex(),
        ),
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      setNodes((current) => [node, ...current])
      emitChange('create', node)
      void runAction(node, action, sourceNode)
      return node
    },
    [
      emitChange,
      getNextZIndex,
      identity.documentId,
      identity.readerType,
      nodes.length,
      runAction,
    ],
  )

  const createAiNodes = useCallback(
    (
      selection: ThoughtSourceSelection,
      actions: ThoughtActionDefinition[],
      options?: {
        mode?: ThoughtViewMode
        sourceNode?: ThoughtNode | null
      },
    ) =>
      actions.map((action, index) =>
        createAiNode(selection, action, {
          ...options,
          fanIndex: index,
        }),
      ),
    [createAiNode],
  )

  const createNoteNode = useCallback(
    (
      selection: ThoughtSourceSelection,
      {
        contentMarkdown = selection.text,
        mode = 'sidebar-card',
      }: {
        contentMarkdown?: string
        mode?: ThoughtViewMode
      } = {},
    ) => {
      const timestamp = new Date().toISOString()
      const node: ThoughtNode = {
        id: createThoughtId('note'),
        kind: 'note',
        documentId: identity.documentId,
        readerType: identity.readerType,
        sourceRange: selection.range,
        sourceText: selection.text,
        sourceNodeId: selection.sourceNodeId,
        color: 'yellow',
        contentMarkdown,
        status: 'done',
        view: createDefaultView(selection, nodes.length, mode, getNextZIndex()),
        createdAt: timestamp,
        updatedAt: timestamp,
      }

      setNodes((current) => [node, ...current])
      emitChange('create', node)
      return node
    },
    [
      emitChange,
      getNextZIndex,
      identity.documentId,
      identity.readerType,
      nodes.length,
    ],
  )

  const updateNodeView = useCallback(
    (nodeId: string, viewPatch: Partial<ThoughtView>) => {
      patchNode(nodeId, (node) => ({
        ...node,
        view: {
          ...node.view,
          ...viewPatch,
          position: viewPatch.position ?? node.view.position,
          size: viewPatch.size ?? node.view.size,
        },
        updatedAt: new Date().toISOString(),
      }))
    },
    [patchNode],
  )

  const bringNodeToFront = useCallback(
    (nodeId: string) => {
      updateNodeView(nodeId, {
        status: 'open',
        zIndex: getNextZIndex(),
      })
    },
    [getNextZIndex, updateNodeView],
  )

  const setNodeMode = useCallback(
    (nodeId: string, mode: ThoughtViewMode) => {
      updateNodeView(nodeId, {
        mode,
        status: mode === 'window' ? 'open' : 'minimized',
        zIndex: getNextZIndex(),
      })
    },
    [getNextZIndex, updateNodeView],
  )

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((current) => {
        const target = current.find((node) => node.id === nodeId)
        if (target) {
          emitChange('delete', target)
        }
        return current.filter((node) => node.id !== nodeId)
      })
    },
    [emitChange],
  )

  const clearNodes = useCallback(() => {
    setNodes((current) => {
      current.forEach((node) => emitChange('delete', node))
      return []
    })
  }, [emitChange])

  const openNodes = useMemo(
    () =>
      nodes.filter(
        (node) => node.view.mode === 'window' && node.view.status === 'open',
      ),
    [nodes],
  )

  return {
    nodes,
    openNodes,
    replaceNodes,
    createAiNode,
    createAiNodes,
    createNoteNode,
    updateNodeView,
    bringNodeToFront,
    setNodeMode,
    deleteNode,
    clearNodes,
  }
}

