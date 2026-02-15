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
