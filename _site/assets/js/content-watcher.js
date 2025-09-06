/**
 * Content Watcher - Detects changes in blog content and updates UI
 */
class ContentWatcher {
  constructor(options = {}) {
    this.checkInterval = options.checkInterval || 30000; // 30 seconds
    this.lastKnownContent = null;
    this.callbacks = [];
    this.isWatching = false;
  }

  /**
   * Start watching for content changes
   */
  startWatching() {
    if (this.isWatching) return;
    
    this.isWatching = true;
    this.checkForChanges();
    
    // Set up periodic checking
    this.intervalId = setInterval(() => {
      this.checkForChanges();
    }, this.checkInterval);
    
    console.log('Content watcher started');
  }

  /**
   * Stop watching for content changes
   */
  stopWatching() {
    if (!this.isWatching) return;
    
    this.isWatching = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    console.log('Content watcher stopped');
  }

  /**
   * Add a callback to be called when content changes are detected
   */
  onChange(callback) {
    this.callbacks.push(callback);
  }

  /**
   * Check for changes in blog content
   */
  async checkForChanges() {
    try {
      const currentContent = await this.fetchBlogData();
      
      if (this.lastKnownContent === null) {
        // First time checking, just store the current state
        this.lastKnownContent = currentContent;
        return;
      }

      // Compare with last known content
      if (this.hasContentChanged(this.lastKnownContent, currentContent)) {
        console.log('Blog content changes detected!');
        
        // Notify all callbacks
        this.callbacks.forEach(callback => {
          try {
            callback(currentContent, this.lastKnownContent);
          } catch (error) {
            console.error('Error in content change callback:', error);
          }
        });
        
        // Update last known content
        this.lastKnownContent = currentContent;
      }
    } catch (error) {
      console.error('Error checking for content changes:', error);
    }
  }

  /**
   * Fetch current blog data
   */
  async fetchBlogData() {
    try {
      const response = await fetch(`${window.location.origin}/assets/blog-data.json?t=${Date.now()}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('Could not fetch blog data:', error);
    }
    
    // Return empty array if fetch fails
    return [];
  }

  /**
   * Compare two content states to detect changes
   */
  hasContentChanged(oldContent, newContent) {
    // Simple comparison - check if the number of series or files has changed
    if (oldContent.length !== newContent.length) {
      return true;
    }

    // Check each series for changes
    for (let i = 0; i < oldContent.length; i++) {
      const oldSeries = oldContent[i];
      const newSeries = newContent[i];

      // Check if series name changed
      if (oldSeries.name !== newSeries.name) {
        return true;
      }

      // Check if number of files changed
      if ((oldSeries.files || []).length !== (newSeries.files || []).length) {
        return true;
      }

      // Check individual files
      const oldFiles = oldSeries.files || [];
      const newFiles = newSeries.files || [];
      
      for (let j = 0; j < oldFiles.length; j++) {
        if (!newFiles[j] || oldFiles[j].name !== newFiles[j].name) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Manually trigger a content refresh
   */
  async refresh() {
    await this.checkForChanges();
  }
}

// Global content watcher instance
window.ContentWatcher = ContentWatcher;
