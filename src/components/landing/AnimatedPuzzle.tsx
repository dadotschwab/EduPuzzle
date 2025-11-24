import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedPuzzleProps {
  className?: string
}

// Simple crossword grid data for animation
const gridData = [
  ['A', 'P', 'P', 'L', 'E'],
  ['P', '', 'U', '', 'A'],
  ['P', 'L', 'A', 'Y', ''],
  ['', '', 'Y', '', ''],
  ['G', 'A', 'M', 'E', 'S'],
]

export function AnimatedPuzzle({ className }: AnimatedPuzzleProps) {
  const [animatedCells, setAnimatedCells] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Animate cells appearing one by one
    const cells = []
    for (let row = 0; row < gridData.length; row++) {
      for (let col = 0; col < gridData[row].length; col++) {
        if (gridData[row][col]) {
          cells.push(`${row}-${col}`)
        }
      }
    }

    cells.forEach((cellId, index) => {
      setTimeout(() => {
        setAnimatedCells((prev) => new Set([...prev, cellId]))
      }, index * 100)
    })
  }, [])

  return (
    <div className={cn('inline-block p-4 bg-white rounded-lg shadow-lg', className)}>
      <div className="grid grid-cols-5 gap-1">
        {gridData.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const cellId = `${rowIndex}-${colIndex}`
            const isAnimated = animatedCells.has(cellId)
            const isEmpty = !cell

            return (
              <div
                key={cellId}
                className={cn(
                  'w-12 h-12 border-2 flex items-center justify-center text-lg font-bold transition-all duration-300',
                  isEmpty ? 'border-gray-200 bg-gray-100' : 'border-blue-300 bg-blue-50',
                  isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                )}
              >
                {cell && (
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {cell}
                  </span>
                )}
              </div>
            )
          })
        )}
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600 animate-pulse">Watch words come to life!</p>
      </div>
    </div>
  )
}
