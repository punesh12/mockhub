# Troubleshooting Guide

## Login 500 Error

If you're getting a 500 error on the login page, check the following:

### 1. Check Environment Variables

Make sure your `.env.local` file has the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### 2. Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Check Server Logs

Check your terminal/console for error messages. The server will log:

- Missing environment variables
- Supabase connection errors
- Authentication errors

### 4. Verify Supabase Auth is Enabled

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Make sure **Email** provider is enabled
3. Check **Settings** → **Auth** for any restrictions

### 5. Restart Development Server

After updating `.env.local`:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### 6. Common Issues

**Issue**: "Supabase environment variables are missing"

- **Solution**: Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`

**Issue**: "Invalid API key"

- **Solution**: Double-check the anon key from Supabase dashboard

**Issue**: "Network error" or "Connection refused"

- **Solution**: Check your internet connection and Supabase project status

**Issue**: "User not found" or "Invalid credentials"

- **Solution**: Make sure you've created a user account via signup first

## Testing the Setup

1. **Check environment variables are loaded**:

   ```bash
   # In your terminal, check if variables are set
   echo $NEXT_PUBLIC_SUPABASE_URL
   ```

2. **Test Supabase connection**:
   - Visit `/api/health` endpoint
   - Should return database connection status

3. **Test signup first**:
   - Try signing up a new user
   - If signup works but login doesn't, check Supabase Auth settings

## Getting Help

If the issue persists:

1. Check the browser console for client-side errors
2. Check the server terminal for server-side errors
3. Verify all environment variables are set correctly
4. Make sure Supabase project is active and not paused
