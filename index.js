require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static("public"));

// --- Helper: Extract Media ---
function extractMedia(data) {
  // 1. Reddit Video
  if (data.is_video && data.media && data.media.reddit_video) {
    return {
      type: "video",
      url: data.media.reddit_video.fallback_url,
      poster: data.thumbnail,
    };
  }

  // 2. Gallery
  if (data.media_metadata && data.is_gallery) {
    const images = [];
    // Reddit galleries are not always ordered by key, so we check the gallery_data order
    const order = data.gallery_data ? data.gallery_data.items : [];

    order.forEach((item) => {
      const metadata = data.media_metadata[item.media_id];
      if (metadata && metadata.s && metadata.s.u) {
        images.push(metadata.s.u.replace(/&amp;/g, "&"));
      }
    });

    // Fallback if gallery_data is missing
    if (images.length === 0) {
      for (const key in data.media_metadata) {
        const item = data.media_metadata[key];
        if (item.s && item.s.u) images.push(item.s.u.replace(/&amp;/g, "&"));
      }
    }

    if (images.length > 0) return { type: "gallery", images };
  }

  // 3. Image
  if (
    data.post_hint === "image" ||
    (data.url && data.url.match(/\.(jpeg|jpg|gif|png)$/))
  ) {
    return { type: "image", url: data.url };
  }

  // 4. Rich Video / Iframe
  if (data.media && data.media.oembed) {
    return { type: "iframe", html: data.media.oembed.html };
  }

  return { type: "link", url: data.url, thumbnail: data.thumbnail };
}

// --- API Endpoint ---
app.get("/api/feed", async (req, res) => {
  try {
    const feedUrl = process.env.REDDIT_FEED_URL;
    const cookie = process.env.REDDIT_COOKIE; // Check for cookie in env

    if (!feedUrl)
      return res.status(500).json({ error: "Missing REDDIT_FEED_URL" });

    const afterToken = req.query.after;
    const limit = req.query.limit || 10;

    const urlObj = new URL(feedUrl);
    urlObj.searchParams.append("limit", limit);
    if (afterToken) urlObj.searchParams.append("after", afterToken);

    // Prepare Axios Configuration
    let axiosConfig = {};

    // If cookie exists, add headers to pretend to be a browser
    if (cookie) {
      axiosConfig = {
        headers: {
          Cookie: cookie,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      };
    }

    // Make request with or without headers
    const response = await axios.get(urlObj.toString(), axiosConfig);

    const data = response.data.data;

    const cleanFeed = data.children.map((post) => {
      const d = post.data;
      return {
        id: d.id,
        title: d.title,
        subreddit: d.subreddit_name_prefixed,
        author: d.author,
        score: d.score,
        num_comments: d.num_comments,
        created_utc: d.created_utc,
        media: extractMedia(d),
        permalink: `https://reddit.com${d.permalink}`,
      };
    });

    res.json({ success: true, nextPageToken: data.after, data: cleanFeed });
  } catch (error) {
    // Log more details if available
    console.error(
      "Feed Error:",
      error.response ? error.response.status : error.message
    );
    res.status(500).json({ error: "Failed to fetch feed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
