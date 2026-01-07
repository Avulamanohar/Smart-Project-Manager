# Deployment Guide for Smart Project Manager

This guide helps you deploy the Smart Project Manager (MERN + Python AI) for free using **Render** (Backend & AI), **Vercel** (Frontend), and **MongoDB Atlas** (Database).

## Prerequisites
- [GitHub Account](https://github.com) (Push your code to a repository)
- [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas/register)
- [Render Account](https://render.com)
- [Vercel Account](https://vercel.com)

---

## Step 1: Database Setup (MongoDB Atlas)
1.  Log in to MongoDB Atlas and create a new **Free (M0)** Cluster.
2.  Go to **Database Access** > Create a Database User (User/Password).
3.  Go to **Network Access** > Add IP Address > Allow Access from Anywhere (`0.0.0.0/0`).
4.  Go to **Database** > Connect > Drivers > Copy the **Connection String**.
    - It looks like: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`
    - Replace `<password>` with your actual password.

---

## Step 2: Deploy Backend & AI Service (Render)
We will use the `render.yaml` blueprint included in this project.

1.  **Push your code to GitHub** if you hasn't already.
2.  Log in to [Render Dashboard](https://dashboard.render.com).
3.  Click **New +** > **Blueprints**.
4.  Connect your GitHub repository.
5.  Render will detect `render.yaml` and show two services: `spm-backend` and `spm-ai-service`.
6.  You will be prompted to enter Environment Variables:
    - **MONGODB_URI**: Paste your MongoDB connection string from Step 1.
    - **HUGGINGFACEHUB_API_TOKEN**: Your Hugging Face Access Token (Read permission).
    - **DEEPSEEK_API_KEY**: (Optional) if you use DeepSeek.
    - **CLIENT_URL**: Leave blank for now (or put `http://localhost:5173` temporarily). We will update this after deploying Frontend.
7.  Click **Apply**. Render will deploy both services.
8.  **Wait for deployment**. Once finished, note down the **Backend Service URL** (e.g., `https://spm-backend.onrender.com`).
    - *Note: The first deploy might take a few minutes.*

---

## Step 3: Deploy Frontend (Vercel)
1.  Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **Add New...** > **Project** > Import your GitHub repository.
3.  **Configure Project**:
    - **Framework Preset**: Vite
    - **Root Directory**: Click the 'Edit' button and select `frontend`.
4.  **Environment Variables**: Expand the section and add:
    - `VITE_API_URL`: `https://your-backend-url.onrender.com/api` (Make sure to include `/api` at the end)
    - `VITE_SOCKET_URL`: `https://your-backend-url.onrender.com` (Base URL without `/api`)
    - *Replace `https://your-backend-url.onrender.com` with the actual URL from Step 2.*
5.  Click **Deploy**.
6.  Once live, copy your **Frontend URL** (e.g., `https://smart-project-manager.vercel.app`).

---

## Step 4: Final Connection (CORS)
1.  Go back to your **Render Dashboard**.
2.  Select the **spm-backend** service.
3.  Go to **Environment**.
4.  Update `CLIENT_URL` to your **Frontend URL** (e.g., `https://smart-project-manager.vercel.app`).
    - *Remove any trailing slashes.*
5.  Render will redeploy the backend automatically.

---

## Troubleshooting
- **AI Service Error**: If the backend cannot talk to the AI service, check the logs of `spm-backend`. It should say `AI Service URL: ...`. Ensure the `AI_SERVICE_URL` env var was correctly set by the Blueprint (it usually happens automatically).
- **CORS Error**: If you see CORS errors in the browser console, ensure `CLIENT_URL` in Backend matches your Vercel URL exactly.
- **Boot Time**: Free tier on Render spins down after inactivity. The first request might take 30-50 seconds.
