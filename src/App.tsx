import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { Dashboard } from './pages/Dashboard'
import { WordListDetail } from './pages/WordListDetail'
import { PuzzleSolver } from './pages/PuzzleSolver'
import { TodaysPuzzles } from './pages/TodaysPuzzles'
import { SettingsLayout } from './pages/Settings/SettingsLayout'
import { AccountSettings } from './pages/Settings/AccountSettings'
import { SubscriptionSettings } from './pages/Settings/SubscriptionSettings'
import { SubscriptionSuccess } from './pages/SubscriptionSuccess'
import { SubscriptionCancel } from './pages/SubscriptionCancel'

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
        path="/app/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/app/todays-puzzles"
        element={
          <ProtectedRoute>
            <TodaysPuzzles />
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
        path="/app/puzzle/:listId"
        element={
          <ProtectedRoute>
            <PuzzleSolver />
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

      {/* Subscription checkout flow routes */}
      <Route
        path="/subscription/success"
        element={
          <ProtectedRoute>
            <SubscriptionSuccess />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subscription/cancel"
        element={
          <ProtectedRoute>
            <SubscriptionCancel />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
