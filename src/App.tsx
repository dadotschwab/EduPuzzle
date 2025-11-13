import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { Dashboard } from './pages/Dashboard'
import { WordListDetail } from './pages/WordListDetail'
import { PuzzleSolver } from './pages/PuzzleSolver'
import { DailyReview } from './pages/DailyReview'
import { Statistics } from './pages/Statistics'
import { SettingsLayout } from './pages/Settings/SettingsLayout'
import { AccountSettings } from './pages/Settings/AccountSettings'
import { SubscriptionSettings } from './pages/Settings/SubscriptionSettings'

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
            <SettingsLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/settings/account" replace />} />
        <Route path="account" element={<AccountSettings />} />
        <Route path="subscription" element={<SubscriptionSettings />} />
      </Route>
    </Routes>
  )
}

export default App
