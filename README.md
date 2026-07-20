<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/c25e973e-a3cb-4e31-8ce1-56041ebc38e3

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Set the Taifa Mobile API key in `.env.local`:
   `TAIFA_API_KEY=your_h_api_key`
4. Run the SMS proxy server in one terminal:
   `npm run sms-server`
5. Start the app in another terminal:
   `npm run dev`
