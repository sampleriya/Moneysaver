// server.js

const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
const path = require("path");

// Serve static files from the 'public' directory
// app.use(express.static("public"));
// app.get("/", function (req, res) {
//   res.sendFile(path.join(__dirname, "/index.html"));
// });
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});
// Store submitted times
// Store submitted times
let submittedTimes = [];
let submissionClusters = [];

// Calculate average time
function calculateAverageTime(cluster) {
  if (cluster.length === 0) {
    return null;
  }

  const totalMilliseconds = cluster.reduce((total, time) => {
    const [hours, minutes] = time.split(":");
    return total + (parseInt(hours) * 60 + parseInt(minutes));
  }, 0);

  const averageMilliseconds = Math.round(totalMilliseconds / cluster.length);
  const averageHours = Math.floor(averageMilliseconds / 60);
  const averageMinutes = averageMilliseconds % 60;

  return `${averageHours.toString().padStart(2, "0")}:${averageMinutes
    .toString()
    .padStart(2, "0")}`;
}

// Socket.io connection
io.on("connection", (socket) => {
  console.log("A user connected");

  // Send average time and submission clusters to connected client
  const averageTime = calculateAverageTime(submittedTimes);
  if (averageTime) {
    socket.emit("averageTime", averageTime);
  }
  socket.emit("submissionClusters", submissionClusters);

  // Receive submitted time from client
  socket.on("submitTime", (time) => {
    submittedTimes.push(time);

    const averageTime = calculateAverageTime(submittedTimes);
    io.emit("averageTime", averageTime);
    io.emit("newSubmission", time);

    if (submittedTimes.length === 5) {
      submissionClusters.push(submittedTimes);
      submittedTimes = [];

      io.emit("submissionClusters", submissionClusters);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected");
    submittedTimes = submittedTimes.filter(
      (time) => time.socketId !== socket.id
    );
    const averageTime = calculateAverageTime(submittedTimes);
    io.emit("averageTime", averageTime);
  });
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
