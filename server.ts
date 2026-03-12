import express from 'express';
import { verifySVG } from './index.js';

const app = express();
app.use(express.text({ type: 'image/svg+xml', limit: '5mb' }));

/**
 * @api {post} /verify Verify a Nifty SVG
 * @apiDescription Verifies the cryptographic integrity and provenance chain of an SVG.
 */
app.post('/verify', async (req, res) => {
    try {
        const svg = req.body;
        if (!svg) {
            return res.status(400).json({ error: 'Missing SVG body' });
        }

        const result = await verifySVG(svg);
        res.json(result);
    } catch (e) {
        res.status(400).json({ 
            isValid: false, 
            error: (e as Error).message 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 NASP Verification Server running on port ${PORT}`);
});
