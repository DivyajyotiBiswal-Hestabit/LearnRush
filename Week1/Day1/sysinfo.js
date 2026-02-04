const os = require("os");                                            /* os gives system information* like hostname, cpu info, memory info */
const {execSync} = require("child_process");

console.log("Hostname:",os.hostname());                               /* hostname is system name of the machine*/

try{
    const diskSpace = execSync(                                        /*execSync runs linus commands*/
        "df -h | awk 'NR==2 {print $4}'").toString().trim();           /* df -h shows disk usage in human readable format */
    console.log("Available Disk Space:",diskSpace);
}
catch{
    console.log("Available disk space: Unable to fetch");
}

try{
    const openPorts = execSync(
        "ss -tuln | awk 'NR>1 {print $5}' | cut -d: -f2 | sort -n | uniq | head -5").toString().trim();           /* ss -tuln shows open ports */
    console.log("Top 5 open ports:\n" + openPorts);
}
catch{
    console.log("Top 5 open ports: Unable to fetch");
}
try{
    const gateway = execSync(
        "ip route | grep default | awk '{print $3}'").toString().trim();
    console.log("Default Gateway:",gateway);
}
catch{
    console.log("Default Gateway: Unable to fetch");
}

try{
    const usersCount = execSync(
        "who | wc -l").toString().trim();                              /* who shows logged in users */
    console.log("Logged in users Count:",usersCount);
}
catch{
    console.log("Logged in users Count: Unable to fetch");
}

/* $1,$2,$3,... shows column number */
