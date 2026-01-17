import { useParams, Link } from "react-router"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { User, CreditCard, Calendar, UserCheck, Pill, FlaskConical, DollarSign, ArrowLeft, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { api, type Patient } from "@/lib/api-client"

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    const loadPatient = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await api.patients.getById(id)
        setPatient(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load patient')
      } finally {
        setIsLoading(false)
      }
    }

    loadPatient()
  }, [id])

  // Format phone for display
  const formatPhone = (phone: string | null) => {
    if (!phone) return '-'
    if (phone.startsWith('+1') && phone.length === 12) {
      return `(${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`
    }
    return phone
  }

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading patient...</span>
        </div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <h2 className="text-xl font-semibold">Patient Not Found</h2>
                <p className="text-muted-foreground">
                  {error || "The patient you're looking for doesn't exist or has been deleted."}
                </p>
                <Button asChild variant="outline">
                  <Link to="/patients">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Patients
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const fullName = `${patient.firstName} ${patient.lastName}`

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={fullName}
        subtitle={`Patient ID: ${id}`}
        backHref="/patients"
      />

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="demographics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
            <TabsTrigger value="demographics" className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Demographics</span>
            </TabsTrigger>
            <TabsTrigger value="insurance" className="flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Insurance</span>
            </TabsTrigger>
            <TabsTrigger value="visits" className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Visits</span>
            </TabsTrigger>
            <TabsTrigger value="bills" className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Bills</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Referrals</span>
            </TabsTrigger>
            <TabsTrigger value="medications" className="flex items-center gap-1.5">
              <Pill className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Medications</span>
            </TabsTrigger>
            <TabsTrigger value="labs" className="flex items-center gap-1.5">
              <FlaskConical className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Labs</span>
            </TabsTrigger>
          </TabsList>

          {/* Demographics Tab */}
          <TabsContent value="demographics">
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Full Name</div>
                      <div className="text-base font-medium">{fullName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">First Name</div>
                      <div className="text-base">{patient.firstName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Last Name</div>
                      <div className="text-base">{patient.lastName}</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="text-base">{formatPhone(patient.phone)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Date of Birth</div>
                      <div className="text-base">{formatDate(patient.dob)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Patient ID</div>
                      <div className="text-base font-mono text-sm">{patient.id}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insurance Tab */}
          <TabsContent value="insurance">
            <Card>
              <CardHeader>
                <CardTitle>Insurance Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No insurance information on file
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Past Visits Tab */}
          <TabsContent value="visits">
            <Card>
              <CardHeader>
                <CardTitle>Past Visits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No visit history on file
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bills Tab */}
          <TabsContent value="bills">
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No billing history on file
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals">
            <Card>
              <CardHeader>
                <CardTitle>Referrals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No referrals on file
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications">
            <Card>
              <CardHeader>
                <CardTitle>Current Medications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No medications on file
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Labs Tab */}
          <TabsContent value="labs">
            <Card>
              <CardHeader>
                <CardTitle>Laboratory Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  No lab results on file
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
