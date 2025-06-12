const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/prove-reliability', (req, res) => {
    const { total_invoices, paid_invoices, threshold_percent } = req.body;

    // Prepare TOML for Noir
  const toml = `total_invoices = ${total_invoices}
paid_invoices = ${paid_invoices}
threshold_percent = ${threshold_percent}
`;


    // Write TOML to invoice_reliability/Prover.toml
    const proverPath = path.join(__dirname, 'invoice_reliability', 'Prover.toml');
    fs.writeFileSync(proverPath, toml);

    // Run nargo execute
    try {
        const result = execSync('nargo execute', {
            cwd: path.join(__dirname, 'invoice_reliability')
        }).toString();

        const match = result.match(/Field\((\d)\)/);
        const isReliable = match ? match[1] === '1' : false;
        res.json({ isReliable, nargoOutput: result });
    } catch (e) {
        res.status(500).json({ error: e.message, nargoOutput: e.stdout?.toString() });
    }
});

app.listen(3001, () => {
    console.log('Backend running on http://localhost:3001');
});
