import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 px-4">
        <FileQuestion className="h-24 w-24 mx-auto text-muted-foreground" />
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-xl text-muted-foreground">Page not found</p>
        </div>
        <Button asChild>
          <Link to="/">Return Home</Link>
        </Button>
      </div>
    </div>
  )
}
