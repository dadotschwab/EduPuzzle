#!/bin/bash

# Stripe Webhook Testing Script
# Tests webhook event processing for subscription payment completion fixes
#
# Prerequisites:
# - Stripe CLI installed: npm install -g stripe
# - Local Supabase development server running
# - Stripe account with test mode enabled
# - Webhook endpoint configured in Stripe dashboard
#
# Usage:
#   ./scripts/test-stripe-webhooks.sh [test-scenario]
#
# Test Scenarios:
#   - checkout: Test checkout.session.completed event
#   - payment: Test invoice.payment_succeeded event
#   - subscription: Test customer.subscription.updated event
#   - failure: Test invoice.payment_failed event
#   - race: Test trial expiry race condition
#   - all: Run all test scenarios

set -e

# Configuration
WEBHOOK_URL="${WEBHOOK_URL:-http://localhost:54321/functions/v1/stripe-webhook}"
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY}"
STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    if ! command -v stripe &> /dev/null; then
        log_error "Stripe CLI not found. Install with: npm install -g stripe"
        exit 1
    fi

    if [ -z "$STRIPE_SECRET_KEY" ]; then
        log_error "STRIPE_SECRET_KEY environment variable not set"
        exit 1
    fi

    if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
        log_error "STRIPE_WEBHOOK_SECRET environment variable not set"
        exit 1
    fi

    # Check if webhook endpoint is configured
    if ! stripe webhooks list --api-key="$STRIPE_SECRET_KEY" | grep -q "$WEBHOOK_URL"; then
        log_warning "Webhook endpoint not found in Stripe dashboard"
        log_info "Please configure webhook endpoint: $WEBHOOK_URL"
        log_info "Required events: checkout.session.completed, customer.subscription.*, invoice.*"
    fi

    log_success "Prerequisites check passed"
}

# Test checkout.session.completed event
test_checkout_completion() {
    log_info "Testing checkout.session.completed event..."

    # Create a test checkout session
    stripe trigger checkout.session.completed --api-key="$STRIPE_SECRET_KEY"

    log_success "Checkout completion event triggered"
}

# Test invoice.payment_succeeded event
test_payment_success() {
    log_info "Testing invoice.payment_succeeded event..."

    # Trigger payment success event
    stripe trigger invoice.payment_succeeded --api-key="$STRIPE_SECRET_KEY"

    log_success "Payment success event triggered"
}

# Test customer.subscription.updated event
test_subscription_update() {
    log_info "Testing customer.subscription.updated event..."

    # Trigger subscription update event
    stripe trigger customer.subscription.updated --api-key="$STRIPE_SECRET_KEY"

    log_success "Subscription update event triggered"
}

# Test invoice.payment_failed event
test_payment_failure() {
    log_info "Testing invoice.payment_failed event..."

    # Trigger payment failure event
    stripe trigger invoice.payment_failed --api-key="$STRIPE_SECRET_KEY"

    log_success "Payment failure event triggered"
}

# Test trial expiry race condition
test_trial_race_condition() {
    log_info "Testing trial expiry race condition..."

    # This requires manual testing:
    # 1. Create subscription with trial
    # 2. Wait for trial to expire
    # 3. Trigger payment success event
    # 4. Verify status updates correctly

    log_warning "Trial race condition test requires manual setup:"
    echo "  1. Create test subscription with trial period"
    echo "  2. Wait for trial to expire (or modify trial_end_date)"
    echo "  3. Trigger invoice.payment_succeeded event"
    echo "  4. Check that status updates from 'expired' to 'active'"
}

# Monitor webhook events in database
monitor_webhook_events() {
    log_info "Monitoring webhook events in database..."

    # This would require database access
    # For now, just show the query to run manually
    echo "Run this query in Supabase SQL Editor:"
    echo ""
    echo "SELECT"
    echo "  event_type,"
    echo "  COUNT(*) as count,"
    echo "  MAX(processed_at) as last_processed"
    echo "FROM stripe_webhook_events"
    echo "GROUP BY event_type"
    echo "ORDER BY last_processed DESC;"
}

# Start webhook listener
start_webhook_listener() {
    log_info "Starting webhook listener..."
    log_info "Forwarding webhooks to: $WEBHOOK_URL"
    log_warning "Press Ctrl+C to stop listening"

    stripe listen \
        --api-key="$STRIPE_SECRET_KEY" \
        --forward-to="$WEBHOOK_URL" \
        --skip-verify
}

# Main test runner
run_tests() {
    local scenario="$1"

    case "$scenario" in
        "checkout")
            test_checkout_completion
            ;;
        "payment")
            test_payment_success
            ;;
        "subscription")
            test_subscription_update
            ;;
        "failure")
            test_payment_failure
            ;;
        "race")
            test_trial_race_condition
            ;;
        "monitor")
            monitor_webhook_events
            ;;
        "listen")
            start_webhook_listener
            ;;
        "all")
            log_info "Running all webhook tests..."
            test_checkout_completion
            sleep 2
            test_payment_success
            sleep 2
            test_subscription_update
            sleep 2
            test_payment_failure
            log_success "All webhook tests completed"
            ;;
        *)
            echo "Usage: $0 [test-scenario]"
            echo ""
            echo "Test Scenarios:"
            echo "  checkout     - Test checkout.session.completed event"
            echo "  payment      - Test invoice.payment_succeeded event"
            echo "  subscription - Test customer.subscription.updated event"
            echo "  failure      - Test invoice.payment_failed event"
            echo "  race         - Test trial expiry race condition (manual)"
            echo "  monitor      - Show webhook monitoring query"
            echo "  listen       - Start webhook listener"
            echo "  all          - Run all automated tests"
            exit 1
            ;;
    esac
}

# Main script
main() {
    echo "Stripe Webhook Testing Script"
    echo "============================="
    echo ""

    check_prerequisites
    echo ""

    local scenario="${1:-all}"
    run_tests "$scenario"
}

# Run main function with all arguments
main "$@"