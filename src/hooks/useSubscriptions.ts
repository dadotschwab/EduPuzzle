import { useCallback, useEffect, useRef } from 'react'

interface Subscription {
  unsubscribe: () => void
  id?: string
}

export function useSubscriptions() {
  const subscriptionsRef = useRef<Set<Subscription>>(new Set())

  const addSubscription = useCallback((subscription: Subscription) => {
    subscriptionsRef.current.add(subscription)
    return subscription
  }, [])

  const removeSubscription = useCallback((subscription: Subscription) => {
    subscription.unsubscribe()
    subscriptionsRef.current.delete(subscription)
  }, [])

  const clearAllSubscriptions = useCallback(() => {
    subscriptionsRef.current.forEach((sub) => sub.unsubscribe())
    subscriptionsRef.current.clear()
  }, [])

  // Cleanup all subscriptions on unmount
  useEffect(() => {
    return () => {
      clearAllSubscriptions()
    }
  }, [clearAllSubscriptions])

  return {
    addSubscription,
    removeSubscription,
    clearAllSubscriptions,
  }
}
