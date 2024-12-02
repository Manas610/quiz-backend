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

app.get('/data', (req, res) => {
    const filePath = path.join(__dirname, './data/index.json');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading the file:', err);
        return res.status(500).json({ error: 'Failed to load data' });
      }
      
      try {
        const jsonData = JSON.parse(data);
        return res.json(jsonData);
      } catch (parseErr) {
        console.error('Error parsing JSON:', parseErr);
        res.status(500).json({ error: 'Failed to parse data' });
      }
    });
  });

// app.get('/data/quizes/*', (req: Request, res: Response) => {
//     const filePath = path.join(__dirname, './data/quizes/history.json');
    
//     fs.readFile(filePath, 'utf8', (err, data) => {
//       if (err) {
//         console.error('Error reading the file:', err);
//         return res.status(500).json({ error: 'Failed to load data' });
//       }
      
//       try {
//         const jsonData: HistoryData = JSON.parse(data);
  
//         // Extract the dynamic path after `/data/`
//         const subPath = req.params[0]; // Gets everything after `/data/`
//         const keys = subPath.split('/'); // Split path into keys
  
//         // Navigate through the JSON using the keys
//         let result = jsonData;
//         for (const key of keys) {
//           if (result[key] === undefined) {
//             return res.status(404).json({ error: 'Path not found in JSON' });
//           }
//           result = result[key];
//         }
  
//         res.json(result);
//       } catch (parseErr) {
//         console.error('Error parsing JSON:', parseErr);
//         res.status(500).json({ error: 'Failed to parse data' });
//       }
//     });
//   });

// app.get('/data/quizes/:quizId', (req: Request, res: Response) => {
//   const quizId = req.params.quizId;
//   const filePath = path.join(__dirname, './data/quizes', `${quizId}.json`);
//   const metaPath = path.join(__dirname, './data/meta.json');

//   // Check if the file exists
//   fs.access(filePath, fs.constants.F_OK, (err) => {
//     if (err) {
//       console.error('File not found:', filePath);
//       return res.status(404).json({ error: 'File not found' });
//     }

//     // Read the file if it exists
//     fs.readFile(filePath, 'utf8', (readErr, data) => {
//       if (readErr) {
//         console.error('Error reading the file:', readErr);
//         return res.status(500).json({ error: 'Failed to load data' });
//       }


//       // Read the metadata file
//       fs.readFile(metaPath, 'utf8', (readMetaErr, metaData) => {
//         if (readMetaErr) {
//           console.error('Error reading the metadata file:', readMetaErr);
//           return res.status(500).json({ error: 'Failed to load metadata' });
//         }

//       try {
//         const quizJson = JSON.parse(data);
//         const metaJson = JSON.parse(metaData);

//         const meta = metaJson[quizId];
//         if (!meta) {
//           return res.status(404).json({ error: 'Metadata not found for the quiz' });
//         }

//         meta.total_attempts += 1;

//         const response = {
//           quiz: quizJson,
//           meta,
//         };

//         res.json(response); // Return the JSON data
//       } catch (parseErr) {
//         console.error('Error parsing JSON:', parseErr);
//         res.status(500).json({ error: 'Failed to parse data' });
//       }
//     });
//   });
//   });
// });

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
      quiz: quizJson,
      meta: metaJson[quizId],
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