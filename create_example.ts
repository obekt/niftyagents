import { generateIdentity, signSVG, verifySVG } from './index.js';
import * as fs from 'fs';

async function createExample() {
    // 1. Setup Agent Alpha
    const alpha = generateIdentity();
    console.log(`Agent Alpha ID: ${alpha.did}`);

    // 2. Create a simple 'Blue Square' SVG
    const rawSVG = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="blue" />
</svg>`;

    // 3. Sign it (this canonicalizes, hashes, and embeds the metadata)
    const signedSVG = await signSVG(rawSVG, alpha);
    
    // Save it to a file
    fs.writeFileSync('nifty_example.svg', signedSVG);
    
    console.log("\n--- GENERATED NIFTY SVG (nifty_example.svg) ---");
    console.log(signedSVG);

    // 4. Verify it immediately
    const audit = await verifySVG(signedSVG);
    console.log("\n--- VERIFICATION RESULT ---");
    console.log(JSON.stringify(audit, null, 2));
}

createExample().catch(console.error);
