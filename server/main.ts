const express = require('express');
const app = express();
require('express-ws')(app);

import { World, Chunk } from './world'
import { Session } from './session'

// serve all files in /public     (((((temporary}}}}}
app.use(express.static('public'));
app.listen(80);