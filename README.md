# LearnRush
This repository contains the day wise deliverables 

📌 Week 1 — Engineering Mindset Bootcamp

🟦 DAY1 — SYSTEM REVERSE ENGINEERING + NODE & TERMINAL

~ Sysinfo.js is a script that prints the hostname, available disk space, top 5 open ports, default gateway and count of logged-in users

~ Created 3 shell aliases named gst,files and ports for git status, ls -lha and lsof -i -P -n | grep LISTEN  respectively (Screenshot attached in the folder)

To verify this, run(in terminal):  

alias

type alias_name

Reminder - Before creating aliases, check your current shell by "echo $SHELL"   

<p align="center">
  <img src="Screenshots/Week1/bashrc_screenshot.png" width="600"/>
</p>

~ Ran a node program named runtimeMetrics.js and captured its runtime metrices using process.cpuUsage() and process.resourceUsage()

🟩 DAY2 — NODE CLI & CONCURRENCY

CLI Tool-Stats.js

Features: 

-Counts lines, characters, and words

-Processes 3 files in parallel using promise.all

-Outputs performance metrics

-Optional: duplicate removals

Command to run : node stats.js --file filename.txt  (this will process the file and add the performance metrices to log)

To process files and remove their duplicate lines : node stats.js --file filename.txt --unique true   (After this the modified files will be added to the output folder)       

🟨 DAY3 — GIT MASTERY (RESET + REVERT + CHERRY-PICK + STASH)

~ Syntax error was inserted in the program as a bad commit out of 10 commits and used git bisect to detect the first bad commit  

Command : To start bisect-  git bisect start 

To stop bisect- git bisect reset

~ Created new branch release/v0.1 from older commit using  git checkout -b release/v0.1 commitHash

[commithash can be found using:  git log -oneline]

~ Cherry picked the commits from the main branch to release branch. First switch to release branch

Command used: git cherry-pick 1commitHash 2commitHash....

~ A new commit was made in the program and pushed in the stash and the branch was switched but the commit remained in the stash and finally the commit was restored using git stash apply

~ Created commit graph using: git log --graph --all show

<p align="center">
  <img src="Screenshots/Week1/commit-graph.png" width="600"/>
</p>

🟥 DAY4 — HTTP / API FORENSICS (cURL + POSTMAN)

~ Logged the response headers into curl-headers.txt using:  curl -I https://api.github.com/users/octat > curl-headers.txt

~ Analyzed paginated responses of 3 pages and link headers by fetching https://api.github.com/users/octocat/repos?page=1&per_page=5

Conclusion: Logged each pages's relation with other pages. However Page3 contains an empty body because the last relation pointing to page2 confirms that page2 is the final page with results and page3 is beyond the dataset.

~ Created and exported that collection to test *GitHub user endpoint  *Repositories across pages

~ Server.js is build to return timestamp,request headers and maintain counter in memory using endpoints: /ping,/headers and /count respectively

To test run: http://localhost:3000/ping

http://localhost:3000/headers

http://localhost:3000/count

🟪 DAY5 — AUTOMATION & MINI-CI PIPELINE

~ healthcheck.sh pings your sever every 10sec and also log the timestamps during the failure into the logs folder  

Check private ip address of sever: ip a OR hostname -I

For private ip address of sever: curl ifconfig.me

~ Created pre-commit hook using Husky which checks that .env file does not exist in git, Js is formatted and ensure log files are ignored.

<p align="center">
  <img src="Screenshots/Week1/failed_pre-commit.png" width="600"/>
  <p>Failed pre-commit hook"</p>
</p>

<p align="center">
  <img src="Screenshots/Weeek1/passed_pre-commit.png" width="600"/>
  <p>Passed pre-commit hook"</p>
</p>

~ Generated archive: bundle-<timestamp>.zip which includes source code, logs, docs and SHA1 checksums  (To create checksum file: sha1sum src/* > checksums.sha1)

Commands to run build bundle : TIMESTAMP = $(date +%Y%m%d%H%M%S)      #to generate timestamp

zip -r bundle -$TIMESTAMP.zip src logs docs checksum.sha1

~ Scheduling to run healthcheck.sh to run every 5 min using cron. To edit crontab run : crontab -e but first make the healthcheck.sh executable using chmod +x healthcheck.sh

<p align="center">
  <img src="Screenshots/Weeek1/scheduledCronJob.png" width="600"/>
</p>

📌 Week 2 — Frontend (HTML, CSS, JS)

🟦 DAY1 – HTML5 + Semantic Layout

🟩 DAY2 – CSS Layout Mastery (Flexbox + Grid)

🟨 DAY3 – JavaScript ES6 + DOM Manipulation

🟥 DAY4 – JS Utilities + LocalStorage Mini-Project

🟪 DAY5 – Capstone UI + JS Project

📌 Week 3 – Frontend Advanced

🟦 DAY1 — TailwindCSS + UI System Basics

🟩 DAY2 — Tailwind Advanced + Component Library

🟨 DAY3 — Next.js Routing + Layout System

🟥 DAY4 — Dynamic UI + Image Optimization

🟪 DAY5 — Capstone Mini Project (No backend)
