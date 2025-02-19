const express = require('express');
const axios = require('axios');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors()); // Allow CORS for API access

const PORT = process.env.PORT || 3000;

// Function to get tS and tH using Puppeteer
async function getTSandTH(id) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for Render
        headless: true
    });

    const page = await browser.newPage();
    await page.goto(`https://mp3api.ytjar.info/?id=${id}`, { waitUntil: 'networkidle2' });

    const tsAndTh = await page.evaluate(() => ({
        tS: window.tS,
        tH: window.tH
    }));

    await browser.close();
    return tsAndTh;
}

// API route to fetch download links
app.get('/download', async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) return res.status(400).json({ error: "Missing 'id' parameter" });

        const { tS, tH } = await getTSandTH(id); // Fetch tS & tH
        if (!tS || !tH) return res.status(500).json({ error: "Failed to get tS or tH" });

        const url = `https://mp3api-d.ytjar.info/dl?id=${id}&s=${tS}&h=${tH}&t=0`;

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                'Referer': 'https://mp3api.ytjar.info/',
                'Origin': 'https://mp3api.ytjar.info'
            }
        });

        if (response.status === 200) {
            res.json({
                status: true,
                Created_by: "Janith Rashmika",
                data: response.data
            });
        } else {
            res.status(500).json({ error: "Failed to fetch download links" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
