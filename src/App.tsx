import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
)

// Lazy load pages for code splitting
const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage }))
)
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('./pages/SignupPage').then((m) => ({ default: m.SignupPage })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const WordListDetail = lazy(() =>
  import('./pages/WordListDetail').then((m) => ({ default: m.WordListDetail }))
)
const PuzzleSolver = lazy(() =>
  import('./pages/PuzzleSolver').then((m) => ({ default: m.PuzzleSolver }))
)
const TodaysPuzzles = lazy(() =>
  import('./pages/TodaysPuzzles').then((m) => ({ default: m.TodaysPuzzles }))
)
const SettingsLayout = lazy(() =>
  import('./pages/Settings/SettingsLayout').then((m) => ({ default: m.SettingsLayout }))
)
const AccountSettings = lazy(() =>
  import('./pages/Settings/AccountSettings').then((m) => ({ default: m.AccountSettings }))
)
const SubscriptionSettings = lazy(() =>
  import('./pages/Settings/SubscriptionSettings').then((m) => ({ default: m.SubscriptionSettings }))
)
const Buddy = lazy(() => import('./pages/Settings/Buddy').then((m) => ({ default: m.Buddy })))
const PerformanceStats = lazy(() =>
  import('./pages/Settings/PerformanceStats').then((m) => ({ default: m.PerformanceStats }))
)
const SubscriptionSuccess = lazy(() =>
  import('./pages/SubscriptionSuccess').then((m) => ({ default: m.SubscriptionSuccess }))
)
const SubscriptionCancel = lazy(() =>
  import('./pages/SubscriptionCancel').then((m) => ({ default: m.SubscriptionCancel }))
)
const SharedList = lazy(() => import('./pages/SharedList').then((m) => ({ default: m.SharedList })))
const BuddyAccept = lazy(() =>
  import('./pages/BuddyAccept').then((m) => ({ default: m.BuddyAccept }))
)

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/shared/:token" element={<SharedList />} />
        <Route path="/buddy/accept/:token" element={<BuddyAccept />} />

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
          <Route path="buddy" element={<Buddy />} />
          <Route path="stats" element={<PerformanceStats />} />
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
    </Suspense>
  )
}

export default App
