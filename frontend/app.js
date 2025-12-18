document.getElementById("submit").addEventListener("click", recommend);
document.getElementById("query").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.ctrlKey) {
    recommend();
  }
});

// Course icons based on keywords in title/description
function getCourseIcon(title, description) {
  const text = (title + " " + description).toLowerCase();
  
  if (text.includes("machine learning") || text.includes("ai") || text.includes("neural")) {
    return "fa-robot";
  } else if (text.includes("web") || text.includes("frontend") || text.includes("html")) {
    return "fa-globe";
  } else if (text.includes("data") || text.includes("database") || text.includes("sql")) {
    return "fa-database";
  } else if (text.includes("security") || text.includes("crypto")) {
    return "fa-shield-halved";
  } else if (text.includes("network") || text.includes("distributed")) {
    return "fa-network-wired";
  } else if (text.includes("mobile") || text.includes("android") || text.includes("ios")) {
    return "fa-mobile-screen";
  } else if (text.includes("game") || text.includes("graphics")) {
    return "fa-gamepad";
  } else if (text.includes("system") || text.includes("operating")) {
    return "fa-microchip";
  } else if (text.includes("algorithm") || text.includes("theory")) {
    return "fa-sitemap";
  } else if (text.includes("software") || text.includes("engineering")) {
    return "fa-code-branch";
  } else {
    return "fa-book";
  }
}

async function recommend() {
  const query = document.getElementById("query").value.trim();
  const count = document.getElementById("count").value;
  const resultsDiv = document.getElementById("results");

  if (!query) {
    resultsDiv.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-pencil"></i>
        <h3>Describe your interests</h3>
        <p>Tell us what you want to learn and we'll find the perfect courses for you.</p>
      </div>
    `;
    return;
  }

  // Loading state
  resultsDiv.innerHTML = `
    <div class="loading">
      <i class="fas fa-spinner"></i> Finding the best courses for you...
    </div>
  `;

  try {
    const response = await fetch("http://localhost:8000/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query,
        k: parseInt(count)
      })
    });

    if (!response.ok) {
      throw new Error("Server error");
    }

    const data = await response.json();

    resultsDiv.innerHTML = "";

    if (!data.results || data.results.length === 0) {
      resultsDiv.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <h3>No courses found</h3>
          <p>Try describing your interests differently or broaden your search.</p>
        </div>
      `;
      return;
    }

    // Calculate max score for normalization
    const maxScore = Math.max(...data.results.map(c => c.score || 1));

    data.results.forEach((course, index) => {
      const card = document.createElement("div");
      card.className = "card";
      card.style.opacity = "0";
      card.style.transform = "translateY(20px)";
      
      const icon = getCourseIcon(course.title, course.description);
      const scorePercent = Math.round(((course.score || maxScore) / maxScore) * 100);
      
      card.innerHTML = `
        <div class="card-accent"></div>
        <div class="card-content">
          <div class="card-header">
            <div class="card-icon">
              <i class="fas ${icon}"></i>
            </div>
            <div class="card-title">
              <span class="card-code">${course.code}</span>
              <h3>${course.title}</h3>
            </div>
          </div>
          <p class="card-description">${course.description}</p>
          <div class="match-score">
            <div class="score-bar">
              <div class="score-fill" style="width: 0%"></div>
            </div>
            <span class="score-text">${scorePercent}% match</span>
          </div>
        </div>
      `;
      
      resultsDiv.appendChild(card);
      
      // Animate card entrance
      setTimeout(() => {
        card.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
        
        // Animate score bar
        const scoreBar = card.querySelector(".score-fill");
        setTimeout(() => {
          scoreBar.style.width = `${scorePercent}%`;
        }, 200);
      }, index * 100);
    });

  } catch (error) {
    console.error("Error:", error);
    resultsDiv.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Connection Error</h3>
        <p>Could not connect to the recommendation server. Make sure the backend is running.</p>
      </div>
    `;
  }
}