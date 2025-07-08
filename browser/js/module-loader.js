/**
 * Module Loader - Code Splitting and Lazy Loading
 * Phase 8.5: コード分割とレイジーローディング実装
 */

class ModuleLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
    this.moduleSize = new Map();
    this.loadStats = {
      totalModules: 0,
      totalLoadTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    console.log('🚀 ModuleLoader initialized for code splitting');
  }

  /**
   * Load module lazily with caching
   * @param {string} moduleName - Module name to load
   * @param {string} modulePath - Module path
   * @returns {Promise<any>} Loaded module
   */
  async loadModule(moduleName, modulePath) {
    const startTime = performance.now();
    
    // Check if already loaded
    if (this.loadedModules.has(moduleName)) {
      this.loadStats.cacheHits++;
      console.log(`📦 Using cached module: ${moduleName}`);
      return this.loadedModules.get(moduleName);
    }
    
    // Check if currently loading
    if (this.loadingPromises.has(moduleName)) {
      console.log(`⏳ Waiting for module load: ${moduleName}`);
      return await this.loadingPromises.get(moduleName);
    }
    
    // Start loading
    const loadPromise = this._loadModuleInternal(moduleName, modulePath, startTime);
    this.loadingPromises.set(moduleName, loadPromise);
    
    try {
      const module = await loadPromise;
      this.loadingPromises.delete(moduleName);
      return module;
    } catch (error) {
      this.loadingPromises.delete(moduleName);
      throw error;
    }
  }

  /**
   * Internal module loading implementation
   * @param {string} moduleName - Module name
   * @param {string} modulePath - Module path
   * @param {number} startTime - Start time
   * @returns {Promise<any>} Loaded module
   */
  async _loadModuleInternal(moduleName, modulePath, startTime) {
    console.log(`📦 Loading module: ${moduleName} from ${modulePath}`);
    this.loadStats.cacheMisses++;
    
    try {
      // Dynamic import with performance tracking
      const module = await import(modulePath);
      
      // Store in cache
      this.loadedModules.set(moduleName, module);
      
      // Update statistics
      const loadTime = performance.now() - startTime;
      this.loadStats.totalModules++;
      this.loadStats.totalLoadTime += loadTime;
      
      // Estimate module size (mock implementation)
      this.moduleSize.set(moduleName, await this._estimateModuleSize(modulePath));
      
      console.log(`✅ Module loaded: ${moduleName} (${loadTime.toFixed(2)}ms)`);
      return module;
      
    } catch (error) {
      console.error(`❌ Failed to load module ${moduleName}:`, error);
      throw new Error(`Module loading failed: ${moduleName}`);
    }
  }

  /**
   * Estimate module size (mock implementation)
   * @param {string} modulePath - Module path
   * @returns {Promise<number>} Estimated size in bytes
   */
  async _estimateModuleSize(modulePath) {
    // In a real implementation, this would analyze the bundled module size
    const mockSizes = {
      './lisp-engine.js': 300000,
      './lisp-game-adapter.js': 250000,
      './dynamic-rule-loader.js': 150000,
      './debug-system.js': 100000,
      './rule-settings.js': 80000,
      './dynamic-rule-ui.js': 120000
    };
    
    return mockSizes[modulePath] || 50000;
  }

  /**
   * Load multiple modules in parallel
   * @param {Array} modules - Array of {name, path} objects
   * @returns {Promise<Object>} Object with loaded modules
   */
  async loadModules(modules) {
    const startTime = performance.now();
    console.log(`📦 Loading ${modules.length} modules in parallel`);
    
    const loadPromises = modules.map(({ name, path }) => 
      this.loadModule(name, path).then(module => ({ name, module }))
    );
    
    try {
      const results = await Promise.all(loadPromises);
      const loadTime = performance.now() - startTime;
      
      console.log(`✅ All modules loaded in ${loadTime.toFixed(2)}ms`);
      
      // Convert to object format
      const loadedModules = {};
      results.forEach(({ name, module }) => {
        loadedModules[name] = module;
      });
      
      return loadedModules;
      
    } catch (error) {
      console.error('❌ Failed to load modules:', error);
      throw error;
    }
  }

  /**
   * Load core modules required for game
   * @returns {Promise<Object>} Core modules
   */
  async loadCoreModules() {
    const coreModules = [
      { name: 'lispEngine', path: './lisp-engine.js' },
      { name: 'gameAdapter', path: './lisp-game-adapter.js' },
      { name: 'debugSystem', path: './debug-system.js' }
    ];
    
    console.log('🎯 Loading core modules...');
    return await this.loadModules(coreModules);
  }

  /**
   * Load optional modules on demand
   * @returns {Promise<Object>} Optional modules
   */
  async loadOptionalModules() {
    const optionalModules = [
      { name: 'ruleLoader', path: './dynamic-rule-loader.js' },
      { name: 'ruleSettings', path: './rule-settings.js' },
      { name: 'dynamicRuleUI', path: './dynamic-rule-ui.js' }
    ];
    
    console.log('🔧 Loading optional modules...');
    return await this.loadModules(optionalModules);
  }

  /**
   * Load UI modules for enhanced experience
   * @returns {Promise<Object>} UI modules
   */
  async loadUIModules() {
    const uiModules = [
      { name: 'ruleSettings', path: './rule-settings.js' },
      { name: 'dynamicRuleUI', path: './dynamic-rule-ui.js' },
      { name: 'ruleLoader', path: './dynamic-rule-loader.js' }
    ];
    
    console.log('🎨 Loading UI modules...');
    return await this.loadModules(uiModules);
  }

  /**
   * Preload modules for better performance
   * @param {Array} modules - Modules to preload
   */
  async preloadModules(modules) {
    console.log(`🚀 Preloading ${modules.length} modules in background`);
    
    // Load modules in background without blocking
    modules.forEach(({ name, path }) => {
      this.loadModule(name, path).catch(error => {
        console.warn(`⚠️ Preload failed for ${name}:`, error);
      });
    });
  }

  /**
   * Get module loading statistics
   * @returns {Object} Loading statistics
   */
  getStats() {
    const avgLoadTime = this.loadStats.totalModules > 0 ? 
      this.loadStats.totalLoadTime / this.loadStats.totalModules : 0;
    
    return {
      ...this.loadStats,
      averageLoadTime: avgLoadTime,
      loadedModulesCount: this.loadedModules.size,
      totalEstimatedSize: Array.from(this.moduleSize.values()).reduce((a, b) => a + b, 0),
      cacheHitRate: this.loadStats.totalModules > 0 ? 
        this.loadStats.cacheHits / (this.loadStats.cacheHits + this.loadStats.cacheMisses) : 0
    };
  }

  /**
   * Get loaded module information
   * @returns {Array} Module information
   */
  getLoadedModules() {
    const modules = [];
    
    for (const [name, module] of this.loadedModules) {
      modules.push({
        name,
        size: this.moduleSize.get(name) || 0,
        exports: Object.keys(module).length,
        loaded: true
      });
    }
    
    return modules;
  }

  /**
   * Check if module is loaded
   * @param {string} moduleName - Module name
   * @returns {boolean} Is loaded
   */
  isModuleLoaded(moduleName) {
    return this.loadedModules.has(moduleName);
  }

  /**
   * Unload module to free memory
   * @param {string} moduleName - Module name to unload
   */
  unloadModule(moduleName) {
    if (this.loadedModules.has(moduleName)) {
      this.loadedModules.delete(moduleName);
      this.moduleSize.delete(moduleName);
      console.log(`🗑️ Module unloaded: ${moduleName}`);
    }
  }

  /**
   * Clear all modules (for testing/cleanup)
   */
  clearAllModules() {
    this.loadedModules.clear();
    this.moduleSize.clear();
    this.loadingPromises.clear();
    console.log('🧹 All modules cleared');
  }
}

// Singleton instance
const moduleLoader = new ModuleLoader();

// Global export for browser use
window.ModuleLoaderInstance = moduleLoader;
window.ModuleLoaderModule = { ModuleLoader };

// ES6 module export
export { ModuleLoader, moduleLoader };

console.log('🚀 Module Loader ready for code splitting');