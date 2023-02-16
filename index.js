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

let tagId = ""
// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('Client connected.');
   
  // Handle incoming messages
  ws.on('message', (message) => {
      console.log(`Received tag Id: ${message}`);
      ws.send('ON'); // turn the LED light on
      console.log("Light on")
      tagId = message
      if(tagId !== "") {
        Student.findOne( tagId , (err, student) => {
      if (err) {
        throw err
      } else {
        student.save((err) => {
          if (err) throw err
      else student.attendance = true
        })
      }
    })
} else {
  ws.send('OFF'); // turn the LED light off
  console.log("Light off")
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
  res.status(200).send("Index page");
});

// Get all students
app.get('/students', (req, res) => {
  Student.find({}, (err, students) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(students);
    }
  });
});

// Get a students
app.get('/students/:id', (req, res) => {
  const tagId = tagId
  Student.findById( tagId, (err, students) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(students);
    }
  });
});

// Register a new student
app.post('/students', (req, res) => {
  const student = new Student({
    name: req.body.name,
    level: req.body.level,
    attendance: req.body.attendance,
    tagId: req.body.tagId
  });
  student.save((err) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(student);
    }
  });
});


//Reset attendance for a student
app.put('/students/reset', (req, res) => {
  Student.find({}, (err, student) => {
    if (err) {
      res.status(500).send(err);
    } else if (student) {
      student.save((err) => {
        if (err) {
            res.status(500).send(err)
        } else {
          student.attendance = false
          res.status(200).send(student)
        }
    })
    } else {
        res.status(404).send({ message: 'Student not found' });
    }
  });
})
 
// Delete a student
app.delete('/students/:tagId', (req, res) => {
  Student.findOneAndRemove({ tagId }, (err, student) => {
    if (err) {
      res.status(500).send(err);
    } else if (student) {
      res.status(200).send({ message: 'Student deleted' });
    } else {
      res.status(404).send({ message: 'Student not found' });
    }
  });
});



server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}.`);
});
