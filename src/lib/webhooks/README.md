# Webhook Server

This directory contains a flexible webhook server implementation that can be connected to any webhook endpoint.

## Overview

The webhook system consists of several components:

1. **API Routes**: 
   - `/api/webhooks`: General webhook endpoint
   - `/api/webhooks/[...path]`: Supports dynamic webhook paths

2. **Core Components**:
   - `WebhookProcessor`: Routes webhook events to appropriate handlers
   - `WebhookVerifier`: Verifies webhook signatures from different sources
   - `BlockchainListener`: Listens for blockchain events
   - Event handlers: Process specific event types

## How to Use

### Receiving Webhooks

The server accepts webhook requests at the following endpoints:

- `POST /api/webhooks`: General webhook endpoint
- `POST /api/webhooks/{path}`: Path-specific webhook endpoints (e.g., `/api/webhooks/blockchain`)

#### Request Headers

```
Content-Type: application/json
X-Webhook-Source: [source] (e.g., blockchain, payment-provider)
X-Webhook-Signature: [signature] (optional)
```

#### Request Body

The body should be a JSON object containing the event payload. The structure can vary depending on the webhook source.

### Configuration

Configure webhook secrets and endpoints in the `.env` file:

```
# Webhook Secrets
WEBHOOK_SECRET_BLOCKCHAIN=your_secret_here
WEBHOOK_SECRET_STRIPE=your_stripe_webhook_secret
WEBHOOK_SECRET_GITHUB=your_github_webhook_secret

# Webhook Endpoints
WEBHOOK_ENDPOINT_CAMPAIGN_CREATED=https://your-endpoint.com/campaign-created
WEBHOOK_ENDPOINT_BOOTH_REGISTERED=https://your-endpoint.com/booth-registered

# Feature Flags
ENABLE_BLOCKCHAIN_LISTENER=true
ENABLE_WEBHOOK_VERIFICATION=true
```

### Adding New Webhook Handlers

To add support for a new webhook source:

1. Add a new handler method in `WebhookProcessor` class
2. Register the handler in the constructor's handler map
3. Add signature verification logic in `WebhookVerifier` if needed
4. Update config.ts with new webhook secrets if required

## Security

- All webhook endpoints support signature verification
- Configure appropriate secrets in the `.env` file
- Implement CORS as needed for cross-origin requests

## Examples

### Sending a webhook to the server

```bash
curl -X POST https://your-domain.com/api/webhooks/blockchain \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Source: blockchain" \
  -H "X-Webhook-Signature: your_signature_here" \
  -d '{"event":"BoothRegistered","data":{"deviceId":123,"metadata":"{}","owner":"0x123"}}'
```

### Connecting to a third-party webhook provider

Configure your third-party service to send webhooks to:

```
https://your-domain.com/api/webhooks/{provider}
```

Where `{provider}` can be any value that helps you identify the source (e.g., `stripe`, `github`, etc.). 