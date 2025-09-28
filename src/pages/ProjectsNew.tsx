import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Upload } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { tracking } from '@/lib/tracking'
import { z } from 'zod'

const projectSchema = z.object({
  title: z.string().trim().min(1, 'Project title is required').max(100, 'Title must be less than 100 characters'),
  type: z.string().optional(),
  genre: z.string().optional(),
  language: z.string().optional(),
  director: z.string().optional(),
  producer: z.string().optional(),
  production_company: z.string().optional(),
  location: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  total_budget: z.number().min(0, 'Budget must be a positive number').optional(),
  currency: z.string().default('INR')
})

export default function ProjectsNew() {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [posterFile, setPosterFile] = useState<File | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    genre: '',
    language: '',
    director: '',
    producer: '',
    production_company: '',
    location: '',
    start_date: '',
    end_date: '',
    total_budget: '',
    currency: 'INR'
  })
  
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth')
        return
      }
      setUser(session.user)
    })
  }, [navigate])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePosterUpload = async (file: File, projectId: string): Promise<string | null> => {
    try {
      // Validate file
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Please upload a JPEG, PNG, or WebP image')
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('File size must be less than 10MB')
      }

      const fileName = `${Date.now()}-${file.name}`
      const filePath = `${projectId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('project-covers')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('project-covers')
        .getPublicUrl(filePath)

      // Track file upload
      tracking.trackFileUploaded(file.type, file.size, 'project-covers')

      return publicUrl
    } catch (error: any) {
      console.error('Error uploading poster:', error)
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive'
      })
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setError('')

    try {
      // Prepare data for validation
      const dataToValidate = {
        ...formData,
        total_budget: formData.total_budget ? parseFloat(formData.total_budget) : undefined
      }

      const validatedData = projectSchema.parse(dataToValidate)

      // Create project
      const { data: project, error: createError } = await supabase
        .from('projects')
        .insert({
          title: validatedData.title,
          type: validatedData.type || null,
          genre: validatedData.genre || null,
          language: validatedData.language || null,
          director: validatedData.director || null,
          producer: validatedData.producer || null,
          production_company: validatedData.production_company || null,
          location: validatedData.location || null,
          start_date: validatedData.start_date || null,
          end_date: validatedData.end_date || null,
          total_budget: validatedData.total_budget || null,
          currency: validatedData.currency,
          owner_id: user.id,
          status: 'pre'
        })
        .select()
        .single()

      if (createError) throw createError

      // Upload poster if provided
      let posterUrl = null
      if (posterFile && project) {
        setIsUploading(true)
        posterUrl = await handlePosterUpload(posterFile, project.id)
        
        if (posterUrl) {
          // Update project with poster URL
          const { error: updateError } = await supabase
            .from('projects')
            .update({ poster_url: posterUrl })
            .eq('id', project.id)

          if (updateError) {
            console.error('Error updating poster URL:', updateError)
          }
        }
      }

      // Track project creation
      tracking.trackProjectCreated({
        type: validatedData.type,
        genre: validatedData.genre
      })

      toast({
        title: 'Project created!',
        description: 'Your new project has been created successfully.',
      })

      navigate(`/projects/${project.id}`)
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message)
      } else {
        setError(error.message || 'An unexpected error occurred')
      }
      toast({
        title: 'Failed to create project',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
      setIsUploading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 pb-24">
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/projects')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground">
            Set up your film production project
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Essential details about your project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter project title"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">Feature Film</SelectItem>
                    <SelectItem value="short">Short Film</SelectItem>
                    <SelectItem value="documentary">Documentary</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="music-video">Music Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Select value={formData.genre} onValueChange={(value) => handleInputChange('genre', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drama">Drama</SelectItem>
                    <SelectItem value="comedy">Comedy</SelectItem>
                    <SelectItem value="thriller">Thriller</SelectItem>
                    <SelectItem value="horror">Horror</SelectItem>
                    <SelectItem value="action">Action</SelectItem>
                    <SelectItem value="romance">Romance</SelectItem>
                    <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                type="text"
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                placeholder="e.g., Hindi, English, Tamil"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Production Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="director">Director</Label>
              <Input
                id="director"
                type="text"
                value={formData.director}
                onChange={(e) => handleInputChange('director', e.target.value)}
                placeholder="Director name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="producer">Producer</Label>
              <Input
                id="producer"
                type="text"
                value={formData.producer}
                onChange={(e) => handleInputChange('producer', e.target.value)}
                placeholder="Producer name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="production_company">Production Company</Label>
              <Input
                id="production_company"
                type="text"
                value={formData.production_company}
                onChange={(e) => handleInputChange('production_company', e.target.value)}
                placeholder="Production company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Primary Location</Label>
              <Input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Mumbai, Chennai, Goa"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schedule & Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange('end_date', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="total_budget">Total Budget</Label>
                <Input
                  id="total_budget"
                  type="number"
                  min="0"
                  value={formData.total_budget}
                  onChange={(e) => handleInputChange('total_budget', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Poster</CardTitle>
            <CardDescription>
              Upload a poster or cover image for your project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="poster">Poster Image</Label>
              <Input
                id="poster"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                disabled={isLoading || isUploading}
              />
              <p className="text-xs text-muted-foreground">
                JPEG, PNG or WebP. Max 10MB.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/projects')}
            disabled={isLoading || isUploading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || isUploading}
            className="flex-1"
          >
            {(isLoading || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Project
          </Button>
        </div>
      </form>
    </div>
  )
}