# Step-by-step: from this folder to a live website

Written for a first-year student. Do the steps in order. Each step says what you should see when it works.
Time needed: about 30 minutes the first time.

---

## Part 0. What you are about to do (the big picture)

1. **Your folder** holds the app's code.
2. **GitHub** stores a copy of the folder online (like Google Drive for code).
3. **Vercel** reads that copy, runs `npm run build`, and publishes the website.

After this, every time you change a file and upload it to GitHub, Vercel updates the website by itself.

**Why you do NOT upload `node_modules` or `vendor`:** the Python, C++ and editor engines are big (about 60 MB+). Vercel downloads them for you while building. The `.gitignore` file already tells Git to skip them.

---

## Part 1. Install the tools (once)

1. **Node.js (version 22 or newer):** go to nodejs.org, download the **LTS** version, install it with the default options.
2. **Git:** go to git-scm.com, download, install with the default options.
3. **VS Code** (optional but nice): code.visualstudio.com.
4. Open **Terminal** (Windows: search "PowerShell"; Mac: search "Terminal") and check:

```
node -v
git --version
```

You should see version numbers (node must show `v22` or higher). If it says "not recognized", close and reopen the terminal, or reinstall.

---

## Part 2. Run it on your own computer first

1. Unzip `bsit-code-lab.zip` somewhere easy, for example `Documents`.
2. In the terminal, go into the folder (replace the path with yours):

```
cd Documents/bsit-code-lab
```

3. Download the engines and build the app:

```
npm install
npm run build
```

You should see `Build finished.` and lines starting with `ok`. If a line starts with `x`, read it: it tells you what is missing.

4. Start it:

```
npm start
```

5. Open **http://localhost:3000** in Chrome or Edge. You should see the dark gray app with a green strip. Press **Run** on the default `hello.py`.

6. Stop the server with **Ctrl+C**.

**Test the offline part:** open the app, wait 10 seconds, click the **⋮** menu, then **How saving and offline work**, then **Download offline files**. Turn off Wi-Fi and reload the page. It should still open and run code.

---

## Part 3. Put it on GitHub

1. Create an account at github.com (free).
2. Click **+** (top right), then **New repository**.
   - Name: `bsit-code-lab`
   - Choose **Public** (or Private, both work with Vercel).
   - **Do not** tick "Add a README" (we already have one).
   - Click **Create repository**.
3. Back in your terminal, inside the project folder, run these one at a time (replace `YOUR-USERNAME`):

```
git init
git add .
git commit -m "First version of Code Lab"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/bsit-code-lab.git
git push -u origin main
```

If Git asks who you are, run these once and then repeat the `commit`:

```
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

4. Refresh the GitHub page. You should see your files (`public`, `scripts`, `package.json`...).
   **Check:** there must be **no** `node_modules` folder and **no** `public/vendor` folder on GitHub. That is correct.

---

## Part 4. Publish with Vercel

1. Go to vercel.com and click **Sign Up**, then **Continue with GitHub**.
2. Click **Add New... > Project**.
3. Find `bsit-code-lab` in the list and click **Import**.
4. Leave every setting as it is. (`vercel.json` already tells Vercel what to do.)
5. Click **Deploy** and wait 1 to 2 minutes.
6. When it says **Congratulations**, click the preview image. Your site is live at an address like `bsit-code-lab.vercel.app`.

If the build **fails**: click the failed deployment, open **Build Logs**, and look for a line starting with `x`. The build script prints exactly which engine file it could not find. Send me that line.

---

## Part 5. Check that it works for your classmates

Open the live link on your phone and on a laptop, then check:

- [ ] The page opens and shows dark mode.
- [ ] Python runs (`hello.py`, press Run). The first run takes a few seconds to load Python.
- [ ] Switch to a C++ file (New file, choose C++) and run it.
- [ ] The **Presets** menu opens a new file with comments.
- [ ] The **Cheat sheet** opens, and **Copy to editor** works.
- [ ] **Install app** shows steps (or installs directly in Chrome or Edge).
- [ ] Open the offline dialog and press **Download offline files**, then turn on airplane mode and reload.

Send classmates the link. On iPhone they must use **Safari** to install.

---

## Part 6. Changing things later (safe routine)

1. Edit a file (for example, add a topic in `public/data/cheatsheets/python.md`).
2. Test it: `npm test` (all lines should pass), then `npm run build` and `npm start`.
3. Upload:

```
git add .
git commit -m "Add a new cheat sheet topic"
git push
```

4. Vercel redeploys in about a minute. Students see a **"A new version is ready. Reload"** message. Their saved files are never touched by updates.

### Easy things to change

| I want to... | Edit this file |
|---|---|
| Add or edit cheat sheet topics | `public/data/cheatsheets/python.md` or `cpp.md` (copy a block, follow the format in the comment at the top) |
| Add a preset | Put `name.py` and `name.cpp` in `public/data/presets/python` and `cpp`, then add a line in `public/data/presets/index.json` |
| Change colors | `public/css/tokens.css` (the only file with colors) |
| Change the run time limit | `public/js/config.js` (`runTimeoutMs`) |

`npm test` checks that every cheat sheet example and preset actually runs, so a typo in an example is caught before your classmates see it.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm` is not recognized | Reinstall Node.js, then close and reopen the terminal |
| `npm install` is very slow | Normal the first time (large packages). Wait |
| Page is blank on localhost | Run `npm run build` again, then `npm start` |
| "Python could not start" | You are probably offline on the first visit. Connect once and run any Python file |
| Changes do not show on the live site | Wait for Vercel to finish, then reload. If it still looks old, tap the "new version" message |
| A classmate lost files | Files live in their own browser. Tell them: do not use private windows, and use **Back up all files** now and then |
