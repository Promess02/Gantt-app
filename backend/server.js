const express = require('express');
const cors = require('cors');
const app = express();
const apiHandler = require('./APIHandler');

app.use(cors());
app.use(express.json());

app.use(apiHandler);

app.listen(4000, () => {
    console.log('Server is running on port 4000');
});