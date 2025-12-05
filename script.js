let topics = [];
let currentFilter = 'all';
let currentSearch = '';
let currentTopic = null;

// Load topics from JSON file
async function loadTopics() {
    try {
        const response = await fetch('data/topics.json');
        topics = await response.json();
        init();
    } catch (error) {
        console.error('Error loading topics:', error);
        topics = [];
        init();
    }
}

function init() {
    renderCategories();
    renderTopics();
    loadTheme();
}

function renderCategories() {
    const categories = ['all', ...new Set(topics.map(t => t.category))];
    const container = document.getElementById('categories');
    container.innerHTML = categories.map(cat => 
        `<button class="category-btn ${cat === 'all' ? 'active' : ''}" onclick="filterByCategory('${cat}')">
            ${cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
        </button>`
    ).join('');
}

function renderTopics() {
    const filtered = topics.filter(topic => {
        const matchesCategory = currentFilter === 'all' || topic.category === currentFilter;
        const matchesSearch = currentSearch === '' || 
            topic.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
            topic.description.toLowerCase().includes(currentSearch.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const grid = document.getElementById('topicsGrid');
    
    if (filtered.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No topics found. Try a different search or category.</p>';
        return;
    }
    
    grid.innerHTML = filtered.map(topic => `
        <div class="topic-card" onclick="showDetailPage('${topic.title.replace(/'/g, "\\'")}')">
            <div class="topic-category">${topic.category}</div>
            <div class="topic-title">${topic.title}</div>
            <div class="topic-description">${topic.description}</div>
        </div>
    `).join('');
}

function filterByCategory(category) {
    currentFilter = category;
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().trim() === category.replace('-', ' '));
    });
    renderTopics();
}

function filterTopics() {
    currentSearch = document.getElementById('searchInput').value;
    renderTopics();
}

function showDetailPage(title) {
    currentTopic = topics.find(t => t.title === title);
    if (!currentTopic) return;

    document.getElementById('homePage').style.display = 'none';
    document.getElementById('detailPage').classList.add('active');

    document.getElementById('detailTitle').textContent = currentTopic.title;
    document.getElementById('detailCategory').textContent = currentTopic.category;
    document.getElementById('detailOverview').textContent = currentTopic.description;
    document.getElementById('detailExplanation').textContent = currentTopic.details;

    // Handle video
    // Handle video - only show if videoUrl exists and is not empty
const videoSection = document.getElementById('videoContainer').parentElement;
if (currentTopic.videoUrl && currentTopic.videoUrl.trim() !== '') {
    videoSection.style.display = 'block';
    const videoContainer = document.getElementById('videoContainer');
    videoContainer.innerHTML = `<iframe src="${currentTopic.videoUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
} else {
    videoSection.style.display = 'none';
}
    const examplesList = document.getElementById('detailExamples');
    examplesList.innerHTML = currentTopic.examples.map(ex => `<li>${ex}</li>`).join('');

    const resourceList = document.getElementById('resourceList');
    if (currentTopic.resources && currentTopic.resources.length > 0) {
        resourceList.innerHTML = currentTopic.resources.map(res => `
            <li class="resource-item" onclick="window.open('${res.url}', '_blank')">
                <span class="resource-icon">${res.icon}</span>
                <span>${res.title}</span>
            </li>
        `).join('');
    } else {
        resourceList.innerHTML = '<p style="color: var(--text-secondary);">No external resources available yet.</p>';
    }

    renderQuiz();
    window.scrollTo(0, 0);
}

function showHomePage() {
    document.getElementById('homePage').style.display = 'block';
    document.getElementById('detailPage').classList.remove('active');
    window.scrollTo(0, 0);
}

function renderQuiz() {
    const container = document.getElementById('quizContainer');
    if (!currentTopic.quiz || currentTopic.quiz.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary);">No practice questions available yet.</p>';
        return;
    }

    container.innerHTML = currentTopic.quiz.map((q, idx) => `
        <div class="quiz-question">
            <div class="question-text">${idx + 1}. ${q.question}</div>
            <div class="quiz-options">
                ${q.options.map((opt, optIdx) => `
                    <div class="quiz-option" onclick="selectOption(${idx}, ${optIdx})" data-question="${idx}" data-option="${optIdx}">
                        ${opt}
                    </div>
                `).join('')}
            </div>
            <button class="check-answer-btn" onclick="checkAnswer(${idx}, ${q.correct})" disabled>Check Answer</button>
            <div class="feedback" id="feedback-${idx}"></div>
        </div>
    `).join('');
}

function selectOption(questionIdx, optionIdx) {
    const options = document.querySelectorAll(`[data-question="${questionIdx}"]`);
    options.forEach((opt, idx) => {
        opt.classList.toggle('selected', idx === optionIdx);
    });
    
    const btn = options[0].parentElement.nextElementSibling;
    btn.disabled = false;
    btn.dataset.selected = optionIdx;
}

function checkAnswer(questionIdx, correctIdx) {
    const btn = event.target;
    const selectedIdx = parseInt(btn.dataset.selected);
    const options = document.querySelectorAll(`[data-question="${questionIdx}"]`);
    const feedback = document.getElementById(`feedback-${questionIdx}`);

    options.forEach((opt, idx) => {
        opt.onclick = null;
        if (idx === correctIdx) {
            opt.classList.add('correct');
        } else if (idx === selectedIdx) {
            opt.classList.add('incorrect');
        }
        opt.classList.remove('selected');
    });

    if (selectedIdx === correctIdx) {
        feedback.textContent = '✅ Correct! Well done!';
        feedback.className = 'feedback correct show';
    } else {
        feedback.textContent = '❌ Incorrect. Try reviewing the material above.';
        feedback.className = 'feedback incorrect show';
    }

    btn.disabled = true;
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
    document.getElementById('themeIcon').textContent = theme === 'dark' ? '☀️' : '🌙';
    document.getElementById('themeText').textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

// Start the app
loadTopics();