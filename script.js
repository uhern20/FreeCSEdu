let topics = [];
let currentFilter = 'all';
let currentSearch = '';
let currentTopic = null;
let currentLanguage = 'en';

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
    loadAccessibilitySettings();
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

    // Add to browser history
    history.pushState({ page: 'detail', title: title }, '', `#${encodeURIComponent(title)}`);

    document.getElementById('homePage').style.display = 'none';
    document.getElementById('detailPage').classList.add('active');

    document.getElementById('detailTitle').textContent = currentTopic.title;
    document.getElementById('detailCategory').textContent = currentTopic.category;
    document.getElementById('detailOverview').textContent = currentTopic.description;
    document.getElementById('detailExplanation').textContent = currentTopic.details;

    // Handle video - only show if videoUrl exists and is not empty
    const videoSection = document.getElementById('videoSection');
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
    // Add to browser history if not already on home
    if (window.location.hash) {
        history.pushState({ page: 'home' }, '', window.location.pathname);
    }

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

// Language selector functions
function toggleLanguageDropdown() {
    const dropdown = document.getElementById('languageDropdown');
    const btn = document.querySelector('.language-btn');
    dropdown.classList.toggle('show');
    btn.classList.toggle('active');
}

function changeLanguage(langCode, displayText) {
    currentLanguage = langCode;
    document.getElementById('currentLanguage').textContent = displayText;
    toggleLanguageDropdown();
    
    // Wait for Google Translate to load
    const maxAttempts = 10;
    let attempts = 0;
    
    const tryTranslate = setInterval(() => {
        const select = document.querySelector('.goog-te-combo');
        const iframe = document.querySelector('.goog-te-menu-frame');
        
        if (select || attempts >= maxAttempts) {
            clearInterval(tryTranslate);
            
            if (select) {
                // For English, need to actually click the restore button
                if (langCode === 'en') {
                    // Find and click the restore button
                    const restoreButton = document.querySelector('.goog-te-menu-value span:first-child');
                    if (restoreButton && document.body.classList.contains('translated-ltr')) {
                        restoreButton.click();
                    } else {
                        // Already in English or not translated yet
                        select.value = '';
                        select.dispatchEvent(new Event('change'));
                    }
                } else {
                    // Change to selected language
                    select.value = langCode;
                    select.dispatchEvent(new Event('change'));
                }
            }
        }
        attempts++;
    }, 200);
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const languageSelector = document.querySelector('.language-selector');
    if (languageSelector && !languageSelector.contains(event.target)) {
        document.getElementById('languageDropdown').classList.remove('show');
        const btn = document.querySelector('.language-btn');
        if (btn) btn.classList.remove('active');
    }
});

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.page === 'detail') {
        const title = event.state.title;
        const topic = topics.find(t => t.title === title);
        if (topic) {
            showDetailPage(title);
        }
    } else {
        showHomePage();
    }
});

// Handle page load with hash (direct links)
window.addEventListener('load', function() {
    if (window.location.hash) {
        const title = decodeURIComponent(window.location.hash.substring(1));
        const topic = topics.find(t => t.title === title);
        if (topic) {
            showDetailPage(title);
        }
    }
});

// Accessibility Functions
let accessibilitySettings = {
    fontSize: 'medium',
    highContrast: false,
    dyslexiaFont: false,
    reducedMotion: false,
    focusHighlight: false
};

function toggleAccessibilityPanel() {
    const panel = document.getElementById('accessibilityPanel');
    panel.classList.toggle('open');
}

function changeFontSize(size) {
    // Remove all font size classes - ADD xxlarge here
    document.body.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge', 'font-xxlarge');
    
    // Add selected size
    document.body.classList.add(`font-${size}`);
    
    // Update active button
    document.querySelectorAll('.font-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.size === size) {
            btn.classList.add('active');
        }
    });
    
    accessibilitySettings.fontSize = size;
    saveAccessibilitySettings();
}

function toggleHighContrast() {
    const isChecked = document.getElementById('highContrast').checked;
    document.body.classList.toggle('high-contrast', isChecked);
    accessibilitySettings.highContrast = isChecked;
    saveAccessibilitySettings();
}

function toggleDyslexiaFont() {
    const isChecked = document.getElementById('dyslexiaFont').checked;
    document.body.classList.toggle('dyslexia-font', isChecked);
    accessibilitySettings.dyslexiaFont = isChecked;
    saveAccessibilitySettings();
}

function toggleReducedMotion() {
    const isChecked = document.getElementById('reducedMotion').checked;
    document.body.classList.toggle('reduced-motion', isChecked);
    accessibilitySettings.reducedMotion = isChecked;
    saveAccessibilitySettings();
}

function toggleFocusHighlight() {
    const isChecked = document.getElementById('focusHighlight').checked;
    document.body.classList.toggle('focus-highlight', isChecked);
    accessibilitySettings.focusHighlight = isChecked;
    saveAccessibilitySettings();
}

function resetAccessibility() {
    accessibilitySettings = {
        fontSize: 'medium',
        highContrast: false,
        dyslexiaFont: false,
        reducedMotion: false,
        focusHighlight: false
    };
    
    // ADD xxlarge here too
    document.body.classList.remove('font-small', 'font-large', 'font-xlarge', 'font-xxlarge', 'high-contrast', 'dyslexia-font', 'reduced-motion', 'focus-highlight');
    document.body.classList.add('font-medium');
    
    document.getElementById('highContrast').checked = false;
    document.getElementById('dyslexiaFont').checked = false;
    document.getElementById('reducedMotion').checked = false;
    document.getElementById('focusHighlight').checked = false;
    
    document.querySelectorAll('.font-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.size === 'medium') {
            btn.classList.add('active');
        }
    });
    
    saveAccessibilitySettings();
}

function saveAccessibilitySettings() {
    localStorage.setItem('accessibilitySettings', JSON.stringify(accessibilitySettings));
}

function loadAccessibilitySettings() {
    const saved = localStorage.getItem('accessibilitySettings');
    if (saved) {
        accessibilitySettings = JSON.parse(saved);
        
        // Apply saved settings
        changeFontSize(accessibilitySettings.fontSize);
        
        if (accessibilitySettings.highContrast) {
            document.getElementById('highContrast').checked = true;
            document.body.classList.add('high-contrast');
        }
        
        if (accessibilitySettings.dyslexiaFont) {
            document.getElementById('dyslexiaFont').checked = true;
            document.body.classList.add('dyslexia-font');
        }
        
        if (accessibilitySettings.reducedMotion) {
            document.getElementById('reducedMotion').checked = true;
            document.body.classList.add('reduced-motion');
        }
        
        if (accessibilitySettings.focusHighlight) {
            document.getElementById('focusHighlight').checked = true;
            document.body.classList.add('focus-highlight');
        }
    }
}

// Close accessibility panel when clicking outside
document.addEventListener('click', function(event) {
    const panel = document.getElementById('accessibilityPanel');
    const toggleBtn = document.querySelector('.accessibility-toggle');
    
    if (panel && toggleBtn && !panel.contains(event.target) && !toggleBtn.contains(event.target)) {
        panel.classList.remove('open');
    }
});

// Load accessibility settings on page load
window.addEventListener('load', function() {
    loadAccessibilitySettings();
});

// Start the app
loadTopics();