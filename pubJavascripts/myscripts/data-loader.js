/**
 * GitHub Pages Data Loader and Storage Manager
 * 
 * This module handles loading data from JSON files and managing
 * local storage for offline-first GitHub Pages deployment.
 */

const DataManager = (function() {
    const STORAGE_KEY = 'TTUPublication_projects';
    const STORAGE_VERSION = 1;
    
    // Initialize storage structure
    function initStorage() {
        const existing = localStorage.getItem(STORAGE_KEY);
        if (!existing) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                version: STORAGE_VERSION,
                projects: [],
                lastModified: new Date().toISOString()
            }));
        }
    }
    
    // Load original data from JSON
    async function loadOriginalData() {
        try {
            const response = await fetch('data/grants_final.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading grants data:', error);
            // Return empty array if file not found
            return [];
        }
    }
    
    // Get all projects (original + local additions)
    async function getAllProjects() {
        const original = await loadOriginalData();
        const local = getLocalProjects();
        return [...original, ...local];
    }
    
    // Get locally added projects
    function getLocalProjects() {
        initStorage();
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return data.projects || [];
    }
    
    // Add a new project to local storage
    function addProject(projectData) {
        initStorage();
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        
        // Validate required fields
        if (!projectData.code || !projectData.time || !projectData.theme || 
            !projectData.title || !projectData.authors) {
            throw new Error('Missing required fields');
        }
        
        // Add project with metadata
        const project = {
            ...projectData,
            _id: Date.now() + Math.random(),
            _addedLocally: true,
            _addedDate: new Date().toISOString()
        };
        
        data.projects.push(project);
        data.lastModified = new Date().toISOString();
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return project;
    }
    
    // Delete a locally added project
    function deleteProject(projectId) {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        data.projects = data.projects.filter(p => p._id !== projectId);
        data.lastModified = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    
    // Clear all local projects (keeps original data)
    function clearLocalProjects() {
        localStorage.removeItem(STORAGE_KEY);
        initStorage();
    }
    
    // Export local projects as JSON
    function exportProjects() {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `TTUPublication_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    // Get storage statistics
    function getStats() {
        const local = getLocalProjects();
        return {
            localProjectCount: local.length,
            storageKey: STORAGE_KEY,
            lastModified: JSON.parse(localStorage.getItem(STORAGE_KEY)).lastModified
        };
    }
    
    return {
        loadOriginalData,
        getAllProjects,
        getLocalProjects,
        addProject,
        deleteProject,
        clearLocalProjects,
        exportProjects,
        getStats
    };
})();

// Initialize storage on page load
document.addEventListener('DOMContentLoaded', function() {
    DataManager.getAllProjects().catch(err => {
        console.error('Failed to load data:', err);
    });
});
