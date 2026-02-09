const http = require('http');
let counter = 0;
const server = http.createServer((req,res) => {
    res.setHeader('Content-Type','application/json');
    if(req.url === '/ping'){
        const timestamp = new Date().toISOString();
        res.writeHead(200);
        res.end(JSON.stringify({timestamp}));
    }
    else if (req.url === '/headers') {
        res.writeHead(200);
        res.end(JSON.stringify(req.headers, null, 2));
    } 
    else if (req.url === '/count') {
        counter++;
        res.writeHead(200);
        res.end(JSON.stringify({ count: counter }));
    } 
    else{
        res.writeHead(404);
        res.end(JSON.stringify({error: 'Not Found'}));
    }
});
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
})