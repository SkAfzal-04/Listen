const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Path to the "music" directory in the root folder
const musicDir = path.join(__dirname, '../music'); // Assuming 'music' is in the root directory
if (!fs.existsSync(musicDir)) {
  fs.mkdirSync(musicDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, '../music'))); // Serve static files from the correct folder

// Multer setup for file uploads
const upload = multer({
  dest: musicDir, // Correct destination for file uploads
  limits: { fileSize: 50 * 1024 * 1024 }, // Max file size 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/x-m4a']; // Added support for .m4a
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only .mp3 and .m4a files are allowed!'), false);
    }
  },
}).single('file');

// Endpoint to fetch the list of songs
app.get('/songs', (req, res) => {
  fs.readdir(musicDir, (err, files) => {
    if (err) {
      console.error('Error reading music directory:', err);
      return res.status(500).send('Unable to fetch songs.');
    }
    const musicFiles = files.filter(file => {
      const extname = path.extname(file).toLowerCase();
      return extname === '.mp3' || extname === '.m4a'; // Filter .mp3 and .m4a files
    });
    res.json(musicFiles);
  });
});

// Endpoint to handle file uploads
app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(500).send(`Multer Error: ${err.message}`);
    } else if (err) {
      return res.status(500).send(`Unknown Error: ${err.message}`);
    }

    const file = req.file;
    if (!file) {
      return res.status(400).send('No file uploaded.');
    }

    const newFileName = `${file.originalname}`;
    const filePath = path.join(musicDir, newFileName);

    if (fs.existsSync(filePath)) {
      return res.status(400).send('File with the same name already exists.');
    }

    fs.rename(file.path, filePath, (err) => {
      if (err) {
        return res.status(500).send('Error saving file.');
      }
      res.status(200).send('File uploaded successfully!');
    });
  });
});

// Serve music files (ensure the path is correct)
app.get('/music/:filename', (req, res) => {
  const filePath = path.join(musicDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found.');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
