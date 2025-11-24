interface FeaturesGridProps {
  className?: string
}

export function FeaturesGrid({ className }: FeaturesGridProps) {
  return (
    <section id="features" className={`py-20 bg-gray-50 ${className || ''}`}>
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-8">Features</h2>
        <p className="text-gray-600">
          Feature showcase with hover animations will be implemented here
        </p>
      </div>
    </section>
  )
}
