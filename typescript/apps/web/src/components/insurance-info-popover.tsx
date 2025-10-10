import { CheckCircle2, XCircle, Shield, Calendar } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Insurance } from "@/lib/types"
import { formatCurrency } from "@/lib/appointment-utils"

interface InsuranceInfoPopoverProps {
  insurance: Insurance
  children: React.ReactNode
}

export function InsuranceInfoPopover({ insurance, children }: InsuranceInfoPopoverProps) {
  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-96" align="start">
        <div className="space-y-3">
          <div className="border-b pb-2">
            <h4 className="font-semibold text-sm">{insurance.provider}</h4>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Policy ID: {insurance.id}</span>
              <span className="font-medium">Co-pay: {formatCurrency(insurance.copay)}</span>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {/* Eligibility Status */}
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Eligibility Verified</span>
              </div>
              {insurance.eligibilityVerified ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>

            {/* Verification Date */}
            {insurance.verifiedDate && (
              <div className="flex items-start gap-2 text-xs">
                <Calendar className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="font-medium text-muted-foreground">Last Verified</div>
                  <div>{new Date(insurance.verifiedDate).toLocaleDateString()}</div>
                </div>
              </div>
            )}

            {/* Authorizations Table */}
            {insurance.authorizations && insurance.authorizations.length > 0 && (
              <div className="mt-3">
                <h5 className="font-semibold text-xs mb-2">Authorizations</h5>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="h-8 text-xs">Type</TableHead>
                        <TableHead className="h-8 text-xs text-center">Status</TableHead>
                        <TableHead className="h-8 text-xs text-right">Visits</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {insurance.authorizations.map((auth, index) => {
                        const visitsRemaining = auth.visitsAllowed && auth.visitsUsed
                          ? auth.visitsAllowed - auth.visitsUsed
                          : undefined

                        return (
                          <TableRow key={index} className="text-xs">
                            <TableCell className="py-2 font-medium">{auth.type}</TableCell>
                            <TableCell className="py-2 text-center">
                              {auth.authorized ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 inline" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600 inline" />
                              )}
                            </TableCell>
                            <TableCell className="py-2 text-right">
                              {auth.visitsAllowed ? (
                                <div className="space-y-0">
                                  <div className="font-medium">
                                    {visitsRemaining !== undefined && (
                                      <span className={visitsRemaining === 0 ? "text-red-600" : "text-green-600"}>
                                        {visitsRemaining}
                                      </span>
                                    )}
                                    {visitsRemaining !== undefined && " / "}
                                    {auth.visitsAllowed}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {visitsRemaining !== undefined ? `${auth.visitsUsed} used` : "available"}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Failure Reason */}
            {insurance.failureReason && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-xs text-red-800 dark:text-red-200">{insurance.failureReason}</p>
              </div>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
