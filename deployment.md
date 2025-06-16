# 🚀 Deployment Guide

This document provides a step-by-step guide to deploy both the frontend and backend components of the project, along with necessary Supabase configuration details.

---

## 📁 Project Structure Overview

- src/app

---

## 🌐 Frontend Deployment (Vercel)

1. **Login to Vercel**  
   Visit [https://vercel.com](https://vercel.com) and log in with your GitHub/GitLab/Bitbucket account.

2. **Import the project**  
   Click "Add New Project" → Import the Git repository.

3. **Configure Environment Variables**  
   Add the following environment variables in the Vercel dashboard under **Project Settings > Environment Variables**: For production use the .env.production and for dev use .env.local

4. **Set Root Directory (Optional)**  
If your frontend is not in the root folder, set the project root to `/frontend`.

5. **Build & Output Settings**  
Vercel will automatically detect it’s a Next.js project and set the correct build settings:
- **Build Command:** `npm run build` or `next build`
- **Output Directory:** `.next`

6. **Deploy**  
Click **Deploy** and wait for the deployment to finish.

---

## 🧠 Backend Deployment (Supabase Functions)

For supabase usage, you will need:
- Node
- Supabase CLI
- Docker Desktop


### 📂 Functions Folder

All Supabase Edge Functions are located in:
- /supabase/functions


### 🔑 Setting Supabase Secrets

Use the following commands to set secrets required by the functions:

```bash
supabase functions secrets set MY_SECRET_KEY=value
supabase functions secrets list
```

To deploy all secrets from a specific file:


Navigate to: ```cd /supabase```, and deploy the env you want

```bash
supabase secrets set  --env-file ./.env.local
```

### 🚀 Deploying Functions

To deploy functions, use:

```bash
supabase functions deploy <function-name>
```

To deploy all functions (if using automation or CI/CD), 

Navigate to the `/supabase/functions`, Run:
```
supabase functions deploy
```




