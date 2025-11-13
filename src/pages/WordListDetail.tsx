import { useParams } from 'react-router-dom'

export function WordListDetail() {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">Word List Detail</h1>
      <p className="text-gray-600">List ID: {id}</p>
    </div>
  )
}
