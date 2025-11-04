🏆 CodeArena 💻⚡
_Where coders compete, learn, and rise to the top._
⚡ Overview
CodeArena is a full-stack competitive programming platform inspired by platforms like LeetCode and Codeforces — built with React.js, Supabase, and Google Gemini AI. It allows users to:
- Create and host coding contests 🧑‍💻
- Compete with others in real-time 🏁
- Solve challenges, run code, and test with live outputs 💡
- Generate formatted HTML problem statements using AI 🤖

💻 Built for developers, by developers — because coding should be a battle worth fighting.
🧩 Features
✅ Contest Management
- Create, edit, and delete contests
- Add multiple coding problems per contest
- View upcoming, running, and past contests

✅ AI Problem Generator (Gemini Integration)
- Paste a raw problem statement and get a formatted HTML version using Google’s Gemini API

✅ Online Code Compiler
- Supports multiple languages (C++, Java, Python, JavaScript, Go, Rust, etc.)
- Run and test your code instantly via Piston API

✅ Supabase Integration
- Real-time database for contests, problems, and user registrations

✅ Modern UI
- Built using React + Vite with Tailwind CSS
- Clean, minimal, and responsive
🏗️ Tech Stack
•	Frontend: React.js (Vite)
•	Backend: Supabase (PostgreSQL + Auth)
•	AI Service: Google Gemini API
•	Code Execution: Piston API
•	Styling: Tailwind CSS
•	Hosting: GitHub Pages / Vercel (optional)
⚙️ Installation & Setup
1. Clone the repo:
   git clone https://github.com/YOUR_USERNAME/codearena.git
   cd codearena

2. Install dependencies:
   npm install

3. Create a .env file with Supabase credentials:
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_KEY=your_supabase_key

4. Start the development server:
   npm run dev

5. Visit http://localhost:5173
🧠 Folder Structure
📦 CodeArena
 ┣ 📂 src
 ┃ ┣ 📂 components → Reusable UI components (Navbar, ContestCard, etc.)
 ┃ ┣ 📂 pages → App pages (Home, CreateContest, AddQuestions, etc.)
 ┃ ┣ 📜 supabaseClient.js → Supabase configuration
 ┃ ┣ 📜 main.jsx
 ┃ ┗ 📜 App.jsx
 ┣ 📜 package.json
 ┣ 📜 vite.config.js
 ┣ 📜 postcss.config.js
 ┗ 📜 README.md
🚀 Future Improvements
- [ ] Add leaderboard system
- [ ] Add submission tracking
- [ ] Real-time contest timer
- [ ] Enhanced AI-based problem grading
- [ ] User profiles and badges system

🧑‍💻 Author
Dishank Aswal
📧 dishankaswal2002@gmail.com | dishankaswalau@gmail.com
🌐 GitHub: https://github.com/Dishankaswal
🔗 LinkedIn: https://www.linkedin.com/in/dishankaswal/

“Code is not just logic — it’s art, creativity, and competition.” 💻⚡