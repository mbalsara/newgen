import { Link } from "react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface NavigationCardProps {
  href: string
  title: string
  description: string
  icon: LucideIcon
  iconBgColor: string
  stats: Array<{
    icon: LucideIcon
    label: string
    iconColor: string
  }>
}

export function NavigationCard({ href, title, description, icon: Icon, iconBgColor, stats }: NavigationCardProps) {
  return (
    <Link to={href} className="group">
      <Card className="h-full transition-all hover:shadow-lg hover:border-primary/50 hover:scale-[1.02]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-lg ${iconBgColor} group-hover:bg-primary group-hover:text-primary-foreground transition-colors`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription className="text-base">{description}</CardDescription>
          <div className="flex items-center gap-4 pt-2">
            {stats.map((stat, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                <span className="text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
