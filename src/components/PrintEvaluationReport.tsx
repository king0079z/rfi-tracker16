import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { calculateWeightedScore } from '@/lib/calculateScore'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PrintEvaluationReportProps {
  onClose?: () => void;
  hidden?: boolean;
}

export function PrintEvaluationReport({ onClose, hidden }: PrintEvaluationReportProps) {
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setHasPermission(false);
          return;
        }

        // Check user permissions
        const userResponse = await fetch('/api/auth/login', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!userResponse.ok) {
          setHasPermission(false);
          return;
        }
        const userData = await userResponse.json();

        // Check global settings
        const settingsResponse = await fetch('/api/admin/settings', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!settingsResponse.ok) {
          setHasPermission(false);
          return;
        }
        const settingsData = await settingsResponse.json();

        // User must have permission AND the feature must be enabled globally
        const hasAccess = userData.canPrintReports && settingsData.printEnabled;
        console.log('Print permission updated:', hasAccess);
        setHasPermission(hasAccess);
        if (hasAccess) {
          fetchData();
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
        setHasPermission(false);
      }
    };

    // Initial check
    checkPermissions();

    // Set up an interval to check permissions periodically
    const intervalId = setInterval(checkPermissions, 30000); // Check every 30 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token');
      const response = await fetch('/api/evaluations/print-report', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch report data')
      }
      const data = await response.json()
      setVendors(data)
    } catch (error) {
      console.error('Error fetching report data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  const categories = {
    experience: {
      name: 'Experience & Quality',
      criteria: [
        { key: 'experienceScore', name: 'Experience in Media Production', weight: 10 },
        { key: 'caseStudiesScore', name: 'Case Studies', weight: 10 },
        { key: 'domainExperienceScore', name: 'Industry Experience', weight: 5 }
      ]
    },
    understanding: {
      name: 'Project Understanding',
      criteria: [
        { key: 'approachAlignmentScore', name: 'Strategic Alignment', weight: 7 },
        { key: 'understandingChallengesScore', name: 'Technical Challenges', weight: 7 },
        { key: 'solutionTailoringScore', name: 'Solution Customization', weight: 6 }
      ]
    },
    methodology: {
      name: 'Methodology',
      criteria: [
        { key: 'strategyAlignmentScore', name: 'Strategy Alignment', weight: 7 },
        { key: 'methodologyScore', name: 'Implementation', weight: 6 },
        { key: 'innovativeStrategiesScore', name: 'Innovation', weight: 5 },
        { key: 'stakeholderEngagementScore', name: 'Stakeholder Management', weight: 5 },
        { key: 'toolsFrameworkScore', name: 'Tools & Technologies', weight: 3 }
      ]
    },
    cost: {
      name: 'Cost & Value',
      criteria: [
        { key: 'costStructureScore', name: 'Cost Structure', weight: 6 },
        { key: 'costEffectivenessScore', name: 'Cost Effectiveness', weight: 5 },
        { key: 'roiScore', name: 'ROI Potential', weight: 3 }
      ]
    },
    references: {
      name: 'References',
      criteria: [
        { key: 'referencesScore', name: 'Client References', weight: 6 },
        { key: 'testimonialsScore', name: 'Project Testimonials', weight: 2 },
        { key: 'sustainabilityScore', name: 'Long-term Success', weight: 2 }
      ]
    },
    deliverables: {
      name: 'Deliverables',
      criteria: [
        { key: 'deliverablesScore', name: 'Required Documentation', weight: 5 }
      ]
    }
  }

  const calculateAverageScore = (evaluations: any[], criteriaKey: string) => {
    if (!evaluations || evaluations.length === 0) return 0
    const validScores = evaluations.filter(e => e[criteriaKey] !== null && e[criteriaKey] !== undefined)
    if (validScores.length === 0) return 0
    return validScores.reduce((acc, evaluation) => acc + (evaluation[criteriaKey] || 0), 0) / validScores.length
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handlePrint = () => {
    window.print()
  }

  if (!hasPermission) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse">Loading report data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!vendors || vendors.length === 0) {
    return (
      <div className="p-8">
        <Alert>
          <AlertDescription>No vendor data available for the report.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="print:hidden mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vendor Evaluation Report</h1>
          <p className="text-sm text-gray-500 mt-1">Generated on {new Date().toLocaleDateString()}</p>
        </div>
        <div className="space-x-4">
          <Button onClick={handlePrint}>Print Report</Button>
          {onClose && <Button variant="outline" onClick={onClose}>Close</Button>}
        </div>
      </div>

      <div className="space-y-12">
        {vendors.map((vendor) => (
          <Card key={vendor.id} className="page-break-inside-avoid">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-2">{vendor.name}</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    {vendor.scopes?.map((scope: string) => (
                      <Badge key={scope} variant="secondary">{scope}</Badge>
                    ))}
                    <Badge variant="outline">{vendor.rfiStatus}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {vendor.evaluations && vendor.evaluations.length > 0
                      ? (vendor.evaluations.reduce((acc: number, evaluation: any) => 
                          acc + calculateWeightedScore(evaluation), 0) / vendor.evaluations.length).toFixed(1)
                      : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">Overall Score</div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-6">
                {/* Contact Information */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Contact Information</p>
                    <p className="mt-1">{vendor.contacts}</p>
                  </div>
                  {vendor.rfiReceivedAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">RFI Received</p>
                      <p className="mt-1">{new Date(vendor.rfiReceivedAt).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Evaluation Summary */}
                {vendor.evaluations && vendor.evaluations.length > 0 ? (
                  <div className="space-y-8">
                    {Object.entries(categories).map(([key, category]) => (
                      <div key={key} className="space-y-4">
                        <h3 className="font-semibold text-lg">{category.name}</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                          {category.criteria.map((criterion) => {
                            const avgScore = calculateAverageScore(vendor.evaluations, criterion.key)
                            return (
                              <div key={criterion.key} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">
                                    {criterion.name}
                                  </span>
                                  <span className={`font-bold ${getScoreColor(avgScore)}`}>
                                    {avgScore.toFixed(1)}/10
                                  </span>
                                </div>
                                <Progress value={avgScore * 10} className="h-2" />
                                <div className="text-xs text-gray-500 text-right">
                                  Weight: {criterion.weight}%
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No evaluations available for this vendor
                  </div>
                )}

                {/* Comments Section */}
                {vendor.evaluations?.some(e => e.comments?.length > 0) && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Key Comments</h3>
                      <div className="space-y-3">
                        {vendor.evaluations
                          .flatMap(e => e.comments || [])
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .slice(0, 3)
                          .map((comment: any) => (
                            <div key={comment.id} className="bg-gray-50 p-3 rounded">
                              <p className="text-sm">{comment.content}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                By {comment.evaluator?.name} • {new Date(comment.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Documents Section */}
                {vendor.documents?.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Submitted Documents</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {vendor.documents.map((doc: any) => (
                          <div key={doc.id} className="text-sm flex items-center gap-2">
                            <span>•</span>
                            <span>{doc.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 15mm;
            size: A4;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  )
}