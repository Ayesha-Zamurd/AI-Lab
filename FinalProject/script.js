

// DOM Elements
const inputOptions = document.querySelectorAll('.input-option');
const textInput = document.querySelector('.text-input');
const fileUpload = document.querySelector('.file-upload');
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const analyzeBtn = document.getElementById('analyzeBtn');
const projectText = document.getElementById('projectText');
const charCount = document.getElementById('charCount');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultsSection = document.getElementById('resultsSection');
const emptyState = document.getElementById('emptyState');
const riskLevel = document.getElementById('riskLevel');
const successScore = document.getElementById('successScore');
const riskExplanation = document.getElementById('riskExplanation');
const detailedAnalysis = document.getElementById('detailedAnalysis');
const historyList = document.getElementById('historyList');
const deleteAllBtn = document.getElementById('deleteAllBtn');
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const closeSidebar = document.getElementById('closeSidebar');
const overlay = document.getElementById('overlay');
const newChatBtn = document.getElementById('newChatBtn');
const mainContent = document.getElementById('mainContent');

// Charts
let riskCategoriesChart, successProbabilityChart;

// Sidebar state
let isSidebarOpen = false;


const API_URL = 'http://127.0.0.1:5000/predict-risk';  // ✅ Change 5005 to 5000

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadHistory();
    showEmptyState();
    
    // Update character count
    projectText.addEventListener('input', updateCharCount);
    updateCharCount();
    
    // Check screen size and adjust sidebar - Start with sidebar closed
    checkScreenSize();
    closeSidebarFunc();
    window.addEventListener('resize', checkScreenSize);
});

function checkScreenSize() {
    if (window.innerWidth <= 1200) {
        closeSidebarFunc();
    } else {
        closeSidebarFunc();
    }
}

function setupEventListeners() {
    // Input option toggle
    inputOptions.forEach(option => {
        option.addEventListener('click', function() {
            inputOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            
            const inputType = this.getAttribute('data-input');
            if (inputType === 'text') {
                textInput.classList.add('active');
                fileUpload.classList.remove('active');
            } else {
                textInput.classList.remove('active');
                fileUpload.classList.add('active');
            }
        });
    });
    
    // File upload
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = '#4361ee';
        this.style.backgroundColor = 'rgba(67, 97, 238, 0.05)';
    });
    
    uploadArea.addEventListener('dragleave', function() {
        this.style.borderColor = '#e9ecef';
        this.style.backgroundColor = 'rgba(248, 249, 250, 0.7)';
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = '#e9ecef';
        this.style.backgroundColor = 'rgba(248, 249, 250, 0.7)';
        
        if (e.dataTransfer.files.length) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', function() {
        if (this.files.length) {
            handleFileSelection(this.files[0]);
        }
    });
    
    // Analyze button - NOW CALLS REAL API
    analyzeBtn.addEventListener('click', analyzeProject);
    
    // Delete all history
    deleteAllBtn.addEventListener('click', deleteAllHistory);
    
    // Sidebar toggle
    sidebarToggle.addEventListener('click', toggleSidebar);
    closeSidebar.addEventListener('click', closeSidebarFunc);
    overlay.addEventListener('click', closeSidebarFunc);
    
    // New chat button - Auto close sidebar when clicked
    newChatBtn.addEventListener('click', function() {
        startNewAnalysis();
        closeSidebarFunc();
    });
}

function toggleSidebar() {
    if (isSidebarOpen) {
        closeSidebarFunc();
    } else {
        openSidebarFunc();
    }
}

function openSidebarFunc() {
    sidebar.classList.remove('closed');
    overlay.classList.add('active');
    mainContent.classList.remove('sidebar-closed');
    isSidebarOpen = true;
}

function closeSidebarFunc() {
    sidebar.classList.add('closed');
    overlay.classList.remove('active');
    mainContent.classList.add('sidebar-closed');
    isSidebarOpen = false;
}

function startNewAnalysis() {
    // Clear input fields with animation
    projectText.style.transform = 'scale(0.95)';
    projectText.style.opacity = '0.7';
    
    setTimeout(() => {
        projectText.value = '';
        projectText.style.transform = 'scale(1)';
        projectText.style.opacity = '1';
    }, 300);
    
    fileInput.value = '';
    fileName.textContent = '';
    fileName.classList.remove('active');
    
    // Show empty state with animation
    showEmptyState();
    
    updateCharCount();
    
    showNotification('New analysis started', 'info');
}

function updateCharCount() {
    charCount.textContent = projectText.value.length;
}

function handleFileSelection(file) {
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (!allowedTypes.includes(file.type)) {
        showNotification('Please select a PDF, DOCX, or PPTX file.', 'error');
        return;
    }
    
    fileName.textContent = `Selected file: ${file.name}`;
    fileName.classList.add('active');
    
    // Add animation
    fileName.style.animation = 'bounceIn 0.6s ease-out';
    setTimeout(() => {
        fileName.style.animation = '';
    }, 600);
}

// MAIN FIX: This function now calls the actual Flask API
async function analyzeProject() {
    const activeInput = document.querySelector('.input-option.active').getAttribute('data-input');
    let projectContent = '';
    
    if (activeInput === 'text') {
        projectContent = projectText.value.trim();
        if (!projectContent) {
            showNotification('Please enter a project description.', 'error');
            return;
        }
        
        // Basic validation on frontend
        if (projectContent.length < 20) {
            showNotification('Please provide a more detailed project description (at least 20 characters).', 'error');
            return;
        }
    } else {
        if (!fileInput.files.length) {
            showNotification('Please select a file to upload.', 'error');
            return;
        }
        showNotification('File upload requires additional backend setup. Please use text input for now.', 'info');
        return;
    }
    
    // Show loading indicator with animation
    loadingIndicator.classList.add('active');
    resultsSection.classList.remove('active');
    emptyState.style.display = 'none';
    
    // Add loading animation to analyze button
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Analyzing...</span>';
    analyzeBtn.disabled = true;
    
    try {
        console.log('🔄 Sending request to Flask server...');
        console.log('Project content:', projectContent.substring(0, 100));
        
        // Call the actual Flask API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input: projectContent
            })
        });
        
        console.log('📨 Response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Response received:', data);
        
        // Success - display the analysis
        displayResults(data);
        
        // Add to history
        addToHistory(projectContent, data);
        
        showNotification('Risk analysis completed successfully!', 'success');
        
        // Auto close sidebar after analysis
        closeSidebarFunc();
        
    } catch (error) {
        console.error('❌ API call failed:', error);
        
        // More specific error messages
        if (error.message.includes('Failed to fetch')) {
            showNotification('Cannot connect to server. Make sure Flask is running on http://127.0.0.1:5000', 'error');
        } else if (error.message.includes('HTTP error')) {
            showNotification(`Server error: ${error.message}`, 'error');
        } else {
            showNotification(`Analysis failed: ${error.message}`, 'error');
        }
        
        showEmptyState();
    } finally {
        // Hide loading indicator
        loadingIndicator.classList.remove('active');
        
        // Reset analyze button
        analyzeBtn.innerHTML = '<i class="fas fa-chart-line"></i><span>Analyze Risk</span>';
        analyzeBtn.disabled = false;
    }
}

function displayResults(analysis) {
    // Handle both response formats (structured data or raw response)
    if (analysis.response) {
        // If it's a raw response from AI, display it in detailed analysis
        detailedAnalysis.innerHTML = `
            <div class="risk-item">
                <div class="risk-category">
                    <div class="risk-category-name">AI Analysis</div>
                </div>
                <p>${analysis.response}</p>
            </div>
        `;
        
        // Set default values for charts
        riskLevel.textContent = "Analysis Complete";
        riskLevel.className = `risk-level risk-medium`;
        successScore.textContent = `N/A`;
        riskExplanation.textContent = "See detailed analysis below for AI assessment.";
        
        // Create default charts
        createDefaultCharts();
        
    } else if (analysis.error) {
        // Handle error response
        showNotification(analysis.error, 'error');
        showEmptyState();
        return;
        
    } else {
        // Handle structured JSON response
        riskLevel.textContent = analysis.risk_level || "Analysis Complete";
        riskLevel.className = `risk-level ${getRiskColorClass(analysis.risk_level)}`;
        successScore.textContent = `${analysis.success_probability || 0}%`;
        riskExplanation.textContent = analysis.risk_explanation || "Analysis completed successfully.";
        
        // Create risk categories chart
        if (analysis.risk_categories) {
            createRiskCategoriesChart(analysis.risk_categories);
        } else {
            createDefaultCharts();
        }
        
        // Create success probability chart
        createSuccessProbabilityChart(analysis.success_probability || 50);
        
        // Display detailed analysis
        if (analysis.detailed_analysis && Array.isArray(analysis.detailed_analysis)) {
            displayDetailedAnalysis(analysis.detailed_analysis);
        } else {
            detailedAnalysis.innerHTML = `
                <div class="risk-item">
                    <p>${analysis.risk_explanation || "Detailed analysis completed."}</p>
                </div>
            `;
        }
    }
    
    // Show results section
    resultsSection.classList.add('active');
    emptyState.style.display = 'none';
}

function getRiskColorClass(riskLevel) {
    if (!riskLevel) return 'risk-medium';
    
    const level = riskLevel.toLowerCase();
    if (level.includes('high')) return 'risk-high';
    if (level.includes('medium')) return 'risk-medium';
    if (level.includes('low')) return 'risk-low';
    return 'risk-medium';
}

function createRiskCategoriesChart(riskCategories) {
    const riskCtx = document.getElementById('riskCategoriesChart').getContext('2d');
    if (riskCategoriesChart) riskCategoriesChart.destroy();
    
    const labels = Object.keys(riskCategories);
    const data = Object.values(riskCategories);
    
    // Green shades for charts
    const greenShades = [
        'rgba(188, 234, 213, 0.8)',   // --c1
        'rgba(158, 213, 197, 0.8)',   // --c2  
        'rgba(142, 195, 176, 0.8)',   // --c3
        'rgba(107, 168, 149, 0.8)',   // primary-dark
        'rgba(122, 184, 165, 0.8)'    // secondary
    ];
    
    const greenBorders = [
        'rgba(188, 234, 213, 1)',
        'rgba(158, 213, 197, 1)',
        'rgba(142, 195, 176, 1)',
        'rgba(107, 168, 149, 1)',
        'rgba(122, 184, 165, 1)'
    ];
    
    riskCategoriesChart = new Chart(riskCtx, {
        type: 'bar',
        data: {
            labels: labels.map(label => label.charAt(0).toUpperCase() + label.slice(1)),
            datasets: [{
                label: 'Risk Level (%)',
                data: data,
                backgroundColor: greenShades,
                borderColor: greenBorders,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Risk Level (%)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function createSuccessProbabilityChart(successProbability) {
    const successCtx = document.getElementById('successProbabilityChart').getContext('2d');
    if (successProbabilityChart) successProbabilityChart.destroy();
    
    successProbabilityChart = new Chart(successCtx, {
        type: 'doughnut',
        data: {
            labels: ['Success', 'Risk'],
            datasets: [{
                data: [successProbability, 100 - successProbability],
                backgroundColor: [
                    'rgba(142, 195, 176, 0.8)',  // --c3 for success
                    'rgba(230, 126, 126, 0.8)'   // danger color for risk
                ],
                borderColor: [
                    'rgba(142, 195, 176, 1)',
                    'rgba(230, 126, 126, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.raw.toFixed(1) + '%';
                        }
                    }
                }
            }
        }
    });
}

function createDefaultCharts() {
    const riskCtx = document.getElementById('riskCategoriesChart').getContext('2d');
    if (riskCategoriesChart) riskCategoriesChart.destroy();
    
    riskCategoriesChart = new Chart(riskCtx, {
        type: 'bar',
        data: {
            labels: ['Technical', 'Financial', 'Timeline', 'Resources', 'Market'],
            datasets: [{
                label: 'Risk Level (%)',
                data: [50, 50, 50, 50, 50],
                backgroundColor: 'rgba(142, 195, 176, 0.3)',
                borderColor: 'rgba(142, 195, 176, 0.8)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    
    const successCtx = document.getElementById('successProbabilityChart').getContext('2d');
    if (successProbabilityChart) successProbabilityChart.destroy();
    
    successProbabilityChart = new Chart(successCtx, {
        type: 'doughnut',
        data: {
            labels: ['Analysis', 'Pending'],
            datasets: [{
                data: [100, 0],
                backgroundColor: [
                    'rgba(142, 195, 176, 0.7)',
                    'rgba(200, 200, 200, 0.3)'
                ]
            }]
        }
    });
}

function displayDetailedAnalysis(analysisItems) {
    detailedAnalysis.innerHTML = '';
    
    if (Array.isArray(analysisItems)) {
        analysisItems.forEach((item, index) => {
            const riskItem = document.createElement('div');
            riskItem.className = 'risk-item';
            riskItem.style.animationDelay = `${index * 0.1}s`;
            
            let riskColor = getRiskColorClass(item.risk_level || item.risk);
            
            riskItem.innerHTML = `
                <div class="risk-category">
                    <div class="risk-category-name">${item.category || 'Risk Category'}</div>
                    <span class="history-risk ${riskColor}">${item.risk_level || item.risk || 'Unknown'} Risk (${item.value || 'N/A'}%)</span>
                </div>
                <p>${item.explanation || 'No detailed explanation available.'}</p>
            `;
            detailedAnalysis.appendChild(riskItem);
        });
    }
}

function addToHistory(projectContent, analysis) {
    // Create a short summary for history
    const summary = generateSummary(projectContent);
    
    // Create history item
    const historyItem = {
        id: Date.now(),
        project: summary,
        fullProject: projectContent,
        riskLevel: analysis.risk_level || "Analysis Complete",
        riskColor: getRiskColorClass(analysis.risk_level),
        timestamp: new Date().toISOString(),
        fullAnalysis: analysis
    };
    
    // Get existing history
    let history = JSON.parse(localStorage.getItem('projectRiskHistory') || '[]');
    
    // Add new item to beginning
    history.unshift(historyItem);
    
    // Keep only last 10 items
    if (history.length > 10) {
        history = history.slice(0, 10);
    }
    
    // Save to localStorage
    localStorage.setItem('projectRiskHistory', JSON.stringify(history));
    
    // Refresh history display
    loadHistory();
}

function generateSummary(projectContent) {
    if (projectContent.length <= 50) {
        return projectContent;
    }
    
    let summary = projectContent.substring(0, 50);
    const lastSpace = summary.lastIndexOf(' ');
    const lastPeriod = summary.lastIndexOf('.');
    const lastComma = summary.lastIndexOf(',');
    
    const breakPoint = Math.max(lastSpace, lastPeriod, lastComma);
    
    if (breakPoint > 30) {
        summary = projectContent.substring(0, breakPoint);
    }
    
    return summary + '...';
}

function loadHistory() {
    const history = JSON.parse(localStorage.getItem('projectRiskHistory') || '[]');
    
    if (history.length === 0) {
        historyList.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.5);">
                <i class="fas fa-history" style="font-size: 2rem; margin-bottom: 10px;"></i>
                <p>No analysis history yet</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = '';
    
    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.setAttribute('data-id', item.id);
        
        historyItem.innerHTML = `
            <div class="history-content">
                <div class="history-project" data-tooltip="${item.fullProject}">${item.project}</div>
            </div>
            <div class="history-actions">
                <button class="delete-history-btn" title="Delete this analysis">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        // Clicking the item loads the analysis AND auto-closes sidebar
        historyItem.addEventListener('click', (e) => {
            if (!e.target.closest('.delete-history-btn')) {
                displayResults(item.fullAnalysis);
                showNotification('Previous analysis loaded', 'info');
                
                // Auto close sidebar when history item is clicked
                closeSidebarFunc();
            }
        });
        
        // Delete button functionality
        const deleteBtn = historyItem.querySelector('.delete-history-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteHistoryItem(item.id);
        });
        
        // Add tooltip functionality
        const projectElement = historyItem.querySelector('.history-project');
        projectElement.addEventListener('mouseenter', showTooltip);
        projectElement.addEventListener('mouseleave', hideTooltip);
        
        historyList.appendChild(historyItem);
    });
}

// Tooltip functions
function showTooltip(e) {
    const tooltipText = e.target.getAttribute('data-tooltip');
    if (!tooltipText) return;
    
    // Remove existing tooltip
    const existingTooltip = document.querySelector('.history-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'history-tooltip';
    tooltip.textContent = tooltipText;
    
    // Position tooltip
    const rect = e.target.getBoundingClientRect();
    tooltip.style.position = 'fixed';
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.top - 10) + 'px';
    tooltip.style.transform = 'translateY(-100%)';
    
    document.body.appendChild(tooltip);
}

function hideTooltip() {
    const tooltip = document.querySelector('.history-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

function deleteHistoryItem(id) {
    let history = JSON.parse(localStorage.getItem('projectRiskHistory') || '[]');
    history = history.filter(item => item.id !== id);
    localStorage.setItem('projectRiskHistory', JSON.stringify(history));
    loadHistory();
    showNotification('Analysis deleted from history', 'info');
}

function deleteAllHistory() {
    if (confirm('Are you sure you want to delete all analysis history? This action cannot be undone.')) {
        localStorage.removeItem('projectRiskHistory');
        loadHistory();
        showNotification('All history deleted', 'info');
    }
}

function showEmptyState() {
    resultsSection.classList.remove('active');
    loadingIndicator.classList.remove('active');
    emptyState.style.display = 'block';
}

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles for notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
        max-width: 400px;
        backdrop-filter: blur(10px);
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Add CSS for notification animations and tooltip
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    .history-tooltip {
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.8rem;
        max-width: 300px;
        word-wrap: break-word;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
    }
    
    .history-tooltip::before {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 10px;
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 5px solid rgba(0, 0, 0, 0.8);
    }
    
    .history-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-bottom: 8px;
        position: relative;
        overflow: hidden;
    }
    
    .history-content {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
    }
    
    .history-project {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.9rem;
        min-width: 0;
    }
    
    .history-actions {
        display: flex !important;
        gap: 8px;
        opacity: 1 !important;
        visibility: visible !important;
        margin-left: 10px;
    }
    
    .delete-history-btn {
        background: rgba(230, 57, 70, 0.2);
        border: none;
        color: var(--danger);
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.8rem;
        width: 32px;
        height: 32px;
        display: flex !important;
        align-items: center;
        justify-content: center;
        visibility: visible !important;
        opacity: 1 !important;
    }
    
    .delete-history-btn:hover {
        background: rgba(230, 57, 70, 0.3);
        transform: scale(1.1);
    }
`;
document.head.appendChild(style);