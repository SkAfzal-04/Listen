const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Ensure the "music" folder exists
const musicDir = path.join(__dirname, 'music');
if (!fs.existsSync(musicDir)) {
  fs.mkdirSync(musicDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/music', express.static(musicDir)); // Serve static files from the "music" directory

// Multer setup for file uploads
const upload = multer({
  dest: musicDir,
  limits: { fileSize: 50 * 1024 * 1024 }, // Max file size: 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/x-m4a']; // Allowed file types
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
      return res.status(500).json({ error: 'Unable to fetch songs.' });
    }

    const musicFiles = files.filter(file => {
      const extname = path.extname(file).toLowerCase();
      return extname === '.mp3' || extname === '.m4a';
    });

    res.json({ songs: musicFiles });
  });
});

// Endpoint to handle file uploads
app.post('/upload', (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Multer Error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: `Upload Error: ${err.message}` });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const newFileName = file.originalname;
    const filePath = path.join(musicDir, newFileName);

    if (fs.existsSync(filePath)) {
      // Remove the temporary file if there's a conflict
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'A file with the same name already exists.' });
    }

    // Rename the file to match the original name
    fs.rename(file.path, filePath, (err) => {
      if (err) {
        console.error('Error saving uploaded file:', err);
        return res.status(500).json({ error: 'Error saving the file.' });
      }
      res.json({ message: 'File uploaded successfully!', filename: newFileName });
    });
  });
});

// Endpoint to serve individual music files
app.get('/music/:filename', (req, res) => {
  const filePath = path.join(musicDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found.' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running locally at http://localhost:${port}`);
});
