import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Menu,
  X,
  Puzzle,
  ArrowRight,
  Star,
  Brain,
  Gamepad2,
  Upload,
  Play,
  Grid3X3,
  Github,
  Twitter,
  Instagram,
  Cpu,
  Calendar,
  Languages,
  Share2,
} from 'lucide-react'

// --- TYPES ---
interface NavItem {
  label: string
  href: string
}

interface Feature {
  title: string
  description: string
  icon: React.ComponentType<any>
}

// --- COMPONENTS ---

// Header Component
const NAV_ITEMS: NavItem[] = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
]

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-lg border-b border-slate-100">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md shadow-violet-200">
            <Puzzle size={22} className="fill-white/20" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">EduPuzzle</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-semibold text-slate-500 hover:text-violet-600 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/signup">
            <Button size="sm">Get Started Free</Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white p-4 absolute w-full shadow-xl rounded-b-2xl">
          <nav className="flex flex-col gap-4">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-lg font-medium text-slate-600 hover:text-violet-600 p-2 rounded-lg hover:bg-violet-50"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <hr className="my-2 border-slate-100" />
            <Link to="/login">
              <Button variant="ghost" className="justify-start w-full">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="w-full">Get Started Free</Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}

// Hero Component
function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-28 lg:pb-32 pattern-bg">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
          <div className="inline-flex items-center rounded-full border-2 border-slate-900 bg-amber-300 px-4 py-1.5 text-sm font-bold text-slate-900 mb-8 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <Star size={16} className="mr-2 fill-slate-900" />
            Boring homework is officially cancelled
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
            Study Words. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-pink-500">
              Play Games.
            </span>
            <br /> Win Grades.
          </h1>

          <p className="text-xl text-slate-600 mb-10 leading-relaxed font-medium">
            Turn that dreadfully long vocabulary list into an epic crossword battle. Our AI builds
            unique puzzles instantly, so you can learn without falling asleep.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
            <Link to="/signup">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8">
                Generate a Puzzle Free
                <ArrowRight className="ml-2" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg">
                See How It Works
              </Button>
            </a>
          </div>

          <div className="flex items-center justify-center lg:justify-start gap-4 text-sm font-semibold text-slate-500">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-pink-400 border-2 border-white"></div>
              <div className="w-8 h-8 rounded-full bg-violet-400 border-2 border-white"></div>
              <div className="w-8 h-8 rounded-full bg-amber-400 border-2 border-white"></div>
            </div>
            <p>Join thousands of happy students</p>
          </div>
        </div>
      </div>
    </section>
  )
}

// Features Component
const featuresList: Feature[] = [
  {
    title: 'Create Custom Word Lists',
    description:
      'Build vocabulary lists in any language pair. Add words with translations and example sentences.',
    icon: Upload,
  },
  {
    title: 'AI-Generated Puzzles',
    description:
      'Our smart algorithm creates perfect crossword puzzles from your words automatically.',
    icon: Brain,
  },
  {
    title: 'Spaced Repetition',
    description:
      'Master vocabulary with proven learning science. The app tracks what you know and schedules reviews.',
    icon: Calendar,
  },
  {
    title: "Today's Practice",
    description:
      'Get daily puzzle challenges with words due for review. Turn studying into a fun game.',
    icon: Gamepad2,
  },
  {
    title: 'Multi-Language Support',
    description: 'Learn any language pair. From Spanish to Japanese, French to German, and beyond.',
    icon: Languages,
  },
  {
    title: 'Collaborate & Share',
    description:
      'Share word lists with friends. Work together on vocabulary. Challenge each other to solve puzzles faster.',
    icon: Share2,
  },
]

function Features() {
  return (
    <section id="features" className="py-24 bg-white relative">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-6">
            Not Your Grandma's Crossword
          </h2>
          <p className="text-xl text-slate-600">
            We stripped out the boring parts of studying and replaced them with dopamine.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuresList.map((feature, idx) => (
            <div
              key={feature.title}
              className="group relative bg-white rounded-3xl p-8 border-2 border-slate-100 hover:border-slate-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
            >
              <div
                className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 transition-transform ${idx % 3 === 0 ? 'bg-violet-500' : idx % 3 === 1 ? 'bg-pink-500' : 'bg-amber-500'}`}
              >
                <feature.icon size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 text-lg leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// How It Works Section
function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 bg-slate-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <span className="text-violet-600 font-bold tracking-wider uppercase text-sm">
            Simple as 1-2-3
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">How it Works</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 border-t-2 border-dashed border-slate-300 z-0"></div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-white rounded-full border-4 border-slate-100 flex items-center justify-center mb-6 shadow-sm">
              <Upload size={32} className="text-violet-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">1. Add Your Words</h3>
            <p className="text-slate-600">
              Create a word list and add vocabulary with translations.
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-white rounded-full border-4 border-slate-100 flex items-center justify-center mb-6 shadow-sm">
              <Cpu size={32} className="text-pink-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">2. AI Generates Puzzle</h3>
            <p className="text-slate-600">
              Our algorithm creates a perfect crossword grid instantly.
            </p>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-white rounded-full border-4 border-slate-100 flex items-center justify-center mb-6 shadow-sm">
              <Play size={32} className="text-amber-500 fill-amber-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">3. Play & Master</h3>
            <p className="text-slate-600">
              Solve puzzles, learn with spaced repetition, ace your tests.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// CTA Section
function CTASection() {
  return (
    <section className="py-24 bg-violet-600 relative overflow-hidden">
      {/* Fun pattern background overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(#fff 2px, transparent 2px)',
          backgroundSize: '30px 30px',
        }}
      ></div>

      <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
          Stop Staring at Flashcards.
        </h2>
        <p className="text-violet-100 text-xl mb-10 max-w-2xl mx-auto">
          Join students who actually have fun studying. Create your first puzzle in 30 seconds.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/signup">
            <Button
              variant="secondary"
              size="lg"
              className="px-12 text-lg shadow-[6px_6px_0px_0px_rgba(0,0,0,0.2)]"
            >
              Start For Free
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-sm text-violet-200 opacity-80 font-medium">
          No credit card • No boring stuff
        </p>
      </div>
    </section>
  )
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4 text-white">
              <Grid3X3 size={24} className="text-violet-500" />
              <span className="text-xl font-bold">EduPuzzle</span>
            </div>
            <p className="max-w-xs text-sm text-slate-400">
              Making studying less painful and more playful. Join thousands of students mastering
              their exams one puzzle at a time.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <Link to="/signup" className="hover:text-white transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} EduPuzzle. All rights reserved.
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-slate-400 hover:text-white">
              <Twitter size={20} />
            </a>
            <a href="#" className="text-slate-400 hover:text-white">
              <Github size={20} />
            </a>
            <a href="#" className="text-slate-400 hover:text-white">
              <Instagram size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// --- MAIN APP COMPONENT ---
export function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-pink-200">
      <Header />

      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <CTASection />
      </main>

      <Footer />
    </div>
  )
}
