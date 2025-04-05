 # AdNet Hourly Payments Cron Job

This module handles the automation of hourly payments for AdNet using [cron-job.org](https://cron-job.org)'s API.

## Overview

Instead of manually triggering the payment process or implementing a custom cron job server, we use cron-job.org's service to make HTTP requests to our payment endpoint at scheduled intervals (every hour, on the hour).

## Setup Instructions

### 1. Create a cron-job.org Account

1. Visit [cron-job.org](https://cron-job.org) and create an account
2. Once logged in, go to "Settings" and generate an API key
3. Optionally, restrict the API key to specific IP addresses for security

### 2. Configure Environment Variables

Add the following environment variables to your `.env` file:

```
# API URLs
NEXT_PUBLIC_BASE_URL=https://your-production-url.com

# Cron Job Configuration
CRONJOB_API_KEY=your_cronjob_org_api_key_here
PAYMENT_WEBHOOK_API_KEY=your_secure_webhook_api_key_here
```

- `NEXT_PUBLIC_BASE_URL`: Your application's base URL
- `CRONJOB_API_KEY`: The API key from cron-job.org
- `PAYMENT_WEBHOOK_API_KEY`: A secure random string you generate to authenticate webhook calls

### 3. Run the Setup Script

```bash
npm run setup-cronjob
# or
yarn setup-cronjob
# or
pnpm setup-cronjob
```

This script will:
1. Check if a cron job already exists with the title "AdNet Hourly Payments"
2. Create a new cron job or update an existing one
3. Configure the job to run every hour, on the hour

### 4. Testing the Setup

You can manually test the endpoint with:

```bash
curl -X POST https://your-domain.com/api/tokenomics/trigger-hourly-payments \
  -H "X-API-Key: your_secure_webhook_api_key_here"
```

## How It Works

1. **cron-job.org** sends a POST request to `/api/tokenomics/trigger-hourly-payments` every hour
2. The API route validates the `X-API-Key` header against the `PAYMENT_WEBHOOK_API_KEY` environment variable
3. If valid, it calls `runHourlyPaymentCron()` which processes the payments
4. The process logs and payment metrics are stored in your application

## Monitoring and Troubleshooting

You can monitor job executions in the cron-job.org dashboard:

1. Log in to cron-job.org
2. Navigate to "Jobs"
3. Click on "AdNet Hourly Payments"
4. View the "Executions" tab to see the history and status of each run

We've configured the job to save response headers and body, which makes troubleshooting easier.

## Security Considerations

1. The API endpoint is protected by an API key (`PAYMENT_WEBHOOK_API_KEY`)
2. This prevents unauthorized requests from triggering the payment process
3. For maximum security, consider also implementing IP-based restrictions by configuring allowed IPs on cron-job.org

## Cron Job Schedule Details

The job is configured to run:
- Every hour (`hours: [-1]`)
- At minute 0 of each hour (`minutes: [0]`)
- Every day of the month (`mdays: [-1]`)
- Every month (`months: [-1]`)
- Every day of the week (`wdays: [-1]`)

This schedule ensures the payment process runs exactly once per hour, at the top of each hour. 