// app.js for Peak & Progress

// Utility: simple (insecure) hashing using base64 encoding
function hashPassword(pwd) {
  return btoa(pwd);
}

// Retrieve all users from localStorage
function getUsers() {
  const users = localStorage.getItem('peakProgressUsers');
  return users ? JSON.parse(users) : {};
}

// Save users to localStorage
function saveUsers(users) {
  localStorage.setItem('peakProgressUsers', JSON.stringify(users));
}

// Get current username from localStorage
function getCurrentUsername() {
  return localStorage.getItem('peakProgressCurrentUser');
}

// Set current username in localStorage
function setCurrentUsername(username) {
  localStorage.setItem('peakProgressCurrentUser', username);
}

// Remove current username (logout)
function clearCurrentUsername() {
  localStorage.removeItem('peakProgressCurrentUser');
}

// Grade arrays
const boulderGrades = Array.from({ length: 18 }, (_, i) => `V${i}`);

const ydsGrades = [
  '5.0',
  '5.1',
  '5.2',
  '5.3',
  '5.4',
  '5.5',
  '5.6',
  '5.7',
  '5.8',
  '5.9',
  '5.10a',
  '5.10b',
  '5.10c',
  '5.10d',
  '5.11a',
  '5.11b',
  '5.11c',
  '5.11d',
  '5.12a',
  '5.12b',
  '5.12c',
  '5.12d',
  '5.13a',
  '5.13b',
  '5.13c',
  '5.13d',
  '5.14a',
  '5.14b',
  '5.14c',
  '5.14d',
  '5.15a',
  '5.15b',
  '5.15c',
  '5.15d'
];

// Chart instance placeholders for multiple charts
let progressChart = null;
let averageGradeChart = null;
let hardestGradeChart = null;
let distributionChart = null;
let averageClimbsChart = null;

document.addEventListener('DOMContentLoaded', () => {
  // DOM references
  const loginContainer = document.getElementById('loginContainer');
  const signupContainer = document.getElementById('signupContainer');
  const authDiv = document.getElementById('auth');
  const mainDiv = document.getElementById('main');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const showSignupLink = document.getElementById('showSignup');
  const showLoginLink = document.getElementById('showLogin');
  const logoutBtn = document.getElementById('logoutBtn');
  const climbForm = document.getElementById('climbForm');
  const climbTypeSelect = document.getElementById('climbType');
  const climbGradeSelect = document.getElementById('climbGrade');
  const climbAttemptsInput = document.getElementById('climbAttempts');
  const climbDateInput = document.getElementById('climbDate');
  const climbLocationSelect = document.getElementById('climbLocation');
  const addLocationBtn = document.getElementById('addLocationBtn');
  const saveLocationBtn = document.getElementById('saveLocationBtn');
  const newLocationFields = document.getElementById('newLocationFields');
  const newLocationInput = document.getElementById('newLocationInput');
  const climbNotesTextarea = document.getElementById('climbNotes');
  const climbTableBody = document.getElementById('climbTableBody');

  // Navigation and page references
  const navLinks = document.querySelectorAll('.nav-link');
  const pages = {
    home: document.getElementById('homePage'),
    history: document.getElementById('historyPage'),
    progress: document.getElementById('progressPage'),
    account: document.getElementById('accountPage')
  };
  // Account info elements
  const accountUsernameDisplay = document.getElementById('accountUsername');
  const locationListEl = document.getElementById('locationList');
  const defaultLocationDisplay = document.getElementById('defaultLocationDisplay');
  // Recent sessions table body
  const recentTableBody = document.getElementById('recentTableBody');

  // Show or hide login/signup forms
  function showLogin() {
    signupContainer.style.display = 'none';
    loginContainer.style.display = 'block';
  }
  function showSignup() {
    loginContainer.style.display = 'none';
    signupContainer.style.display = 'block';
  }
  showSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    showSignup();
  });
  showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showLogin();
  });

  // Initialize date input to today
  function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    climbDateInput.value = today;
  }

  // Populate grade options based on type
  function updateGradeOptions() {
    const type = climbTypeSelect.value;
    let options;
    if (type === 'boulder') {
      options = boulderGrades;
    } else {
      options = ydsGrades;
    }
    // Clear existing
    climbGradeSelect.innerHTML = '';
    options.forEach((g) => {
      const opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g;
      climbGradeSelect.appendChild(opt);
    });
  }

  // Render location options for current user
  function renderLocationOptions() {
    const currentUser = getCurrentUsername();
    const users = getUsers();
    climbLocationSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '-- choose --';
    climbLocationSelect.appendChild(placeholder);
    if (currentUser && users[currentUser]) {
      const { locations, defaultLocation } = users[currentUser];
      // default location first if exists
      if (defaultLocation) {
        const opt = document.createElement('option');
        opt.value = defaultLocation;
        opt.textContent = defaultLocation + ' (default)';
        climbLocationSelect.appendChild(opt);
      }
      if (Array.isArray(locations)) {
        locations.forEach((loc) => {
          if (loc !== defaultLocation) {
            const opt = document.createElement('option');
            opt.value = loc;
            opt.textContent = loc;
            climbLocationSelect.appendChild(opt);
          }
        });
      }
    }
  }

  // Save new location for user
  function saveNewLocation() {
    const newLoc = newLocationInput.value.trim();
    if (!newLoc) return;
    const currentUser = getCurrentUsername();
    const users = getUsers();
    if (currentUser && users[currentUser]) {
      const user = users[currentUser];
      if (!user.locations) user.locations = [];
      if (!user.locations.includes(newLoc)) {
        user.locations.push(newLoc);
      }
      // If no default location, set this as default
      if (!user.defaultLocation) {
        user.defaultLocation = newLoc;
      }
      saveUsers(users);
      renderLocationOptions();
    }
    newLocationInput.value = '';
    newLocationFields.style.display = 'none';
  }

  // Create user and save
  function createUser(username, password) {
    const users = getUsers();
    if (users[username]) {
      alert('Username already exists');
      return false;
    }
    users[username] = {
      password: hashPassword(password),
      logs: [],
      locations: [],
      defaultLocation: ''
    };
    saveUsers(users);
    return true;
  }

  // Authenticate user
  function authenticateUser(username, password) {
    const users = getUsers();
    if (!users[username]) return false;
    return users[username].password === hashPassword(password);
  }

  // Refresh climb table
  function renderClimbTable() {
    const currentUser = getCurrentUsername();
    const users = getUsers();
    climbTableBody.innerHTML = '';
    if (!currentUser || !users[currentUser]) return;
    const { logs } = users[currentUser];
    logs
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((log) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${log.date}</td>
          <td>${log.type}</td>
          <td>${log.grade}</td>
          <td>${log.attempts}</td>
          <td>${log.location || ''}</td>
          <td>${log.notes || ''}</td>
        `;
        climbTableBody.appendChild(tr);
      });
  }

  // Render recent sessions (last 5 entries) in the home page
  function renderRecentSessions() {
    const currentUser = getCurrentUsername();
    const users = getUsers();
    // Clear table
    recentTableBody.innerHTML = '';
    if (!currentUser || !users[currentUser]) return;
    const logs = users[currentUser].logs;
    if (!logs || logs.length === 0) return;
    // Sort logs descending by date
    const sorted = logs.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    const latest = sorted.slice(0, 5);
    latest.forEach((log) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${log.date}</td>
        <td>${log.type}</td>
        <td>${log.grade}</td>
        <td>${log.attempts}</td>
        <td>${log.location || ''}</td>
        <td>${log.notes || ''}</td>
      `;
      recentTableBody.appendChild(tr);
    });
  }

  // Render account information including saved locations and default location
  function renderAccountInfo() {
    const currentUser = getCurrentUsername();
    const users = getUsers();
    if (!currentUser || !users[currentUser]) return;
    accountUsernameDisplay.textContent = currentUser;
    // Clear list
    locationListEl.innerHTML = '';
    const { locations, defaultLocation } = users[currentUser];
    if (Array.isArray(locations) && locations.length > 0) {
      locations.forEach((loc) => {
        const li = document.createElement('li');
        li.textContent = loc;
        if (defaultLocation === loc) {
          const badge = document.createElement('span');
          badge.textContent = ' (default)';
          badge.style.color = '#2f855a';
          li.appendChild(badge);
        } else {
          const setBtn = document.createElement('button');
          setBtn.textContent = 'Set Default';
          setBtn.className = 'secondary small';
          setBtn.addEventListener('click', () => {
            users[currentUser].defaultLocation = loc;
            saveUsers(users);
            renderLocationOptions();
            renderAccountInfo();
          });
          li.appendChild(document.createTextNode(' '));
          li.appendChild(setBtn);
        }
        locationListEl.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.textContent = 'No locations saved.';
      locationListEl.appendChild(li);
    }
    defaultLocationDisplay.textContent = defaultLocation || 'None';
  }

  // Show specified page and update navigation active state
  function showPage(pageName) {
    Object.keys(pages).forEach((key) => {
      pages[key].style.display = key === pageName ? 'block' : 'none';
    });
    navLinks.forEach((btn) => {
      if (btn.getAttribute('data-page') === pageName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    // Render dynamic content on page switch
    if (pageName === 'home') {
      renderRecentSessions();
    } else if (pageName === 'history') {
      renderClimbTable();
    } else if (pageName === 'progress') {
      updateAllChartsAndMetrics();
    } else if (pageName === 'account') {
      renderAccountInfo();
    }
  }

  // Convert grade to a unified numeric index across both grading systems
  function gradeToUnifiedIndex(grade) {
    if (grade.startsWith('V')) {
      // boulder grade
      const num = parseInt(grade.substring(1), 10);
      return num;
    } else {
      const idx = ydsGrades.indexOf(grade);
      if (idx >= 0) {
        return boulderGrades.length + idx;
      }
    }
    return 0;
  }

  // Convert unified numeric index back to grade string
  function unifiedIndexToGrade(index) {
    if (index < boulderGrades.length) {
      return boulderGrades[index];
    }
    const ydsIndex = index - boulderGrades.length;
    return ydsGrades[ydsIndex] || '';
  }

  // Render summary metrics into the metrics section
  function renderSummaryMetrics(logs) {
    const metricsContainer = document.getElementById('metricsContainer');
    metricsContainer.innerHTML = '';
    if (!logs || logs.length === 0) {
      metricsContainer.textContent = 'No climbs logged yet.';
      return;
    }
    // Total climbs
    const totalClimbs = logs.length;
    // Unique session dates
    const sessionDates = Array.from(new Set(logs.map((l) => l.date)));
    const totalSessions = sessionDates.length;
    // Hardest grade
    let hardestIndex = 0;
    let hardestGradeString = '';
    logs.forEach((log) => {
      const idx = gradeToUnifiedIndex(log.grade);
      if (idx > hardestIndex) {
        hardestIndex = idx;
        hardestGradeString = log.grade;
      }
    });
    // Average climbs per session overall
    const avgClimbsPerSession = (totalClimbs / totalSessions).toFixed(2);
    // Average climbs per session type: boulder vs ropes
    let boulderCounts = 0;
    let ropeCounts = 0;
    // Count sessions of each type
    const sessionsByDate = {};
    sessionDates.forEach((d) => {
      sessionsByDate[d] = { boulder: 0, ropes: 0 };
    });
    logs.forEach((log) => {
      const date = log.date;
      const isRope = log.type === 'top-rope' || log.type === 'lead' || log.type === 'trad';
      if (isRope) {
        sessionsByDate[date].ropes += 1;
      } else if (log.type === 'boulder') {
        sessionsByDate[date].boulder += 1;
      }
    });
    sessionDates.forEach((d) => {
      boulderCounts += sessionsByDate[d].boulder;
      ropeCounts += sessionsByDate[d].ropes;
    });
    const avgBoulder = totalSessions > 0 ? (boulderCounts / totalSessions).toFixed(2) : '0';
    const avgRope = totalSessions > 0 ? (ropeCounts / totalSessions).toFixed(2) : '0';
    // Prepare metrics items
    const metrics = [
      { title: 'Total Climbs', value: totalClimbs },
      { title: 'Total Sessions', value: totalSessions },
      { title: 'Hardest Grade', value: hardestGradeString },
      { title: 'Avg Climbs/Session', value: avgClimbsPerSession },
      { title: 'Avg Boulder/Session', value: avgBoulder },
      { title: 'Avg Ropes/Session', value: avgRope }
    ];
    metrics.forEach((metric) => {
      const item = document.createElement('div');
      item.className = 'metric-item';
      const titleEl = document.createElement('h4');
      titleEl.textContent = metric.title;
      const valueEl = document.createElement('p');
      valueEl.textContent = metric.value;
      item.appendChild(titleEl);
      item.appendChild(valueEl);
      metricsContainer.appendChild(item);
    });
  }

  // Update all charts and summary metrics
  function updateAllChartsAndMetrics() {
    const currentUser = getCurrentUsername();
    const users = getUsers();
    if (!currentUser || !users[currentUser]) return;
    const logs = users[currentUser].logs;
    // Render summary metrics
    renderSummaryMetrics(logs);
    // If no logs, clear charts
    if (!logs || logs.length === 0) {
      if (progressChart) progressChart.destroy();
      if (averageGradeChart) averageGradeChart.destroy();
      if (hardestGradeChart) hardestGradeChart.destroy();
      if (distributionChart) distributionChart.destroy();
      if (averageClimbsChart) averageClimbsChart.destroy();
      return;
    }
    // Compute unique dates sorted and total sessions
    // Each unique date represents a session day. We need this for per-session averages.
    const sessionDateSet = new Set(logs.map((log) => log.date));
    const dates = Array.from(sessionDateSet).sort();
    const totalSessions = dates.length;
    // Types and colors (earthy palette)
    const types = ['boulder', 'top-rope', 'lead', 'trad'];
    const typeColors = {
      'boulder': '#2f855a',
      'top-rope': '#50806b',
      'lead': '#836953',
      'trad': '#d69e2e'
    };
    // Data for progress chart: counts per date per type
    const progressDatasets = types.map((type) => {
      const data = dates.map((d) => 0);
      logs.forEach((log) => {
        if (log.type === type) {
          const idx = dates.indexOf(log.date);
          if (idx >= 0) data[idx] += 1;
        }
      });
      return {
        label: type,
        data,
        borderColor: typeColors[type],
        backgroundColor: typeColors[type] + '33',
        fill: false,
        tension: 0.1
      };
    });
    // Destroy previous progress chart
    if (progressChart) progressChart.destroy();
    const ctx1 = document.getElementById('progressChart').getContext('2d');
    progressChart = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: dates,
        datasets: progressDatasets
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Number of Climbs' }
          },
          x: {
            title: { display: true, text: 'Date' }
          }
        }
      }
    });
    // Data for average grade and hardest grade per date
    const avgGradeData = [];
    const hardGradeData = [];
    dates.forEach((d) => {
      const dayLogs = logs.filter((log) => log.date === d);
      let totalIndex = 0;
      let maxIndex = 0;
      dayLogs.forEach((log) => {
        const idx = gradeToUnifiedIndex(log.grade);
        totalIndex += idx;
        if (idx > maxIndex) maxIndex = idx;
      });
      const avgIndex = totalIndex / dayLogs.length;
      avgGradeData.push(avgIndex);
      hardGradeData.push(maxIndex);
    });
    // Destroy previous charts if any
    if (averageGradeChart) averageGradeChart.destroy();
    const ctx2 = document.getElementById('averageGradeChart').getContext('2d');
    averageGradeChart = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Average Grade',
            data: avgGradeData,
            borderColor: '#2f855a',
            backgroundColor: '#2f855a33',
            fill: false,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return unifiedIndexToGrade(Math.round(value));
              }
            },
            title: { display: true, text: 'Grade' }
          },
          x: {
            title: { display: true, text: 'Date' }
          }
        }
      }
    });
    if (hardestGradeChart) hardestGradeChart.destroy();
    const ctx3 = document.getElementById('hardestGradeChart').getContext('2d');
    hardestGradeChart = new Chart(ctx3, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [
          {
            label: 'Hardest Grade',
            data: hardGradeData,
            borderColor: '#836953',
            backgroundColor: '#83695333',
            fill: false,
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return unifiedIndexToGrade(Math.round(value));
              }
            },
            title: { display: true, text: 'Grade' }
          },
          x: {
            title: { display: true, text: 'Date' }
          }
        }
      }
    });
    // Distribution of climbs by type (doughnut)
    const typeCounts = { boulder: 0, 'top-rope': 0, lead: 0, trad: 0 };
    logs.forEach((log) => {
      typeCounts[log.type] += 1;
    });
    const distributionData = types.map((t) => typeCounts[t]);
    if (distributionChart) distributionChart.destroy();
    const ctx4 = document.getElementById('distributionChart').getContext('2d');
    distributionChart = new Chart(ctx4, {
      type: 'doughnut',
      data: {
        labels: types,
        datasets: [
          {
            data: distributionData,
            backgroundColor: types.map((t) => typeColors[t]),
            borderColor: '#ffffff',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right' }
        }
      }
    });
    // Average climbs per session type (bar chart)
    // Compute average number of boulder and rope climbs per session
    const avgBould = totalSessions > 0 ? typeCounts['boulder'] / totalSessions : 0;
    const ropesCount = typeCounts['top-rope'] + typeCounts['lead'] + typeCounts['trad'];
    const avgRopePerSession = totalSessions > 0 ? ropesCount / totalSessions : 0;
    if (averageClimbsChart) averageClimbsChart.destroy();
    const ctx5 = document.getElementById('averageClimbsChart').getContext('2d');
    averageClimbsChart = new Chart(ctx5, {
      type: 'bar',
      data: {
        labels: ['Boulder', 'Ropes'],
        datasets: [
          {
            label: 'Avg Climbs per Session',
            // Provide numeric values directly; Chart.js will handle formatting
            data: [avgBould, avgRopePerSession],
            backgroundColor: ['#2f855a', '#836953']
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Average Climbs' }
          },
          x: {
            title: { display: true, text: 'Session Type' }
          }
        }
      }
    });
  }

  // Log out user
  function logoutUser() {
    clearCurrentUsername();
    authDiv.style.display = 'block';
    mainDiv.style.display = 'none';
    setTodayDate();
    showLogin();
  }

  // After login or signup, load app
  function loadApp() {
    authDiv.style.display = 'none';
    mainDiv.style.display = 'block';
    setTodayDate();
    updateGradeOptions();
    renderLocationOptions();
    // Show home page by default on login and populate content
    showPage('home');
    renderAccountInfo();
  }

  // Attempt to auto-login if current user exists
  function init() {
    const currentUser = getCurrentUsername();
    if (currentUser) {
      // ensure user still exists
      const users = getUsers();
      if (users[currentUser]) {
        loadApp();
        return;
      } else {
        clearCurrentUsername();
      }
    }
    // Show auth by default
    authDiv.style.display = 'block';
    mainDiv.style.display = 'none';
    setTodayDate();
    showLogin();
  }

  // Event listeners
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (authenticateUser(username, password)) {
      setCurrentUsername(username);
      loadApp();
    } else {
      alert('Invalid username or password');
    }
  });

  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('signupUsername').value.trim();
    const password = document.getElementById('signupPassword').value;
    if (!username || !password) {
      alert('Please provide username and password');
      return;
    }
    if (createUser(username, password)) {
      alert('Account created! Please log in.');
      showLogin();
    }
  });

  logoutBtn.addEventListener('click', () => {
    logoutUser();
  });

  climbTypeSelect.addEventListener('change', () => {
    updateGradeOptions();
  });

  addLocationBtn.addEventListener('click', () => {
    newLocationFields.style.display = 'flex';
  });

  saveLocationBtn.addEventListener('click', () => {
    saveNewLocation();
  });

  climbForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const type = climbTypeSelect.value;
    const grade = climbGradeSelect.value;
    const attempts = parseInt(climbAttemptsInput.value, 10);
    const date = climbDateInput.value;
    const location = climbLocationSelect.value || '';
    const notes = climbNotesTextarea.value.trim();
    if (!type || !grade || !attempts || !date) {
      alert('Please complete the form.');
      return;
    }
    const currentUser = getCurrentUsername();
    if (!currentUser) return;
    const users = getUsers();
    const user = users[currentUser];
    user.logs.push({ type, grade, attempts, date, location, notes });
    saveUsers(users);
    // Clear notes and set default attempts to 1
    climbAttemptsInput.value = 1;
    climbNotesTextarea.value = '';
    setTodayDate();
    renderClimbTable();
    updateAllChartsAndMetrics();
    // Update recent sessions list on home page
    renderRecentSessions();
  });

  // Navigation link handlers
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const page = link.getAttribute('data-page');
      showPage(page);
    });
  });

  // Initialize
  init();
});