const express = require("express");
const app = express();
const port = 3000;
const users = require("./persons.json");
const fs = require("fs");
const ejs = require("ejs");
const path = require("path");
const logs = require("./logs.json");

app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.json());

app.use(express.urlencoded({ extended: true })); // To read form data

const LOG_FILE_PATH = path.join(__dirname, 'logs.json');


const simpleLogger = (req, res, next) => {

    if (req.path.startsWith('/api/users') || req.path.startsWith('/users')) {
        
        const timestamp = new Date().toISOString();
        const method = req.method;
        const url = req.url;
        const ip = req.ip;
        
        const logEntry = {
            timestamp: timestamp,
            method: method,
            url: url,
            ip: ip,
            message: `Request for user resource.`
        };
        
     
        fs.readFile(LOG_FILE_PATH, 'utf8', (err, data) => {
            let logs = [];
            
            if (!err && data) {
                try {
                
                    logs = JSON.parse(data);
                } catch (e) {
                    console.error("Error parsing logs.json:", e);
                }
            }

        
            logs.push(logEntry);

  
            fs.writeFile(LOG_FILE_PATH, JSON.stringify(logs, null, 2), (err) => {
                if (err) {
                    console.error("Error writing to logs.json:", err);
                }
              
                console.log(`[${timestamp}] LOGGED: ${method} request to ${url}`);
            });
        });
    }
    

    next(); 
};

app.use(simpleLogger);

// ROUTES

app.get("/users", (req, res) => {
  res.render("./index.ejs", { users: users });
});

app.get("/usersadmin", (req, res) => {
  res.render("./usersadmin.ejs",{users: users});
});

app.get("/logsdashboard", (req, res) => {
  res.render("./logsdashboard.ejs",{logs: logs});
});


// API ROUTES

app.get("/api/users", (req, res) => {
  res.json(users);
});

app.get("/api/users/:id", (req, res) => {
  const id = Number(req.params.id);
  const user = users.find((user) => user.id === id);
  res.send(user);
});

//POST

app.post("/api/users", (req, res) => {
  const body = req.body;

  const newId = users.length > 0 
                ? Math.max(...users.map(u => u.id)) + 1 
                : 1;

  
  const newUser = { id: newId, ...body };
  users.push(newUser);
  fs.writeFile("./persons.json", JSON.stringify(users), () => {
    return res.send(`User added `);
  });
});

//PATCH

app.patch("/api/users/:id", (req, res) => {
  const id = Number(req.params.id);
  const body = req.body;

  // ✅ Correct comparison
  const user = users.find((user) => user.id === id);

  if (!user) {
    return res.status(404).send("User not found");
  }

  Object.assign(user, body);

  fs.writeFile("./persons.json", JSON.stringify(users, null, 2), (err) => {
    if (err) {
      return res.status(500).send("Error writing to file");
    }
    res.send("User updated successfully");
  });
});


//DELETE

app.delete("/api/users/:id", (req, res) => {
  const id = Number(req.params.id);
  const user = users.find((user) => user.id === id);
  const index = users.indexOf(user);
  users.splice(index, 1);

  fs.writeFile("./persons.json", JSON.stringify(users, null, 2), (err) => {
    if (err) {
      return res.status(500).send("Error writing to file");
    }
    res.send("User deleted and JSON file updated");
  });
});

// 404 


app.use((req, res, next) => {
    

  res.status(404);


  if (req.accepts('html')) {
    
      res.render('404', { url: req.url });
      return;
  }

  
  if (req.accepts('json')) {
      res.json({ error: 'Not Found', url: req.url });
      return;
  }

  res.type('txt').send('404 Not Found');
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
