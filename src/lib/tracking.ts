import posthog from 'posthog-js'

class Analytics {
  private initialized = false

  init() {
    if (this.initialized) return
    
    // Initialize PostHog with your project key
    posthog.init('phc_dummy_key_replace_with_real_key', {
      api_host: 'https://us.i.posthog.com',
      person_profiles: 'identified_only',
      // Disable in development
      disable_session_recording: process.env.NODE_ENV === 'development',
    })
    
    this.initialized = true
  }

  // User events
  trackSignup(method: string = 'email') {
    this.track('signup', { method })
  }

  trackSignin(method: string = 'email') {
    this.track('signin', { method })
  }

  trackProfileSaved(updates: Record<string, any> = {}) {
    this.track('profile_saved', { fields_updated: Object.keys(updates) })
  }

  // Project events
  trackProjectCreated(projectData: { type?: string; genre?: string }) {
    this.track('project_created', projectData)
  }

  trackProjectUpdated(projectId: string, updates: Record<string, any> = {}) {
    this.track('project_updated', { 
      project_id: projectId,
      fields_updated: Object.keys(updates)
    })
  }

  trackProjectDeleted(projectId: string) {
    this.track('project_deleted', { project_id: projectId })
  }

  // File events
  trackFileUploaded(fileType: string, size: number, bucket: string) {
    this.track('file_uploaded', {
      file_type: fileType,
      file_size: size,
      bucket: bucket
    })
  }

  // Navigation events
  trackPageView(path: string) {
    this.track('$pageview', { path })
  }

  // Generic tracking method
  track(event: string, properties: Record<string, any> = {}) {
    if (!this.initialized) {
      this.init()
    }
    
    posthog.capture(event, properties)
  }

  // User identification
  identify(userId: string, userProperties: Record<string, any> = {}) {
    if (!this.initialized) {
      this.init()
    }
    
    posthog.identify(userId, userProperties)
  }

  // Reset user session
  reset() {
    if (!this.initialized) return
    posthog.reset()
  }
}

export const tracking = new Analytics()