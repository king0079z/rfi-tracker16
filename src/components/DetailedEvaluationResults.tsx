import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { calculateWeightedScore } from '@/lib/calculateScore'
import { EvaluatorCard } from './EvaluatorCard'

interface DetailedEvaluationResultsProps {
  evaluations: any[]
  vendorName: string
}

export function DetailedEvaluationResults({ evaluations, vendorName }: DetailedEvaluationResultsProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  if (!evaluations || evaluations.length === 0) {
    return null
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

  const calculateAverageScore = (criteriaKey: string) => {
    return evaluations.reduce((acc, evaluation) => acc + (evaluation[criteriaKey] || 0), 0) / evaluations.length
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600'
    if (score >= 6) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">View Detailed Results</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>Detailed Evaluation Results - {vendorName}</DialogTitle>
          <DialogDescription>
            Comprehensive breakdown of all evaluation criteria and individual assessments
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="space-y-6 p-4">
            <Card>
              <CardHeader>
                <CardTitle>Overall Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
                  <div className="text-5xl font-bold text-primary">
                    {(evaluations.reduce((acc, evaluation) => acc + calculateWeightedScore(evaluation), 0) / evaluations.length).toFixed(2)}%
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="criteria" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="criteria">By Criteria</TabsTrigger>
                <TabsTrigger value="evaluator">By Evaluator</TabsTrigger>
              </TabsList>

              <TabsContent value="criteria">
                <div className="space-y-6">
                  {Object.entries(categories).map(([key, category]) => (
                    <Card key={key}>
                      <CardHeader>
                        <CardTitle>{category.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {category.criteria.map((criterion) => {
                            const avgScore = calculateAverageScore(criterion.key)
                            return (
                              <div key={criterion.key} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">
                                    {criterion.name} ({criterion.weight}%)
                                  </span>
                                  <span className={`font-bold ${getScoreColor(avgScore)}`}>
                                    {avgScore.toFixed(1)}/10
                                  </span>
                                </div>
                                <Progress value={avgScore * 10} />
                                <div className="text-sm text-gray-500">
                                  Individual scores: {evaluations.map(e => e[criterion.key]).join(', ')}
                                </div>
                                <div className="space-y-2">
                                  {evaluations.map((evaluation, idx) => {
                                    const remarkKey = criterion.key.replace('Score', 'Remark')
                                    return evaluation[remarkKey] ? (
                                      <div key={idx} className="text-sm bg-gray-50 p-2 rounded">
                                        <span className="font-medium">{evaluation.evaluator?.name}: </span>
                                        {evaluation[remarkKey]}
                                      </div>
                                    ) : null
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="evaluator">
                <div className="space-y-6">
                  {evaluations.map((evaluation, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <EvaluatorCard
                          evaluator={evaluation.evaluator}
                          score={calculateWeightedScore(evaluation)}
                        />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {Object.entries(categories).map(([key, category]) => (
                            <div key={key} className="space-y-4">
                              <h4 className="font-medium">{category.name}</h4>
                              <div className="space-y-2">
                                {category.criteria.map((criterion) => (
                                  <div key={criterion.key} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                      <span>{criterion.name}</span>
                                      <span className={getScoreColor(evaluation[criterion.key])}>
                                        {evaluation[criterion.key]}/10
                                      </span>
                                    </div>
                                    <Progress value={evaluation[criterion.key] * 10} className="h-1" />
                                    {evaluation[criterion.key.replace('Score', 'Remark')] && (
                                      <p className="text-sm text-gray-500 mt-1">
                                        {evaluation[criterion.key.replace('Score', 'Remark')]}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}