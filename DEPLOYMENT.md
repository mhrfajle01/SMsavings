# Jomao (জমাও) - Deployment Instructions

## Supabase Setup
1. **Create Project:** Go to [Supabase](https://supabase.com/) and create a new project.
2. **Database Schema:** 
   - Open the **SQL Editor**.
   - Copy and paste the contents of `supabase_schema.sql` (found in the root directory).
   - Run the script to create tables, enable RLS, and set up triggers.
3. **Authentication:** 
   - Enable **Email/Password** authentication in the Auth settings.
   - (Optional) Enable Google Provider if desired.

## Local Environment
1. Create a `.env` file in the root.
2. Add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

## Vercel Deployment
1. **Connect Repository:** Link your GitHub/GitLab repo to Vercel.
2. **Build Settings:** Vercel will automatically detect Vite.
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Environment Variables:**
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project settings.
4. **Deploy:** Click deploy!

## Features
- **Banglish UI:** User-friendly interface in Bengali-inspired Latin script.
- **Smart Savings:** Goal tracking with animated progress.
- **Expense Tracking:** Categorized daily expenses.
- **Gamification:** Earn XP, level up, and complete challenges.
- **Responsive:** Optimized for mobile and desktop.
