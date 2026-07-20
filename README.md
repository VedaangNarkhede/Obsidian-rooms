<div align="center">
  <img src="https://obsidian-rooms.vercel.app/favicon.ico" alt="Obsidian Rooms Logo" width="100" />
  <h1>Obsidian Rooms</h1>
  <p><b>Securely publish, sync, and share your local Obsidian vaults to the web with zero-knowledge encryption.</b></p>
  <br />
</div>

Obsidian Rooms bridges the gap between your local private vault and the web. By utilizing an official Obsidian desktop plugin alongside a high-performance Next.js dashboard, you can securely sync select notes to the cloud. Your notes are encrypted with a Master Key *locally* on your machine before they are ever transmitted, meaning your data remains completely private.

<div align="center">
  <img src="https://obsidian-rooms.vercel.app/favicon.ico" alt="Preview" width="800" style="border-radius: 8px;" />
</div>

## ✨ Features

- 🔒 **Zero-Knowledge Encryption**: Notes are encrypted locally via WebCrypto API (AES-GCM 256) before uploading. Only you (and those you share your Master Key with) can decrypt the contents.
- ⚡ **Extreme Performance**: Built on Next.js 14 (App Router). Employs `content-visibility` virtualization to ensure smooth rendering and custom 120fps GPU cursors even when viewing massive Markdown files.
- 💎 **Obsidian Native**: Flawlessly renders standard markdown alongside Obsidian-specific syntax:
  - `[[Wiki-links]]` with auto-routing
  - `>[!note]` styled callouts
  - `==Highlights==`
  - Inline and display LaTeX Math
  - Complex Mermaid diagrams
- 🚀 **1-Click Sync Plugin**: Easily calculate subgraphs and sync linked notes and image attachments directly from the Obsidian Command Palette.

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router), React 19
- **Database**: PostgreSQL (via Neon/Supabase), Prisma ORM
- **Authentication**: NextAuth.js
- **Styling**: Vanilla CSS Modules (Cosmic/Dark theme)
- **Plugin Architecture**: Obsidian Plugin API (TypeScript, esbuild)
- **Media**: Cloudinary integration for secure image attachment hosting

## 🚀 Getting Started

### 1. Environment Setup

Clone the repository and install dependencies for the web dashboard:

```bash
git clone https://github.com/your-username/obsidian-rooms.git
cd obsidian-rooms/web
npm install
```

Create a `.env` file in the `web/` directory with the following variables:

```env
# Database
DATABASE_URL="postgres://user:password@host:port/db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_secure_random_secret"

# Cloudinary (for syncing image attachments)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Encryption (Required for the Next.js decryption layer)
MASTER_KEY="your_secret_master_key"
```

### 2. Database Migration

Push the Prisma schema to your PostgreSQL database:

```bash
npm run postinstall
npx prisma db push
```

### 3. Running the Dashboard

Start the local development server:

```bash
npm run dev
```

Navigate to `http://localhost:3000` to create an account, generate your API Key, and set up a vault!

## 🔌 Installing the Obsidian Plugin

Once your dashboard is live (or running locally), follow the in-app tutorial to download the `obsidian-rooms-plugin.zip`.

1. Extract the zip file to any folder.
2. Run `install_plugin.bat` (Windows).
3. Enter the full path to your Obsidian vault when prompted.
4. Open Obsidian, go to **Settings > Community Plugins**, and enable **Obsidian Rooms**.
5. Paste your API Key in the plugin settings and start syncing!

## 📜 License

MIT License
