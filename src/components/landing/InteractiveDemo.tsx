interface InteractiveDemoProps {
  className?: string
}

export function InteractiveDemo({ className }: InteractiveDemoProps) {
  return (
    <section id="demo" className={`py-20 bg-white ${className || ''}`}>
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-8">Interactive Demo</h2>
        <p className="text-gray-600">AI-powered clue generation demo will be implemented here</p>
      </div>
    </section>
  )
}
