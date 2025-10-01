import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Users, 
  Activity,
  ArrowLeft,
  Camera,
  MapPin
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { tracking } from '@/lib/tracking'
import { MobileHeader } from '@/components/layout/MobileHeader'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [project, setProject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (id) {
      loadProject()
    }
  }, [id])

  const loadProject = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        navigate('/auth')
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        toast({
          title: 'Project not found',
          description: 'The project you are looking for does not exist',
          variant: 'destructive'
        })
        navigate('/projects')
        return
      }

      setProject(data)
    } catch (error) {
      console.error('Error loading project:', error)
      toast({
        title: 'Error',
        description: 'Failed to load project',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) throw error

      tracking.track('project_deleted', { project_id: id })

      toast({
        title: 'Success',
        description: 'Project deleted successfully'
      })

      navigate('/projects')
    } catch (error) {
      console.error('Error deleting project:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete project',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <MobileHeader title="Project Details" showBack />
        <div className="container mx-auto p-4 pb-24">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading project...</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (!project) {
    return null
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'completed': return 'secondary'
      case 'pre': return 'outline'
      default: return 'outline'
    }
  }

  const formatCurrency = (amount: number | null, currency: string = 'INR') => {
    if (!amount) return 'Not set'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <>
      <MobileHeader title={project.title} showBack />
      
      <div className="container mx-auto p-4 pb-24 space-y-6">
        {/* Project Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">{project.title}</CardTitle>
                  <Badge variant={getStatusBadgeVariant(project.status)}>
                    {project.status}
                  </Badge>
                </div>
                {project.type && (
                  <CardDescription className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    {project.type}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {project.total_budget && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Budget</p>
                    <p className="font-medium">{formatCurrency(project.total_budget, project.currency)}</p>
                  </div>
                </div>
              )}
              
              {project.start_date && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Start Date</p>
                    <p className="font-medium">{new Date(project.start_date).toLocaleDateString()}</p>
                  </div>
                </div>
              )}
              
              {project.location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{project.location}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Activity className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Last Activity</p>
                  <p className="font-medium">
                    {new Date(project.last_activity_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <Link to={`/projects/${project.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Project
                </Link>
              </Button>
              <Button 
                variant="destructive" 
                size="icon"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        {(project.director || project.producer || project.production_company) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Production Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.director && (
                <div>
                  <p className="text-sm text-muted-foreground">Director</p>
                  <p className="font-medium">{project.director}</p>
                </div>
              )}
              {project.producer && (
                <div>
                  <p className="text-sm text-muted-foreground">Producer</p>
                  <p className="font-medium">{project.producer}</p>
                </div>
              )}
              {project.production_company && (
                <div>
                  <p className="text-sm text-muted-foreground">Production Company</p>
                  <p className="font-medium">{project.production_company}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
