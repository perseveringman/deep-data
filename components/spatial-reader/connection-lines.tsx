'use client'

import { useEffect, useState } from 'react'

import type { ThoughtNode } from './thought-graph'
import {
  getThoughtHighlightElementId,
  getThoughtWindowElementId,
} from './thought-graph'

interface ThoughtConnection {
  id: string
  from: { x: number; y: number }
  to: { x: number; y: number }
  colorClass: string
  zIndex: number
}

const colorClassByAction: Record<string, string> = {
  translate: 'stroke-sky-400',
  explain: 'stroke-violet-400',
  formula: 'stroke-emerald-400',
  related: 'stroke-pink-400',
}

function getElementCenter(element: Element) {
  const rect = element.getBoundingClientRect()
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }
}

function getWindowDockPoint(element: Element, source: { x: number; y: number }) {
  const rect = element.getBoundingClientRect()
  const useRightEdge = source.x > rect.left + rect.width / 2

  return {
    x: useRightEdge ? rect.right : rect.left,
    y: rect.top + 42,
  }
}

function resolveSourceElement(node: ThoughtNode, nodes: ThoughtNode[]) {
  if (node.sourceNodeId) {
    const sourceNode = nodes.find((candidate) => candidate.id === node.sourceNodeId)
    if (sourceNode?.view.mode === 'window' && sourceNode.view.status === 'open') {
      return document.getElementById(getThoughtWindowElementId(sourceNode.id))
    }
  }

  return document.getElementById(getThoughtHighlightElementId(node.id))
}

export function ThoughtConnectionLines({
  nodes,
}: {
  nodes: ThoughtNode[]
}) {
  const [connections, setConnections] = useState<ThoughtConnection[]>([])

  useEffect(() => {
    let frameId = 0

    const update = () => {
      const nextConnections = nodes
        .filter((node) => node.view.mode === 'window' && node.view.status === 'open')
        .map((node): ThoughtConnection | null => {
          const sourceElement = resolveSourceElement(node, nodes)
          const targetElement = document.getElementById(getThoughtWindowElementId(node.id))
          if (!sourceElement || !targetElement) return null

          const from = getElementCenter(sourceElement)
          const to = getWindowDockPoint(targetElement, from)
          return {
            id: node.id,
            from,
            to,
            colorClass:
              node.kind === 'ai-result'
                ? colorClassByAction[node.action.id] ?? 'stroke-primary'
                : 'stroke-yellow-400',
            zIndex: Math.max(20, node.view.zIndex - 1),
          }
        })
        .filter((connection): connection is ThoughtConnection => Boolean(connection))

      setConnections((current) => {
        const currentHash = JSON.stringify(current)
        const nextHash = JSON.stringify(nextConnections)
        return currentHash === nextHash ? current : nextConnections
      })

      frameId = window.requestAnimationFrame(update)
    }

    update()
    return () => window.cancelAnimationFrame(frameId)
  }, [nodes])

  return (
    <>
      {connections.map((connection) => {
        const midX = connection.from.x + (connection.to.x - connection.from.x) / 2
        const path = `M ${connection.from.x} ${connection.from.y} C ${midX} ${connection.from.y}, ${midX} ${connection.to.y}, ${connection.to.x} ${connection.to.y}`

        return (
          <svg
            key={connection.id}
            className="pointer-events-none fixed inset-0 h-screen w-screen overflow-visible"
            style={{ zIndex: connection.zIndex }}
          >
            <path
              d={path}
              className={`${connection.colorClass} fill-none opacity-75 drop-shadow-sm`}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </svg>
        )
      })}
    </>
  )
}

