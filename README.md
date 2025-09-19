# Cinemate - AI-Powered Movie Platform

## Overview

Cinemate AI movie platform revolutionizes movie discovery by combining artificial intelligence with an intuitive user interface. Powered by AI and TMDB's extensive database, it offers a next-generation platform for finding, exploring, and enjoying movies through natural conversation and smart recommendations. The platform features Natural Language Search, Smart Playlist Generation, AI Trailer Recommendations, AI Movie Recommendations, and intelligent AI Search Modes, creating a comprehensive and personalized movie discovery experience.

## Live Demo

### 🌐 [https://cinemate-ai-movie-platform.netlify.app](https://cinemate-ai-movie-platform.netlify.app)

> Deployed on Netlify for reliable, continuous deployment and optimal performance.

## AI-Powered Features

- 🧠 **Natural Language Search**
  - Understand complex queries like "Show me high rated mind-bending sci-fi thrillers"
  - Context-aware search processing
  - Automatic genre, year, and theme detection

- 🎯 **Smart Playlist Generation**
  - AI-curated movie collections based on themes or preferences
  - Intelligent filtering and sorting
  - Personalized recommendations based on viewing patterns

- 🎬 **AI Trailer Recommendations**
  - Smart trailer suggestions during watch parties
  - Content-aware related trailer discovery
  - Thematic and genre-based trailer matching
  - Real-time recommendations based on viewing context

- 🎥 **AI Movie Recommendations**
  - Content-based similarity analysis
  - Collaborative filtering system
  - User behavior tracking and preferences
  - Weighted recommendation merging
  - Diversity-aware suggestions

- � **Profile AI Insights**
  - Analyze your Favorites, Watch Later, and Watched lists
  - Summarize your viewing taste (vibe, pace, top genres)
  - Suggest discovery keywords
  - One-click "Generate AI Insights" with local caching to minimize API calls

- �🤖 **AI Search Modes**
  - Simple Search: Traditional keyword-based search
  - AI Search: Advanced natural language processing
  - Smart Filters: AI-powered genre and theme detection

## Core AI Implementation

### Natural Language Processing
- **Query Understanding**
  - Processes complex multi-parameter queries
  - Extracts temporal, genre, and thematic information
  - Handles fuzzy matching and synonyms

### Smart Search Algorithm
- **Multi-Stage Processing**
  ```
  User Query → Gemini AI Analysis → Parameter Extraction → TMDB API → Results Optimization
  ```
- **Fallback Mechanism**
  - Genre-based matching
  - Keyword extraction
  - Popularity-based recommendations

### AI Playlist Generation
- **Theme Analysis**
  - Understands movie themes and moods
  - Creates cohesive collections
  - Considers user preferences

## Key Features

### Movie Discovery
- 🔍 **Advanced Filtering System**
  - Genre combination filters
  - Sort by popularity, rating, release date
  - Year-based filtering
  - Multi-select genre options

### Movie Details
- 📊 **Comprehensive Information**
  - Cast and crew details
  - Similar movie recommendations
  - User reviews and ratings
  - Watch provider information (Stream/Rent/Buy)
  - Related collections
  - Official videos and trailers

### Social Features
- 🎥 **Watch Party**
  - Real-time synchronized watching
  - Peer-to-peer video synchronization
  - Chat functionality

### Additional Features
- 🌟 **Trending & Popular**
  - Daily and weekly trending movies
  - Popular movies and TV shows
  - Top-rated content

- 📱 **Responsive Design**
  - Mobile-friendly interface
  - Smooth animations
  - Infinite scrolling
  - Skeleton loaders for better UX

## Detailed Features

### Search & Discovery
- **AI Search Modes**
  - Natural language processing for complex queries
  - Traditional keyword search with filters
  - Voice input support (coming soon)

### Movie Information
- **Rich Media Content**
  - High-quality posters and backdrops
  - Trailers and video content
  - Cast photos and galleries

- **Detailed Metadata**
  - Release information
  - Production details
  - Runtime and ratings
  - Box office data

### Content Organization
- **Smart Filtering**
  - Multi-select genre filters
  - Release year range
  - Rating-based filtering
  - Multiple sort options

### Watch Options
- **Comprehensive Provider Info**
  - Streaming availability
  - Rental options
  - Purchase platforms
  - Regional availability

## Tech Stack

- **Frontend**: React, Redux Toolkit, SCSS
- **AI/ML**: Google Gemini API
- **APIs**: TMDB API
- **Real-time**: PeerJS
- **Build Tool**: Vite
- **Deployment**: Netlify

## Development

### Prerequisites
- Node.js (v14 or higher)
- npm/yarn
- Modern web browser
- API keys (TMDB, Gemini)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yashveer132/Cinemate-AI-Movie-Platform.git
cd Cinemate-AI-Movie-Platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up API Keys:

   a. **TMDB API Key**:
   - Visit [TMDB Website](https://www.themoviedb.org/)
   - Create an account and go to Settings → API
   - Generate a new API read access token

   b. **Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create or sign in to your Google account
   - Generate a new API key

4. Create a `.env` file in the root directory:
```
VITE_APP_TMDB_TOKEN=your_tmdb_token
VITE_GEMINI_API_KEY=your_gemini_api_key
```

5. Start the development server:
```bash
npm run dev
```

### Using AI Insights

Go to your Profile page. In the stats row, click "AI Insights" to scroll to the section. Click "Generate AI Insights" to run a single AI request that produces a concise taste profile and recommended titles. Results are cached in localStorage keyed to your lists, so repeated clicks won't call the AI unless your lists change.

## Architecture & Implementation

### Frontend Architecture
- Component-based structure using React
- Redux for state management
- SCSS modules for styling
- Responsive design principles

### AI Integration
- Gemini for natural language processing
- Custom middleware for API communication
- Caching and optimization layers
- Fallback search mechanisms

### Performance Features
- Dynamic imports and code splitting
- Image lazy loading and optimization
- Debounced search inputs
- Infinite scrolling implementation
- Skeleton loaders for better UX

## Project Structure

```
cinemate/
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── aiSearch/  # AI search components
│   │   ├── carousel/  # Movie carousel components
│   │   └── header/    # Navigation components
│   ├── pages/         # Route components
│   │   ├── home/      # Homepage with AI search
│   │   ├── details/   # Movie details page
│   │   └── playlist/  # AI playlist generation
│   ├── store/         # Redux state management
│   ├── utils/         # Helper functions & API
│   │   ├── api.js     # TMDB API integration
│   │   └── gemini.js  # AI integration
│   └── hooks/         # Custom React hooks
└── public/            # Static assets
```

## Future Roadmap

### Planned Features
- 🧠 **Enhanced AI Features**
  - Deep learning-based personalization
  - Multi-modal AI understanding (video, audio, text)
  - Real-time emotion-based recommendations
- 👥 Social features and friend recommendations
- 📱 Mobile application
- 🎬 Enhanced watch party features



