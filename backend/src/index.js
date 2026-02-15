// backend/src/index.js
import { app } from '@azure/functions';
import dotenv from 'dotenv';
dotenv.config();

import './functions/saveVocab.js';
import './functions/getVocabs.js';
import './functions/deleteVocab.js';
import './functions/updateVocab.js';

app.setup({
    enableHttpStream: true,
});


import express from 'express';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appServer = express();

appServer.use(express.static(path.join(__dirname, '../../frontend')));

const port = process.env.WEBSITES_PORT || 8080;
appServer.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});