import { Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { Dashboard } from './pages/Dashboard'
import { WordListsOverview } from './pages/WordListsOverview'
import { WordListDetail } from './pages/WordListDetail'
import { PuzzleSolver } from './pages/PuzzleSolver'
import { DailyReview } from './pages/DailyReview'
import { Statistics } from './pages/Statistics'
import { UserSettings } from './pages/UserSettings'
import { SubscriptionManagement } from './pages/SubscriptionManagement'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<Dashboard />} />
      <Route path="/app/lists" element={<WordListsOverview />} />
      <Route path="/app/lists/:id" element={<WordListDetail />} />
      <Route path="/app/puzzle/:sessionId" element={<PuzzleSolver />} />
      <Route path="/app/review" element={<DailyReview />} />
      <Route path="/app/stats" element={<Statistics />} />
      <Route path="/settings" element={<UserSettings />} />
      <Route path="/subscription" element={<SubscriptionManagement />} />
    </Routes>
  )
}

export default App
