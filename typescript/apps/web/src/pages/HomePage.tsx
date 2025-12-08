import { Link } from "react-router-dom"
import { Calendar, Users, Clock, AlertCircle, CheckCircle2, Bot, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QuickStatsCard } from "@/components/quick-stats-card"
import { OpenSlotsWidget } from "@/components/open-slots-widget"
import { todaysAppointments, upcomingAppointments } from "@/lib/mock-data"
import { DashboardHeader } from "@/components/dashboard-header"
import { NavigationCard } from "@/components/navigation-card"

export default function HomePage() {
  const todayTotal = todaysAppointments.length
  const todayInsuranceIssues = todaysAppointments.filter((apt) => apt.patient.insurance.status !== "valid").length
  const upcomingTotal = upcomingAppointments.length
  const upcomingIssues = upcomingAppointments.reduce((sum, apt) => sum + apt.issues.length, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <DashboardHeader />

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickStatsCard
              title="Today's Patients"
              value={todayTotal}
              description="Scheduled appointments"
              icon={Users}
            />
            <QuickStatsCard
              title="Insurance Issues"
              value={todayInsuranceIssues}
              description="Require verification"
              icon={AlertCircle}
            />
            {/* Open Slots Widget */}
            <OpenSlotsWidget />
          </div>

          {/* Main Navigation Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <NavigationCard
              href="/today"
              title="Today's Patients"
              description="View and manage today's scheduled appointments with real-time insurance verification status"
              icon={Calendar}
              iconBgColor="bg-primary/10 text-primary"
              stats={[
                {
                  icon: CheckCircle2,
                  label: `${todayTotal - todayInsuranceIssues} verified`,
                  iconColor: "text-green-600",
                },
                ...(todayInsuranceIssues > 0
                  ? [
                      {
                        icon: AlertCircle,
                        label: `${todayInsuranceIssues} need attention`,
                        iconColor: "text-amber-600",
                      },
                    ]
                  : []),
              ]}
            />

            <NavigationCard
              href="/upcoming"
              title="Upcoming Visits"
              description="Review upcoming appointments and resolve insurance or authorization issues before visit dates"
              icon={Clock}
              iconBgColor="bg-secondary/10 text-secondary"
              stats={[
                {
                  icon: Calendar,
                  label: `${upcomingTotal} scheduled`,
                  iconColor: "text-primary",
                },
                ...(upcomingIssues > 0
                  ? [
                      {
                        icon: AlertCircle,
                        label: `${upcomingIssues} issues`,
                        iconColor: "text-amber-600",
                      },
                    ]
                  : []),
              ]}
            />

            <NavigationCard
              href="/agents"
              title="AI Agents"
              description="Manage voice AI agents for reception, eligibility verification, and authorization tasks"
              icon={Bot}
              iconBgColor="bg-violet-500/10 text-violet-600"
              stats={[
                {
                  icon: Phone,
                  label: "Voice agents",
                  iconColor: "text-violet-600",
                },
              ]}
            />
          </div>

          {/* CTA */}
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg" className="text-base">
              <Link to="/today">
                <Users className="mr-2 h-5 w-5" />
                View Today's Schedule
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
