<img width="1119" alt="Screenshot 2025-04-06 at 6 13 57 AM" src="https://github.com/user-attachments/assets/a88913e5-73fd-420d-9af1-f521e40329ba" /># 🌐 AdModule Web
### *Robust Token Management. Real-Time Events. Anonymous Analytics.*

Welcome to **AdModule Web** — a detailed breakdown of your implementation-focused web platform for comprehensive ad management, seamless token operations, and privacy-preserving user analytics.

---

## 🔄 Implementation Details

## Architecture
<img width="1095" alt="Screenshot 2025-04-06 at 6 14 08 AM" src="https://github.com/user-attachments/assets/be8d9ce3-1829-4a13-a13c-b37699233684" />
<img width="885" alt="Screenshot 2025-04-06 at 6 14 21 AM" src="https://github.com/user-attachments/assets/5a4352c5-8f63-4fe2-bbf9-97d4ac5d2160" />

## UI Screenshots
![WhatsApp Image 2025-04-06 at 06 03 24](https://github.com/user-attachments/assets/39b0f08a-33ae-48e5-8e15-e59aa6c6fe65)
![WhatsApp Image 2025-04-06 at 06 01 55 (1)](https://github.com/user-attachments/assets/34c00a05-3cb6-4e11-bc64-afcf9f290281)


### 🚩 **1. Ad Service Provider (ASP)**

#### 🔑 **Registration & Verification**
- ASP signs in via **Privy Wallet**, establishing a secure session.
- Backend dynamically creates custodial wallet using **Metal API**.
- **Self Protocol** performs secure, anonymous verification using ZKProof (age, country, OFAC compliance).

#### 📍 **Adding Ad Locations**
- ASP submits new location data (address, display type, IoT details).
- Backend assigns unique identifiers, registers IoT modules, generates cryptographic keys, and securely stores credentials.

#### 📡 **IoT Module Setup & Activation**
- ASP deploys hardware (**ESP32-CAM** and **ESP32+PN532** modules).
- Devices establish secure MQTT connections, initiating transmission of verified Proof-of-View (PoV) and Proof-of-Tap (PoT) metrics.

#### 💰 **Real-time Earnings Dashboard**
- IoT data verified and recorded on-chain via oracle interactions.
- **Nodit Webhooks** immediately trigger backend processes upon new data events.
- Earnings automatically calculated and credited via **Metal API** into custodial wallets.

#### 💸 **Withdrawal Process**
- ASP initiates withdrawals securely via dashboard.
- **Metal API** processes ADC token transfers to ASP’s external wallets instantly.

---

### 🎯 **2. Advertising Company (AC)**

#### 🔑 **Registration & Secure Verification**
- AC securely logs in via **Privy Wallet**, session validated.
- Backend dynamically creates wallet via **Metal API**.
- Identity verification securely performed via **Self Protocol**.

#### 💳 **Funding Wallet (USDC → ADC Conversion)**
- AC deposits USDC.
- Backend utilizes **Metal API** for instant conversion to ADC tokens.

#### 📝 **Ad Campaign Creation**
- AC defines campaign parameters (duration, budget, URLs, selected ASP locations).
- Backend secures ADC tokens in escrow via smart contract integration.
- Scheduled dynamic URL updates are securely pushed to IoT modules via MQTT.

#### 📊 **Real-Time Campaign Monitoring**
- Oracle-verified IoT data continuously recorded on-chain.
- Backend immediately updates dashboards via **Nodit Webhooks** upon receiving event notifications.

#### 📦 **Campaign Settlement & Token Distribution**
- Backend aggregates final analytics using on-chain data via Nodit.
- **Metal API** automates token distribution to ASP wallets based on verified performance metrics.

---

### 🙋 **3. End-User Interaction & Analytics**

#### 📱 **NFC Ad Interaction**
- User taps NFC module, instantly redirected to campaign-specific engagement URL.

#### ✅ **Anonymous Verification via Self Protocol**
- User undergoes rapid, anonymous verification through Self Protocol’s ZKProof technology.
- Privacy-preserving demographic data securely collected and aggregated.

#### 🎁 **Reward Claim & Distribution**
- User securely claims rewards.
- Backend verifies reward eligibility and uses **Metal API** to directly credit user wallets from escrow funds.

#### 📈 **Ongoing Anonymous Engagement Analytics**
- Backend continuously anonymizes and securely records engagement metrics.
- Future reward strategies dynamically personalized, while strictly preserving user privacy.

---

## ⚙️ Technical Stack & Integrations

- **Frontend:** Next.js, TailwindCSS, TypeScript
- **Backend & APIs:** Node.js backend, **Metal API**, **Privy Wallet** session management
- **Verification:** **Self Protocol** leveraging ZKProof for secure, anonymous demographic verification
- **Event Triggers & Data Processing:** **Nodit Webhooks**, Oracle integration for real-time on-chain data capture
- **IoT Integration:** ESP32-CAM, ESP32 WROOM with PN532 NFC, MQTT for reliable IoT event transmission

---

## 🚀 Next Steps & Enhancements

- Advanced integration of Self Protocol for granular analytics.
- Fully automated payout processes based on live campaign analytics.
- Expansion of IoT capabilities for clustered deployments in high-traffic locations.

---

## 📅 Why Choose AdModule Web?

- **Robust Integration:** Efficient token operations and secure event-driven infrastructure.
- **Immediate Insights:** Real-time IoT events instantly reflected across dashboards.
- **User Privacy First:** Secure demographic analytics without compromising anonymity.
- **Transparent Operations:** Fully auditable blockchain-backed token management.

> **AdModule Web** — Precision-built, integration-rich, privacy-preserving.
