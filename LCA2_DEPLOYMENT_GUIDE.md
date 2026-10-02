# FSD LCA-2 Deployment Guide & Instructions

## Project Overview
- **Project Name**: CyberSnake Arcade - Full-Stack Online Game with Global Leaderboard
- **Tech Stack**: Node.js, Express.js, HTML5 Canvas, Web Audio API, Tailwind CSS, MongoDB (Mongoose), Docker, AWS EC2 (Ubuntu 24.04 LTS)

---

## Step-by-step Deployment Guide on AWS EC2

### Step 1: Create AWS EC2 Instance
1. Log into your **AWS Management Console** and navigate to **EC2 Dashboard**.
2. Click **Launch Instance**.
3. Name your instance: `cybersnake-game-server`.
4. Choose AMI: **Ubuntu Server 24.04 LTS** (64-bit x86).
5. Instance type: `t2.micro` or `t3.micro` (Free tier eligible).
6. Key Pair: Create or select an existing `.pem` key pair (e.g., `cybersnake-key.pem`).
7. **Network Settings / Security Group**:
   - Allow **SSH** traffic from anywhere (`0.0.0.0/0`) on Port 22.
   - Allow **HTTP** traffic from anywhere (`0.0.0.0/0`) on Port 80.
8. Click **Launch Instance**.
9. **Copy your assigned Public IPv4 Address** from the EC2 instance summary page (e.g., `16.171.10.21` or your instance's unique IP).

---

### Step 2: SSH into EC2 Instance via Terminal
Open your terminal on your local machine and run (replace `<YOUR_EC2_PUBLIC_IP>` with your assigned IP):

```bash
ssh -i "cybersnake-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```

---

### Step 3: Install Docker on AWS EC2 Instance

```bash
# Update package lists
sudo apt-get update -y

# Install Docker
sudo apt-get install -y docker.io

# Start and enable Docker service
sudo systemctl start docker
sudo systemctl enable docker

# (Optional) Add current user to docker group
sudo usermod -aG docker ubuntu
newgrp docker
```

---

### Step 4: Clone the Git Repository to Instance

```bash
git clone https://github.com/YourUsername/cybersnake-online-game.git
cd cybersnake-online-game
```

---

### Step 5: Build the Docker Container

```bash
docker build -t cybersnake-game-app .
```

*Verification Output:*
```text
Sending build context to Docker daemon 1.2MB
Step 1/7 : FROM node:20-alpine
Step 2/7 : WORKDIR /app
Step 3/7 : COPY package*.json ./
Step 4/7 : RUN npm install --only=production
Step 5/7 : COPY . .
Step 6/7 : EXPOSE 3000
Step 7/7 : CMD ["node", "server.js"]
Successfully built 622593dbf00f
Successfully tagged cybersnake-game-app:latest
```

---

### Step 6: Run the Docker Container

Run container in detached mode mapping Port 80 on host to Port 3000 inside the container:

```bash
docker run -d \
  -p 80:3000 \
  -e MONGODB_URI="mongodb+srv://user:pass@cluster0.m5extw7.mongodb.net/cybersnake?appName=Cluster0" \
  --name my-cybersnake-game \
  cybersnake-game-app
```

Check running container status and logs:

```bash
docker ps
docker logs my-cybersnake-game
```

---

### Step 7: Accessing the Live Deployed Game URL
Your deployed online game will be live at:
```text
http://<YOUR_EC2_PUBLIC_IP>/
```

> **Example**: If your AWS EC2 instance receives the public IP `16.171.10.21`, your live URL will be:
> `http://16.171.10.21/`
