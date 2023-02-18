const express = require('express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const WebSocket = require('ws');
const Student = require("./models/student")
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;

//database connection
mongoose.connect(process.env.DB_URL)
mongoose.set('strictQuery', false);

//mIddleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({server});

let tagId
// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected.');
   
  // Handle incoming messages
  ws.on('message', (message) => {
      console.log(`Received tag Id: ${message}`);
      ws.send('GREEN_ON'); // turn the green LED on
      ws.send('GREEN_OFF'); // turn the green LED off
      console.log("Green Light on") 

      global.tagId = message
      
      if (!message) {
        ws.send('RED_ON'); // turn the red LED on
        console.log("Red Light on")
      }
    // Broadcast tag Id to all connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Handle disconnections
  ws.on('close', () => {
    console.log('Client disconnected.');
  });
});


// Index page
app.get('/', (req, res) => {
  try {
    ws.on('message', (message) => {
      console.log(`Received tag Id: ${message}`);
      ws.send('GREEN_ON'); // turn the green LED on
      ws.send('GREEN_OFF'); // turn the green LED off
      console.log("Green Light on") 

      global.tagId = message
      
      if (!message) {
        ws.send('RED_ON'); // turn the red LED on
        console.log("Red Light on")
      }
    // Broadcast tag Id to all connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Handle disconnections
  ws.on('close', () => {
    console.log('Client disconnected.');
  });
    res.status(201).send(tagId);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all students
app.get('/students', async (req, res) => {
  try {
    const students = await Student.find({})
    if (!students) throw new Error('No students found');
    res.status(200).json(students);
  } catch (err) {
    res.status(404).json(err);
  }
});

// Get a students !
app.get('/students/:tagId', async (req, res) => {
  const tagId = tagId;
  try {
    const student = await Student.findById(tagId)
    if (!student) throw new Error('No student found');
    res.status(201).json(student);
  } catch (err) {
    res.status(404).json(err);
  }
});
    
// Register a new student
app.post('/students', async (req, res) => {
  const student = new Student({
    name: req.body.name,
    level: req.body.level,
    attendance: req.body.attendance,
    tagId: req.body.tagId,
    matricNo: req.body.matricNo
  });
  try {
    await student.save((err) => {
      res.status(201).json(student);
    }) 
  } catch (err) {
    res.status(500).send(err);
  }
})

//Reset attendance for a student !
app.put('/students/reset', async (req, res) => {
    try {
      const updateStudent = await Student.updateMany({attendance : true}, {attendance : false});
      res.status(201).send(updateStudent)
    } catch (err) {
      console.log(err);
      res.status(500).json({ err });
    }
});
 
// Delete a student
app.delete('/students/:tagId', async (req, res) => {
    const tagId = req.body.tagId
    try {
      await Student.findOneAndRemove({tagId})
      res.send({ message: 'User deleted successfully' });
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`);
});
