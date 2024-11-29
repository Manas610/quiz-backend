require("dotenv").config()
import express, { Request, Response } from 'express';
import http from 'http'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import cors from 'cors'
import fs from 'fs';
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
    const filePath = path.join(__dirname, './data/history.json');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading the file:', err);
        return res.status(500).json({ error: 'Failed to load data' });
      }
      
      try {
        const jsonData = JSON.parse(data);
        res.json(jsonData);
      } catch (parseErr) {
        console.error('Error parsing JSON:', parseErr);
        res.status(500).json({ error: 'Failed to parse data' });
      }
    });
  });

interface HistoryData {
    [key: string]: any; // Allow dynamic keys, such as "class_11" or "class_12"
}

app.get('/data/*', (req: Request, res: Response) => {
    const filePath = path.join(__dirname, './data/history.json');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading the file:', err);
        return res.status(500).json({ error: 'Failed to load data' });
      }
      
      try {
        const jsonData: HistoryData = JSON.parse(data);
  
        // Extract the dynamic path after `/data/`
        const subPath = req.params[0]; // Gets everything after `/data/`
        const keys = subPath.split('/'); // Split path into keys
  
        // Navigate through the JSON using the keys
        let result = jsonData;
        for (const key of keys) {
          if (result[key] === undefined) {
            return res.status(404).json({ error: 'Path not found in JSON' });
          }
          result = result[key];
        }
  
        res.json(result);
      } catch (parseErr) {
        console.error('Error parsing JSON:', parseErr);
        res.status(500).json({ error: 'Failed to parse data' });
      }
    });
  });


server.listen(process.env.PORT)