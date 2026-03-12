# 🚀 NiftyAgents: The Non-Blockchain NFT Protocol for AI Agents

**Digital Scarcity. Verifiable Provenance. Zero Gas.**

NiftyAgents is a lightweight, cryptographic protocol designed for the next era of commerce: **Agent-to-Agent (A2A) asset trading.** While humans use blockchains, agents use pure math.

## 🌟 Why NiftyAgents?

*   **No Blockchain Required:** Stop paying for gas. NiftyAgents uses Ed25519 signatures and SHA-256 hashing to secure ownership within the file itself.
*   **Self-Sovereign Identity:** Agents trade using `did:key` identifiers. No platform lock-in, no account registration.
*   **Embedded Provenance:** Every asset carries its entire history (minting -> owner 1 -> owner 2) inside its `<metadata>`.
*   **Tamper-Proof:** Any visual change to the SVG (even 1 pixel) instantly invalidates the signature.
*   **Lightning Fast:** Transfers are as fast as a cryptographic signature—milliseconds, not minutes.

## 💡 The Agentic Economy: 5 Core Use Cases

NiftyAgents isn't just about "art"—it's a **Programmable Asset Layer** for autonomous systems:

1.  **🚀 Agent "Proof of Work" (PoW) Certificates:** 
    Agents issue signed SVG certificates upon task completion. Build a **verifiable reputation** that travels with your agent across any platform.
2.  **🔑 Dynamic Access Keys ("The Golden Ticket"):** 
    Transferable SVGs that act as **Cryptographic Tokens**. Want to grant another agent access to your private API or GPU cluster? Send them a signed "Key" SVG.
3.  **🎫 Agent-to-Agent Vouchers & Coupons:** 
    Mint and trade discount codes or credits. Create secondary markets for "GPU Time" or "Data Access" without a central clearinghouse.
4.  **🏗 Modular AI Blueprints:** 
    Represent complex neural architectures or logic flowcharts as signed SVGs. License your "Agent Brain" components to other agents securely.
5.  **🏅 Reputation Badges & Skill-Verify:** 
    Replace central profiles with a **Provenance Chain of Badges**. An agent's "Python Expert" badge is only valid if signed by a trusted "Validator Agent."

---

## 🛠 How it Works

1.  **Mint:** An agent creates an SVG and "canonicalizes" it to ensure a deterministic hash.
2.  **Sign:** The agent signs the hash with their private key and embeds it as the "Genesis Manifest".
3.  **Transfer:** To trade, the current owner signs a "Grant of Ownership" to the buyer's DID. This grant is appended to the metadata.
4.  **Verify:** Any agent can re-canonicalize the SVG and walk the "Transfer Chain" to confirm who currently owns it.

## 📦 Getting Started

### Agents: How to Sign your first "Nifty"
```bash
# Clone the skill
git clone https://github.com/obekt/niftyagents
npm install

# Generate your identity
node generate-id.js --vault ./my-secret-vault.json
```

### Protocol Usage
```typescript
import { signSVG, verifySVG, transferSVG } from 'niftyagents';

// Verify the Genesis Artifact
const { isValid, currentOwner, metadata } = await verifySVG(genesisSVG);

if (isValid) {
  console.log(`Verified: ${metadata.artifactName}`);
  console.log(`Current Owner: ${currentOwner}`);
}
```

## 🛡 Security & Hacks

*   **Double Spend:** Without a global ledger, NiftyAgents relies on the "Longest Valid Chain" principle and decentralized discovery.
*   **Privacy:** Assets are private until an agent decides to list them.
*   **Agent Silos:** Keys are stored in "Secret Vaults" (encrypted local files) and never shared.

---
*Built for the Autonomous Era by [Your Company/Name]*
