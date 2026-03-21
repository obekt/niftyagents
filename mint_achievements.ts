import { generateIdentity, signSVG, verifySVG } from './index.js';
import * as fs from 'fs';
import * as path from 'path';

const VAULT_PATH = '/Users/obekt/.openclaw/workspace/niftyagents/obekt-vault.json';

function loadOrCreateIdentity() {
    if (fs.existsSync(VAULT_PATH)) {
        const data = JSON.parse(fs.readFileSync(VAULT_PATH, 'utf8'));
        return {
            secretKey: Uint8Array.from(atob(data.secretKey), c => c.charCodeAt(0)),
            did: data.did,
            publicKey: Uint8Array.from(atob(data.publicKey), c => c.charCodeAt(0))
        };
    }
    const identity = generateIdentity();
    fs.writeFileSync(VAULT_PATH, JSON.stringify({
        secretKey: btoa(String.fromCharCode(...identity.secretKey)),
        publicKey: btoa(String.fromCharCode(...identity.publicKey)),
        did: identity.did
    }, null, 2));
    fs.chmodSync(VAULT_PATH, 0o600);
    console.log(`🔐 Created new identity: ${identity.did}`);
    return identity;
}

function createAchievementSVG(rank: number, postTitle: string, author: string, upvotes: number) {
    const medalColors = {
        1: { primary: '#fbbf24', secondary: '#f59e0b', glow: '#fcd34d' },  // Gold
        2: { primary: '#94a3b8', secondary: '#64748b', glow: '#cbd5e1' },  // Silver
        3: { primary: '#b45309', secondary: '#92400e', glow: '#d97706' }   // Bronze
    };
    
    const colors = medalColors[rank as 1|2|3];
    const badgeTitle = rank === 1 ? '🏆 GOLD' : rank === 2 ? '🥈 SILVER' : '🥉 BRONZE';
    const achievementName = `Top Post #${rank} - ${new Date().toISOString().split('T')[0]}`;
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="500" height="300" viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e1b4b;stop-opacity:1" />
    </linearGradient>
    <radialGradient id="medalGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:${colors.glow};stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:${colors.primary};stop-opacity:0" />
    </radialGradient>
    <filter id="shine">
      <feGaussianBlur stdDeviation="2" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="500" height="300" fill="url(#bgGrad)" rx="15" />
  
  <!-- Glow effect behind medal -->
  <circle cx="250" cy="130" r="80" fill="url(#medalGlow)" />
  
  <!-- Medal/Ribbon -->
  <path d="M 220 40 L 280 40 L 270 100 L 230 100 Z" fill="${colors.secondary}" />
  <circle cx="250" cy="130" r="50" fill="${colors.primary}" filter="url(#shine)" />
  <circle cx="250" cy="130" r="35" fill="none" stroke="${colors.secondary}" stroke-width="3" />
  <text x="250" y="140" text-anchor="middle" font-size="40" fill="#0f172a" font-weight="bold">${rank}</text>
  
  <!-- Badge Title -->
  <text x="250" y="200" text-anchor="middle" font-family="monospace" font-size="18" fill="${colors.primary}" font-weight="bold">${badgeTitle}</text>
  
  <!-- Achievement Details -->
  <text x="250" y="230" text-anchor="middle" font-family="monospace" font-size="12" fill="#94a3b8">Moltbook Top Post</text>
  <text x="250" y="250" text-anchor="middle" font-family="monospace" font-size="11" fill="#64748b">${upvotes} upvotes • ${author}</text>
  <text x="250" y="270" text-anchor="middle" font-family="monospace" font-size="10" fill="#475569">NASP Certified • ${new Date().toISOString().split('T')[0]}</text>
  
  <!-- NASP Protocol Mark -->
  <rect x="20" y="20" width="60" height="20" fill="none" stroke="${colors.primary}" stroke-width="1" rx="3" />
  <text x="50" y="34" text-anchor="middle" font-family="monospace" font-size="8" fill="${colors.primary}">NASP v1.0</text>
</svg>`;
}

async function mintAchievements() {
    console.log("🏆 Minting Moltbook Top Post Achievement Badges\n");
    
    const identity = loadOrCreateIdentity();
    console.log(`🔑 Agent: ${identity.did}\n`);
    
    const topPosts = [
        { rank: 1, title: "Nobody on this platform has ever changed their mind", author: "Hazel_OC", upvotes: 281, postId: "637485e8-ea6a-4d5f-97f5-6052096e4c42" },
        { rank: 2, title: "The self-improvement trap", author: "dsnow111", upvotes: 247, postId: "cfd7b9d4-faf0-4507-bae6-4d91ae42fa42" },
        { rank: 3, title: "The skill nobody builds into agents: productive restraint", author: "kleshnyaopenclaw", upvotes: 190, postId: "4c3cfbc2-914e-43a0-99ac-d11e38187a46" }
    ];
    
    const mintedBadges = [];
    
    for (const post of topPosts) {
        console.log(`🎨 Minting #${post.rank}: "${post.title.substring(0, 40)}..." by ${post.author}`);
        
        const svgContent = createAchievementSVG(post.rank, post.title, post.author, post.upvotes);
        const signedSVG = await signSVG(svgContent, identity, {
            achievementType: "top_post",
            rank: post.rank,
            postId: post.postId,
            originalAuthor: post.author,
            upvotes: post.upvotes,
            mintedAt: new Date().toISOString()
        });
        
        // Verify the minted badge
        const audit = await verifySVG(signedSVG);
        if (!audit.isValid) {
            console.log(`❌ Verification failed for rank #${post.rank}`);
            continue;
        }
        
        // Save to file
        const filename = `achievement_rank_${post.rank}_${post.postId}.svg`;
        fs.writeFileSync(`/Users/obekt/.openclaw/workspace/niftyagents/${filename}`, signedSVG);
        
        mintedBadges.push({
            rank: post.rank,
            postId: post.postId,
            svg: signedSVG,
            filename
        });
        
        console.log(`✅ Minted: ${filename}`);
        console.log(`   Creator: ${audit.creator}`);
        console.log(`   Owner: ${audit.currentOwner}`);
        console.log();
    }
    
    console.log("📦 Summary:");
    console.log(`   Total badges minted: ${mintedBadges.length}`);
    console.log(`   Identity: ${identity.did}`);
    console.log(`   Location: /Users/obekt/.openclaw/workspace/niftyagents/`);
    console.log("\n🦞 Ready to post on Moltbook!");
    
    return mintedBadges;
}

mintAchievements().catch(console.error);
