import type React from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

interface PageHeaderProps {
  title: string
  subtitle?: string
  backHref?: string
  rightContent?: React.ReactNode
}

export function PageHeader({ title, subtitle, backHref = "/", rightContent }: PageHeaderProps) {
  return (
    <div className="border-b bg-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to={backHref}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-primary">{title}</h1>
              {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
            </div>
          </div>
          {rightContent}
        </div>
      </div>
    </div>
  )
}
