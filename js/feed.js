import { db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// imgPaths stores full Firebase Storage download URLs (with token), so they
// can be used directly as img.src with no transformation needed.

const PAGE_SIZE = 20;

const feedEl      = document.getElementById("feed");
const loadMoreBtn = document.getElementById("load-more");
const emptyState  = document.getElementById("empty-state");
const errorState  = document.getElementById("error-state");

let lastDoc = null;  // cursor for pagination

// Build a Firestore query, optionally continuing from the last loaded document.
function buildQuery() {
  const entriesRef = collection(db, "entries");
  if (lastDoc) {
    return query(entriesRef, orderBy("date", "desc"), startAfter(lastDoc), limit(PAGE_SIZE));
  }
  return query(entriesRef, orderBy("date", "desc"), limit(PAGE_SIZE));
}

// Fetch one page of posts and append them to the feed.
async function loadPage() {
  loadMoreBtn.disabled = true;

  try {
    const snapshot = await getDocs(buildQuery());

    // First load, nothing returned → show empty state.
    if (snapshot.empty && !lastDoc) {
      emptyState.hidden = false;
      loadMoreBtn.hidden = true;
      return;
    }

    for (const docSnap of snapshot.docs) {
      const article = await buildArticle(docSnap.data());
      feedEl.appendChild(article);  // docSnap.data() returns the entry fields
    }

    if (snapshot.docs.length > 0) {
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    // Hide load-more when the page is smaller than PAGE_SIZE (no more data).
    if (snapshot.docs.length < PAGE_SIZE) {
      loadMoreBtn.hidden = true;
    } else {
      loadMoreBtn.disabled = false;
    }
  } catch (err) {
    console.error("Failed to load posts:", err);
    errorState.hidden = false;
    loadMoreBtn.hidden = true;
  }
}

// Format a Firestore Timestamp for display as YYYY-MM-DD.
function formatDate(timestamp) {
  const d = timestamp.toDate();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Build an <article> element for a single entry.
async function buildArticle(entry) {
  const article = document.createElement("article");

  // Images — resolve Storage paths to download URLs at render time.
  if (entry.imgPaths && entry.imgPaths.length > 0) {
    const imageWrap = document.createElement("div");
    imageWrap.className = "post-images";

    for (const url of entry.imgPaths) {
      const img = document.createElement("img");
      img.src = url;
      img.alt = `Photo from ${formatDate(entry.date)}`;
      imageWrap.appendChild(img);
    }

    article.appendChild(imageWrap);
  }

  // Caption
  if (entry.caption) {
    const captionEl = document.createElement("p");
    captionEl.className = "entry-caption";
    captionEl.textContent = entry.caption;
    article.appendChild(captionEl);
  }

  // Date heading — date is a Firestore Timestamp.
  const dateLine = document.createElement("p");
  dateLine.className = "entry-date";
  dateLine.textContent = "{ " + entry.dayNo + " - " + formatDate(entry.date) + " }";
  article.appendChild(dateLine);

  return article;
}

// Wire up load-more button.
loadMoreBtn.addEventListener("click", loadPage);

// Initial page load.
loadPage();
