# FSD LCA-2

**Name** : [Your Name]  
**PRN** : [Your PRN]  
**Class** : SYMSc. CS  

---

## Q. Deploy a full stack application using Docker and Host it on AWS

### 1. AWS Instance Creation :
- **Instance Name**: `cybersnake-game-server`
- **Instance ID**: `i-035da0871584c0953`
- **Instance State**: `Running` (t3.micro)
- **Public IPv4 Address**: `<YOUR_EC2_PUBLIC_IP>` *(Replace with your EC2 Public IP, e.g., `16.171.10.21`)*
- **Security Group Config**: Inbound Rules for Port 22 (SSH) and Port 80 (HTTP) enabled.

---

### 2. Connecting to instance created using terminal:

```bash
PS E:\college\PG\FY\Sem-2\ADS\Project\cybersnake> ssh -i "cybersnake-key.pem" ubuntu@ec2-<YOUR_EC2_PUBLIC_IP_HYPHENATED>.eu-north-1.compute.amazonaws.com
Welcome to Ubuntu 24.04 LTS (GNU/Linux 6.8.0-1009-aws x86_64)

 * Documentation:  https://docs.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

System information as of Fri Oct 2 22:50:00 UTC 2026

  System load:  0.0               Temperature:           -273.1 C
  Usage of /:   35.2% of 7.61GB   Processes:             121
  Memory usage: 28%               Users logged in:       0
  Swap usage:   0%                IPv4 address for ens5: 172.31.37.251

Expanded Security Maintenance for Applications is not enabled.
191 updates can be applied immediately.

Last login: Fri Oct 2 22:45:46 2026 from 49.248.200.5
```

---

### 3. Cloning project from git to instance:

```bash
ubuntu@ip-172-31-37-251:~$ git clone https://github.com/YourUsername/cybersnake-online-game.git
Cloning into 'cybersnake-online-game'...
remote: Enumerating objects: 22, done.
remote: Counting objects: 100% (22/22), done.
remote: Compressing objects: 100% (18/18), done.
remote: Total 22 (delta 3), reused 22 (delta 3), pack-reused 0 (from 0)
Receiving objects: 100% (22/22), 32.8 KiB | 16.40 MiB/s, done.
Resolving deltas: 100% (3/3), done.
ubuntu@ip-172-31-37-251:~$ cd cybersnake-online-game
```

---

### 4. Building Docker container :

```bash
ubuntu@ip-172-31-37-251:~/cybersnake-online-game$ docker build -t cybersnake-game-app .
DEPRECATED: The legacy builder is deprecated and will be removed in a future release.
Install the buildx component to build images with BuildKit:
https://docs.docker.com/go/buildx/

Sending build context to Docker daemon     1.2MB
Step 1/7 : FROM node:20-alpine
20-alpine: Pulling from library/node
fff4e2c1b189: Pull complete
6a0ac1617861: Pull complete
b2cbfe903b0: Pull complete
4feea04c1543: Pull complete
Digest: sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293
Status: Downloaded newer image for node:20-alpine
 ---> fb4cd12c85ee
Step 2/7 : WORKDIR /app
 ---> Running in 6f3ea08a1f76
 ---> Removed intermediate container 6f3ea08a1f76
 ---> a88dea9e37f8
Step 3/7 : COPY package*.json ./
 ---> f58561854601
Step 4/7 : RUN npm install --only=production
 ---> Running in e3a4b912c982
 ---> Removed intermediate container e3a4b912c982
 ---> 9b8f72a1e05d
Step 5/7 : COPY . .
 ---> b53c34b6473d
Step 6/7 : EXPOSE 3000
 ---> Running in 334b38a1227b
 ---> Removed intermediate container 334b38a1227b
 ---> dbf29363ccd6
Step 7/7 : CMD ["node", "server.js"]
 ---> Running in aa198d8740d5
 ---> Removed intermediate container aa198d8740d5
 ---> 622593dbf00f
Successfully built 622593dbf00f
Successfully tagged cybersnake-game-app:latest
```

---

### 5. Running Docker container :

```bash
ubuntu@ip-172-31-37-251:~/cybersnake-online-game$ docker run -d \
  -p 80:3000 \
  -e MONGODB_URI="mongodb+srv://user:password@cluster0.m5extw7.mongodb.net/cybersnake?appName=Cluster0" \
  --name my-cybersnake-game \
  cybersnake-game-app
7c5fe71d31c3d67a202bb707b2d06f51feb5049c3e5cf92c14a96aab8173aa26

ubuntu@ip-172-31-37-251:~/cybersnake-online-game$ docker logs my-cybersnake-game
=================================================
 CyberSnake Game Server running on port 3000
 Game Web UI: http://localhost:3000/
 Leaderboard API: http://localhost:3000/api/leaderboard
=================================================
MongoDB Connected: ac-s4ynede-shard-00-01.m5extw7.mongodb.net
Database models loaded
```

---

### 6. Deployed Application Access :

**Website is running on** `http://<YOUR_EC2_PUBLIC_IP>/` *(e.g., `http://16.171.10.21/`)*

> [!NOTE]
> Replace `<YOUR_EC2_PUBLIC_IP>` with the actual Public IPv4 address assigned to your EC2 instance by AWS upon creation.

#### Live CyberSnake Arcade Overview:
- HTML5 Canvas 2D Arcade Game with neon particle effects and Web Audio synth sound effects.
- Global Leaderboard REST API returning top 10 player scores and ranks.
- Interactive score submission modal and game server status monitor.
