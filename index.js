var express = require('express');
var app = express();
var cors = require('cors');
var Imap = require('imap');

app.use(express.json());
app.use(cors());

const port = 3000;

app.post('/mail/count', (req, res) => {
    var imap = new Imap(req.body);
    imap.once('error', (err) => {
        res.status(400).json(err);
    });
    imap.once('end', () => res.end());
    imap.once('ready', () => {
        imap.status('inbox', (err, box) => {
            imap.destroy();
            if (err) {
                res.status(500).json(err);
            } else {
                res.json(box.messages);
            }
        });
    });
    imap.connect();
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}.`);
})