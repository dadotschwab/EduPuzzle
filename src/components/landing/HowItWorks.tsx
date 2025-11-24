interface HowItWorksProps {
  className?: string
}

export function HowItWorks({ className }: HowItWorksProps) {
  return (
    <section id="how-it-works" className={`py-20 bg-white ${className || ''}`}>
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-8">How It Works</h2>
        <p className="text-gray-600">3-step process visualization will be implemented here</p>
      </div>
    </section>
  )
}
