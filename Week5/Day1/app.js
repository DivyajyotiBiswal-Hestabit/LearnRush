const http = require("http");
const os = require("os");

const PORT = 3000;

const server = http.createServer((req,res)=>{
    const response = {
        message: "Hello from Dockerized Node app",
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        uptime: process.uptime(),
        pid: process.pid,
        currentTime: new Date().toISOString()
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(response, null, 2));
});
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});