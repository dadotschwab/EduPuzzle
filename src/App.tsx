import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { Dashboard } from './pages/Dashboard'
import { WordListDetail } from './pages/WordListDetail'
import { PuzzleSolver } from './pages/PuzzleSolver'
import { DailyReview } from './pages/DailyReview'
import { Statistics } from './pages/Statistics'
import { UserSettings } from './pages/UserSettings'
import { SubscriptionManagement } from './pages/SubscriptionManagement'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/lists/:id"
        element={
          <ProtectedRoute>
            <WordListDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/puzzle/:sessionId"
        element={
          <ProtectedRoute>
            <PuzzleSolver />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/review"
        element={
          <ProtectedRoute>
            <DailyReview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/stats"
        element={
          <ProtectedRoute>
            <Statistics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <UserSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription"
        element={
          <ProtectedRoute>
            <SubscriptionManagement />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
