import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Save, Loader2 } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { tracking } from '@/lib/tracking'
import { MobileHeader } from '@/components/layout/MobileHeader'

const projectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.string().optional(),
  status: z.string(),
  total_budget: z.number().min(0).optional(),
  currency: z.string().default('INR'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  location: z.string().optional(),
  director: z.string().optional(),
  producer: z.string().optional(),
  production_company: z.string().optional(),
})

type ProjectFormData = z.infer<typeof projectSchema>

export default function ProjectEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      currency: 'INR',
      status: 'pre'
    }
  })

  const status = watch('status')
  const currency = watch('currency')

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

      // Populate form with project data
      Object.keys(data).forEach((key) => {
        if (key in projectSchema.shape) {
          setValue(key as keyof ProjectFormData, data[key])
        }
      })

      setIsLoading(false)
    } catch (error) {
      console.error('Error loading project:', error)
      toast({
        title: 'Error',
        description: 'Failed to load project',
        variant: 'destructive'
      })
      navigate('/projects')
    }
  }

  const onSubmit = async (data: ProjectFormData) => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          ...data,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      tracking.track('project_updated', { project_id: id })

      toast({
        title: 'Success',
        description: 'Project updated successfully'
      })

      navigate(`/projects/${id}`)
    } catch (error) {
      console.error('Error updating project:', error)
      toast({
        title: 'Error',
        description: 'Failed to update project',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <>
        <MobileHeader title="Edit Project" showBack />
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

  return (
    <>
      <MobileHeader title="Edit Project" showBack />
      
      <div className="container mx-auto p-4 pb-24">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your project details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter project title"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    placeholder="e.g., Feature Film, Short Film"
                    {...register('type')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={status} onValueChange={(value) => setValue('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pre">Pre-Production</SelectItem>
                      <SelectItem value="active">In Production</SelectItem>
                      <SelectItem value="post">Post-Production</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="total_budget">Total Budget</Label>
                  <Input
                    id="total_budget"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register('total_budget', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={(value) => setValue('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    {...register('start_date')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    {...register('end_date')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., Mumbai, Maharashtra"
                  {...register('location')}
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
                  placeholder="Enter director name"
                  {...register('director')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="producer">Producer</Label>
                <Input
                  id="producer"
                  placeholder="Enter producer name"
                  {...register('producer')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="production_company">Production Company</Label>
                <Input
                  id="production_company"
                  placeholder="Enter production company"
                  {...register('production_company')}
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </div>
    </>
  )
}
