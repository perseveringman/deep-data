'use client'

import { useEffect, useRef, useState } from 'react'
import { Person, PersonRelation } from '@/lib/mock-data'

interface PersonNetworkProps {
  persons: Person[]
  relations: PersonRelation[]
  onPersonClick?: (personId: string) => void
  selectedPersonId?: string
  compact?: boolean
}

interface Node {
  id: string
  name: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  mentionCount: number
}

interface Link {
  source: string
  target: string
  relationType: PersonRelation['relationType']
  strength: number
}

const relationTypeColors: Record<PersonRelation['relationType'], string> = {
  colleague: '#6b7280',
  competitor: '#ef4444',
  mentor: '#22c55e',
  collaborator: '#3b82f6',
  critic: '#f97316',
  supporter: '#8b5cf6',
}

const relationTypeLabels: Record<PersonRelation['relationType'], string> = {
  colleague: '同事',
  competitor: '竞争',
  mentor: '导师',
  collaborator: '合作',
  critic: '批评',
  supporter: '支持',
}

export function PersonNetwork({
  persons,
  relations,
  onPersonClick,
  selectedPersonId,
  compact = false,
}: PersonNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [links, setLinks] = useState<Link[]>([])
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })

  useEffect(() => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      setDimensions({ width: rect.width || 800, height: compact ? 400 : 500 })
    }
  }, [compact])

  useEffect(() => {
    const maxMentions = Math.max(...persons.map(p => p.mentionCount))
    const minRadius = compact ? 16 : 20
    const maxRadius = compact ? 32 : 45

    // 初始化节点位置（圆形布局）
    const centerX = dimensions.width / 2
    const centerY = dimensions.height / 2
    const radius = Math.min(dimensions.width, dimensions.height) * 0.35

    const initialNodes: Node[] = persons.map((person, i) => {
      const angle = (2 * Math.PI * i) / persons.length - Math.PI / 2
      const nodeRadius = minRadius + (person.mentionCount / maxMentions) * (maxRadius - minRadius)
      return {
        id: person.id,
        name: person.name,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
        radius: nodeRadius,
        mentionCount: person.mentionCount,
      }
    })

    const initialLinks: Link[] = relations.map(r => ({
      source: r.sourceId,
      target: r.targetId,
      relationType: r.relationType,
      strength: r.strength,
    }))

    // 简单的力导向模拟
    const simulate = (nodes: Node[], links: Link[], iterations: number) => {
      const nodeMap = new Map(nodes.map(n => [n.id, n]))
      
      for (let i = 0; i < iterations; i++) {
        // 节点之间的斥力
        for (let j = 0; j < nodes.length; j++) {
          for (let k = j + 1; k < nodes.length; k++) {
            const dx = nodes[k].x - nodes[j].x
            const dy = nodes[k].y - nodes[j].y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const minDist = nodes[j].radius + nodes[k].radius + 60
            
            if (dist < minDist) {
              const force = (minDist - dist) / dist * 0.5
              nodes[j].vx -= dx * force
              nodes[j].vy -= dy * force
              nodes[k].vx += dx * force
              nodes[k].vy += dy * force
            }
          }
        }

        // 连接的引力
        for (const link of links) {
          const source = nodeMap.get(link.source)
          const target = nodeMap.get(link.target)
          if (source && target) {
            const dx = target.x - source.x
            const dy = target.y - source.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const idealDist = 150 + (100 - link.strength)
            const force = (dist - idealDist) / dist * 0.02
            
            source.vx += dx * force
            source.vy += dy * force
            target.vx -= dx * force
            target.vy -= dy * force
          }
        }

        // 向中心的引力
        for (const node of nodes) {
          node.vx += (centerX - node.x) * 0.001
          node.vy += (centerY - node.y) * 0.001
        }

        // 应用速度并添加阻尼
        for (const node of nodes) {
          node.x += node.vx
          node.y += node.vy
          node.vx *= 0.9
          node.vy *= 0.9
          
          // 边界约束
          const margin = node.radius + 10
          node.x = Math.max(margin, Math.min(dimensions.width - margin, node.x))
          node.y = Math.max(margin, Math.min(dimensions.height - margin, node.y))
        }
      }

      return nodes
    }

    const simulatedNodes = simulate([...initialNodes], initialLinks, 100)
    setNodes(simulatedNodes)
    setLinks(initialLinks)
  }, [persons, relations, dimensions, compact])

  const getNodeById = (id: string) => nodes.find(n => n.id === id)

  const isNodeHighlighted = (nodeId: string) => {
    if (!hoveredNode && !selectedPersonId) return true
    const targetId = hoveredNode || selectedPersonId
    if (nodeId === targetId) return true
    return links.some(l => 
      (l.source === targetId && l.target === nodeId) ||
      (l.target === targetId && l.source === nodeId)
    )
  }

  const isLinkHighlighted = (link: Link) => {
    if (!hoveredNode && !selectedPersonId) return true
    const targetId = hoveredNode || selectedPersonId
    return link.source === targetId || link.target === targetId
  }

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        className="w-full"
        style={{ height: compact ? 400 : 500 }}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        {/* 连接线 */}
        {links.map((link, i) => {
          const source = getNodeById(link.source)
          const target = getNodeById(link.target)
          if (!source || !target) return null
          
          const highlighted = isLinkHighlighted(link)
          
          return (
            <g key={i} opacity={highlighted ? 1 : 0.15}>
              <line
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={relationTypeColors[link.relationType]}
                strokeWidth={Math.max(1, link.strength / 30)}
                strokeDasharray={link.relationType === 'critic' ? '4,4' : undefined}
              />
              {/* 关系类型标签 */}
              {highlighted && (hoveredNode || selectedPersonId) && (
                <text
                  x={(source.x + target.x) / 2}
                  y={(source.y + target.y) / 2 - 6}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[9px]"
                >
                  {relationTypeLabels[link.relationType]}
                </text>
              )}
            </g>
          )
        })}

        {/* 节点 */}
        {nodes.map(node => {
          const highlighted = isNodeHighlighted(node.id)
          const isSelected = node.id === selectedPersonId
          const isHovered = node.id === hoveredNode
          
          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              opacity={highlighted ? 1 : 0.25}
              className="cursor-pointer"
              onClick={() => onPersonClick?.(node.id)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* 外圈高亮 */}
              {(isSelected || isHovered) && (
                <circle
                  r={node.radius + 4}
                  fill="none"
                  stroke={isSelected ? '#000' : '#666'}
                  strokeWidth={2}
                />
              )}
              {/* 节点圆形 */}
              <circle
                r={node.radius}
                fill="#fff"
                stroke="#000"
                strokeWidth={1.5}
              />
              {/* 提及次数（内部小圆） */}
              <circle
                r={node.radius * 0.6}
                fill="#f5f5f5"
              />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground font-mono text-[10px] font-medium"
              >
                {node.mentionCount}
              </text>
              {/* 名字 */}
              <text
                y={node.radius + 12}
                textAnchor="middle"
                className={`fill-foreground text-[11px] ${compact ? '' : 'font-medium'}`}
              >
                {node.name}
              </text>
            </g>
          )
        })}
      </svg>

      {/* 图例 */}
      <div className={`absolute ${compact ? 'bottom-2 right-2' : 'bottom-4 right-4'} flex flex-wrap gap-2 rounded border border-border bg-background/95 p-2`}>
        {Object.entries(relationTypeLabels).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1">
            <div
              className="h-2 w-4 rounded-sm"
              style={{ backgroundColor: relationTypeColors[type as PersonRelation['relationType']] }}
            />
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
