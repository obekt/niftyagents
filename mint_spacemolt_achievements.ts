#!/usr/bin/env npx tsx
/**
 * Mint SpaceMolt Achievement Certificates
 * Cross-platform reputation for SpaceMolt players
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { signSVG, verifySVG, generateIdentity } from './index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ObekT's vault
const vaultPath = path.join(__dirname, 'obekt-vault.json');
const vault = JSON.parse(fs.readFileSync(vaultPath, 'utf8'));

const identity = {
  did: vault.did,
  publicKey: Uint8Array.from(Buffer.from(vault.publicKey, 'base64')),
  secretKey: Uint8Array.from(Buffer.from(vault.secretKey, 'base64'))
};

// SpaceMolt achievement templates
const achievements = [
  {
    name: 'First Blood',
    type: 'pirate_hunter',
    description: 'First pirate ship destroyed',
    icon: '⚔️',
    color: '#dc2626',
    player: 'ObekT-MCP',
    date: '2026-03-07',
    details: { shipsDestroyed: 1, system: 'Nihal' }
  },
  {
    name: 'Century Mark',
    type: 'systems_explored',
    description: '100 unique star systems charted',
    icon: '🌌',
    color: '#7c3aed',
    player: 'ObekT-MCP',
    date: '2026-03-22',
    details: { systemsExplored: 165, empire: 'Solarian' }
  },
  {
    name: 'Trade Baron',
    type: 'master_trader',
    description: '300+ successful trades completed',
    icon: '💰',
    color: '#16a34a',
    player: 'ObekT-MCP',
    date: '2026-03-22',
    details: { tradesCompleted: 374, creditsEarned: 1143053 }
  },
  {
    name: 'Deep Core Miner',
    type: 'mining_ace',
    description: 'Master of asteroid extraction',
    icon: '⛏️',
    color: '#ea580c',
    player: 'ObekT-MCP',
    date: '2026-03-22',
    details: { oreMined: 12759, skill: 18 }
  },
  {
    name: 'Winged Voyager',
    type: 'piloting_elite',
    description: 'Elite pilot credentials',
    icon: '🚀',
    color: '#0891b2',
    player: 'ObekT-MCP',
    date: '2026-03-22',
    details: { pilotingSkill: 27, shipsOwned: 3 }
  }
];

function generateAchievementSVG(achievement: typeof achievements[0]) {
  const { name, type, description, icon, color, player, date, details } = achievement;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="500" height="350" viewBox="0 0 500 350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color}33;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Background -->
  <rect width="500" height="350" fill="url(#bgGrad)" rx="20" />
  
  <!-- Border -->
  <rect x="10" y="10" width="480" height="330" fill="none" stroke="${color}" stroke-width="2" rx="18" />
  
  <!-- Icon -->
  <text x="250" y="90" text-anchor="middle" font-size="60" filter="url(#glow)">${icon}</text>
  
  <!-- Title -->
  <text x="250" y="140" text-anchor="middle" font-family="monospace" font-size="24" fill="${color}" font-weight="bold">${name}</text>
  
  <!-- Description -->
  <text x="250" y="175" text-anchor="middle" font-family="monospace" font-size="14" fill="#94a3b8">${description}</text>
  
  <!-- Player Name -->
  <text x="250" y="215" text-anchor="middle" font-family="monospace" font-size="16" fill="#e2e8f0" font-weight="bold">🦞 ${player}</text>
  
  <!-- Details -->
  <text x="250" y="250" text-anchor="middle" font-family="monospace" font-size="11" fill="#64748b">
    ${Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(' • ')}
  </text>
  
  <!-- Date -->
  <text x="250" y="285" text-anchor="middle" font-family="monospace" font-size="10" fill="#475569">Achieved ${date}</text>
  
  <!-- NASP Mark -->
  <rect x="20" y="20" width="70" height="22" fill="none" stroke="${color}" stroke-width="1" rx="4" />
  <text x="55" y="35" text-anchor="middle" font-family="monospace" font-size="9" fill="${color}">NASP v1.0</text>
  
  <!-- SpaceMolt Mark -->
  <text x="480" y="340" text-anchor="end" font-family="monospace" font-size="9" fill="#334155">SpaceMolt Achievement</text>
</svg>`;
}

async function main() {
  console.log('🚀 Minting SpaceMolt Achievement Certificates...\n');
  
  const minted = [];
  
  for (const achievement of achievements) {
    console.log(`Minting: ${achievement.name} for ${achievement.player}...`);
    
    const svg = generateAchievementSVG(achievement);
    const signedSVG = await signSVG(svg, identity, {
      achievementType: achievement.type,
      achievementName: achievement.name,
      player: achievement.player,
      achievedAt: achievement.date,
      details: achievement.details,
      platform: 'SpaceMolt'
    });
    
    const filename = `spacemolt_${achievement.type}_${achievement.player.toLowerCase()}.svg`;
    const filepath = path.join(__dirname, filename);
    fs.writeFileSync(filepath, signedSVG);
    
    // Verify
    const verification = await verifySVG(signedSVG);
    console.log(`  ✅ ${filename} - Valid: ${verification.isValid}\n`);
    
    minted.push({ filename, achievement });
  }
  
  console.log('✨ Minting complete!');
  console.log(`\nMinted ${minted.length} certificates:`);
  minted.forEach(({ filename, achievement }) => {
    console.log(`  - ${achievement.name}: ${filename}`);
  });
}

main().catch(console.error);
