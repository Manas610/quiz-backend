require("dotenv").config()
import express, { Request, Response } from 'express';
import http from 'http'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import cors from 'cors'
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

const app = express()


app.use(cors({
    credentials: true,
}))

app.use(compression())
app.use(cookieParser())
app.use(bodyParser.json())

const server = http.createServer(app)

// app.get('/data', (req, res) => {
//     const filePath = path.join(__dirname, './data/index.json');
    
//     fs.readFile(filePath, 'utf8', (err, data) => {
//       if (err) {
//         console.error('Error reading the file:', err);
//         return res.status(500).json({ error: 'Failed to load data' });
//       }
      
//       try {
//         const jsonData = JSON.parse(data);
//         return res.json(jsonData);
//       } catch (parseErr) {
//         console.error('Error parsing JSON:', parseErr);
//         res.status(500).json({ error: 'Failed to parse data' });
//       }
//     });
//   });

app.get('/data', async (req: Request, res: Response): Promise<void> => {
  const indexPath = path.join(__dirname, './data/index.json');
  const metaPath = path.join(__dirname, './data/meta.json');

  try {
    // Read the index.json file
    const indexData = await fsp.readFile(indexPath, 'utf8');
    const indexJson = JSON.parse(indexData);

    // Read the meta.json file
    const metaData = await fsp.readFile(metaPath, 'utf8');
    const metaJson = JSON.parse(metaData);

    // Merge total_attempts into the index data
    indexJson.subjects.forEach((subject: any) => {
      subject.books.forEach((book: any) => {
        book.chapters.forEach((chapter: any) => {
          const quizCode = chapter.quizCode;

          // Add total_attempts if it exists in meta.json
          if (metaJson[quizCode]) {
            chapter.total_attempts = metaJson[quizCode].total_attempts;
          } else {
            chapter.total_attempts = 0; // Default to 0 if not found in meta.json
          }
        });
      });
    });

    res.json(indexJson);
  } catch (err) {
    console.error('Error reading or processing files:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/quizes/:quizId', async (req: Request, res: Response): Promise<void> => {
  const quizId = req.params.quizId; // Extract the quiz ID from the URL
  const quizPath = path.join(__dirname, './data/quizes', `${quizId}.json`);
  const metaPath = path.join(__dirname, './data/meta.json');

  try {
    // Check if the quiz file exists
    await fsp.access(quizPath);

    // Read the quiz file
    const quizData = await fsp.readFile(quizPath, 'utf8');
    const quizJson = JSON.parse(quizData);

    // Read the metadata file
    const metaData = await fsp.readFile(metaPath, 'utf8');
    const metaJson = JSON.parse(metaData);

    // Check if metadata exists for the requested quiz
    if (!metaJson[quizId]) {
      res.status(404).json({ error: 'Metadata not found for the quiz' });
      return;
    }

    // Increment the total_attempts
    metaJson[quizId].total_attempts += 1;

    // Save the updated metadata back to the file
    await fsp.writeFile(metaPath, JSON.stringify(metaJson, null, 2));

    // Combine quiz data with updated metadata
    const response = {
      ...metaJson[quizId],
      ...quizJson,
    };

    res.json(response);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.error('File not found:', err.path);
      res.status(404).json({ error: 'Quiz file or metadata not found' });
    } else {
      console.error('Error handling request:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

server.listen(process.env.PORT)