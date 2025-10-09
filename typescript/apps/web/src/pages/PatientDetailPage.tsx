import { useParams, Navigate } from "react-router-dom"
import { patientDetails, type PatientId } from "@/lib/mock-patient-details"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, CreditCard, Calendar, UserCheck, Pill, FlaskConical, DollarSign } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { PatientDemographicsSection } from "@/components/patient-demographics-section"
import { PatientInsuranceCard } from "@/components/patient-insurance-card"

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const patient = patientDetails[id as PatientId]

  if (!patient) {
    return <Navigate to="/404" replace />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const totalBalance = patient.bills.reduce((sum, bill) => sum + bill.balance, 0)

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={patient.demographics.fullName}
        subtitle={`Patient ID: ${id}`}
        backHref="/today"
        rightContent={
          totalBalance > 0 ? (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Outstanding Balance</div>
              <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalBalance)}</div>
            </div>
          ) : undefined
        }
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

          <TabsContent value="demographics">
            <PatientDemographicsSection demographics={patient.demographics} />
          </TabsContent>

          <TabsContent value="insurance">
            <div className="space-y-4">
              {patient.insurances.map((insurance) => (
                <PatientInsuranceCard key={insurance.id} insurance={insurance} />
              ))}
            </div>
          </TabsContent>

          {/* Past Visits Tab */}
          <TabsContent value="visits">
            <Card>
              <CardHeader>
                <CardTitle>Past Visits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patient.pastVisits.map((visit, index) => (
                    <div key={index}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="font-semibold text-primary">{formatDate(visit.date)}</div>
                          <div>
                            <div className="text-sm text-muted-foreground">Provider</div>
                            <div className="text-base">{visit.provider}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Reason</div>
                            <div className="text-base">{visit.reason}</div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <div className="text-sm text-muted-foreground">Diagnosis</div>
                            <div className="text-base">{visit.diagnosis}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Amount</div>
                            <div className="text-base">{formatCurrency(visit.amount)}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Payment Status</div>
                            <div className="text-base">
                              {visit.paid === visit.amount ? (
                                <Badge variant="default" className="bg-green-600">
                                  Paid in Full
                                </Badge>
                              ) : visit.paid > 0 ? (
                                <Badge variant="secondary">Partial Payment</Badge>
                              ) : (
                                <Badge variant="destructive">Unpaid</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bills Tab */}
          <TabsContent value="bills">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Billing History</CardTitle>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Total Outstanding</div>
                    <div className="text-xl font-bold text-amber-600">{formatCurrency(totalBalance)}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patient.bills.map((bill, index) => (
                    <div key={bill.id}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-semibold">{bill.id}</div>
                            <Badge
                              variant={
                                bill.status === "Paid"
                                  ? "default"
                                  : bill.status === "Overdue"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {bill.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{formatDate(bill.date)}</div>
                          <div className="text-base">{bill.description}</div>
                        </div>
                        <div className="text-right space-y-1">
                          <div>
                            <div className="text-xs text-muted-foreground">Amount</div>
                            <div className="font-medium">{formatCurrency(bill.amount)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Paid</div>
                            <div className="font-medium text-green-600">{formatCurrency(bill.paid)}</div>
                          </div>
                          {bill.balance > 0 && (
                            <div>
                              <div className="text-xs text-muted-foreground">Balance</div>
                              <div className="font-bold text-amber-600">{formatCurrency(bill.balance)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
                {patient.referrals.length > 0 ? (
                  <div className="space-y-4">
                    {patient.referrals.map((referral, index) => (
                      <div key={index}>
                        {index > 0 && <Separator className="my-4" />}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold">{referral.referredTo}</div>
                            <Badge variant="secondary">{referral.status}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{formatDate(referral.date)}</div>
                          <div className="text-base">{referral.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No referrals on file</div>
                )}
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
                {patient.medications.length > 0 ? (
                  <div className="space-y-4">
                    {patient.medications.map((medication, index) => (
                      <div key={index}>
                        {index > 0 && <Separator className="my-4" />}
                        <div className="space-y-2">
                          <div className="font-semibold text-lg">{medication.name}</div>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Dosage</div>
                              <div>{medication.dosage}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Refills Remaining</div>
                              <div>{medication.refills}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Prescribed By</div>
                              <div>{medication.prescribedBy}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Prescribed Date</div>
                              <div>{formatDate(medication.prescribedDate)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No medications on file</div>
                )}
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
                {patient.labs.length > 0 ? (
                  <div className="space-y-4">
                    {patient.labs.map((lab, index) => (
                      <div key={index}>
                        {index > 0 && <Separator className="my-4" />}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-lg">{lab.test}</div>
                            <div className="text-sm text-muted-foreground">{formatDate(lab.date)}</div>
                          </div>
                          <div className="text-base">{lab.results}</div>
                          <div className="text-sm text-muted-foreground">Ordered by: {lab.orderedBy}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No lab results on file</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
