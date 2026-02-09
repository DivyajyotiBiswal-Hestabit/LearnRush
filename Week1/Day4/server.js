const http = require("http");
let counter = 0;
const server = http.createServer((req,res) => {
    res.setHeader("Content-Type", "application/json");
    if(req.url=== "/ping" && req.method === "GET"){
        res.statusCode = 200;
        res.end(
            JSON.stringify({
                time: new Date().toISOString()
            })
        );
    }
    else if(req.url=== "/headers" && req.method === "GET"){
        res.statusCode = 200;
        res.end(
            JSON.stringify({
                headers: req.headers
            })
        );
    }
    else if(req.url=== "/count" && req.method === "GET"){
        counter++;
        res.statusCode = 200;
        res.end(
            JSON.stringify({
                count: counter
            })
        );
    }
    else{
        res.statusCode = 404;
        res.end(
            JSON.stringify({
                error: "Route not found"
            })
        );
    }
});
const PORT = 3000;
server.listen(PORT, () => {
    console.log('Server running at http://localhost:${PORT}');
});