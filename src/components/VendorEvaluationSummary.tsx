import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { calculateWeightedScore } from '@/lib/calculateScore'
import { Badge } from '@/components/ui/badge'
import { EvaluatorCard } from './EvaluatorCard'
import { Separator } from './ui/separator'
import { DetailedEvaluationResults } from './DetailedEvaluationResults'


interface VendorEvaluationSummaryProps {
  evaluations: any[]
  vendorName?: string
  vendor?: {
    id: string;
    name: string;
    scope: string[];
  }
}

export function VendorEvaluationSummary({ evaluations, vendor }: VendorEvaluationSummaryProps) {
  if (!evaluations || evaluations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Evaluations Available</CardTitle>
          <CardDescription>
            No evaluations have been submitted for this vendor yet.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const averageScore = evaluations.reduce((acc, evaluation) => acc + calculateWeightedScore(evaluation), 0) / evaluations.length

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const calculateCategoryScore = (evaluations: any[], category: string[]) => {
    const scores = evaluations.map(evaluation => {
      const categoryScores = category.map(field => evaluation[field] || 0)
      return categoryScores.reduce((acc, score) => acc + score, 0) / category.length
    })
    return scores.reduce((acc, score) => acc + score, 0) / scores.length
  }

  const categories = {
    experience: ['experienceScore', 'caseStudiesScore', 'domainExperienceScore'],
    understanding: ['approachAlignmentScore', 'understandingChallengesScore', 'solutionTailoringScore'],
    methodology: ['strategyAlignmentScore', 'methodologyScore', 'innovativeStrategiesScore', 'stakeholderEngagementScore', 'toolsFrameworkScore'],
    cost: ['costStructureScore', 'costEffectivenessScore', 'roiScore'],
    references: ['referencesScore', 'testimonialsScore', 'sustainabilityScore'],
    deliverables: ['deliverablesScore']
  }

  return (
    <ScrollArea className="h-[calc(90vh-200px)]">
      <div className="space-y-6 p-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Overall Evaluation Summary</CardTitle>
                <CardDescription>
                  Based on {evaluations.length} evaluation{evaluations.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>

            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg">
                <div className="text-4xl font-bold mb-2 text-primary">
                  {averageScore.toFixed(2)}%
                </div>
                <Progress value={averageScore} className="w-full h-2" />
                <p className="text-sm text-gray-500 mt-2">Average Score</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Experience & Quality</h4>
                  <div className="flex items-center justify-between">
                    <Progress 
                      value={calculateCategoryScore(evaluations, categories.experience) * 10} 
                      className="flex-1 mr-4" 
                    />
                    <span className={getScoreColor(calculateCategoryScore(evaluations, categories.experience) * 10)}>
                      {(calculateCategoryScore(evaluations, categories.experience) * 10).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Project Understanding</h4>
                  <div className="flex items-center justify-between">
                    <Progress 
                      value={calculateCategoryScore(evaluations, categories.understanding) * 10} 
                      className="flex-1 mr-4" 
                    />
                    <span className={getScoreColor(calculateCategoryScore(evaluations, categories.understanding) * 10)}>
                      {(calculateCategoryScore(evaluations, categories.understanding) * 10).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Methodology</h4>
                  <div className="flex items-center justify-between">
                    <Progress 
                      value={calculateCategoryScore(evaluations, categories.methodology) * 10} 
                      className="flex-1 mr-4" 
                    />
                    <span className={getScoreColor(calculateCategoryScore(evaluations, categories.methodology) * 10)}>
                      {(calculateCategoryScore(evaluations, categories.methodology) * 10).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Cost & Value</h4>
                  <div className="flex items-center justify-between">
                    <Progress 
                      value={calculateCategoryScore(evaluations, categories.cost) * 10} 
                      className="flex-1 mr-4" 
                    />
                    <span className={getScoreColor(calculateCategoryScore(evaluations, categories.cost) * 10)}>
                      {(calculateCategoryScore(evaluations, categories.cost) * 10).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">References</h4>
                  <div className="flex items-center justify-between">
                    <Progress 
                      value={calculateCategoryScore(evaluations, categories.references) * 10} 
                      className="flex-1 mr-4" 
                    />
                    <span className={getScoreColor(calculateCategoryScore(evaluations, categories.references) * 10)}>
                      {(calculateCategoryScore(evaluations, categories.references) * 10).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Deliverables</h4>
                  <div className="flex items-center justify-between">
                    <Progress 
                      value={calculateCategoryScore(evaluations, categories.deliverables) * 10} 
                      className="flex-1 mr-4" 
                    />
                    <span className={getScoreColor(calculateCategoryScore(evaluations, categories.deliverables) * 10)}>
                      {(calculateCategoryScore(evaluations, categories.deliverables) * 10).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evaluator Breakdown</CardTitle>
            <CardDescription>Individual evaluations and comments</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {evaluations.map((evaluation, index) => (
                <AccordionItem key={index} value={`evaluation-${index}`}>
                  <AccordionTrigger>
                    <div className="flex w-full">
                      <EvaluatorCard
                        evaluator={evaluation.evaluator}
                        score={calculateWeightedScore(evaluation)}
                        compact
                      />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6 pt-4">
                      <div className="grid gap-6">
                        <div className="space-y-4">
                          <h4 className="font-medium">Experience & Quality</h4>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Experience Score</span>
                                <span className="font-medium">{evaluation.experienceScore}/10</span>
                              </div>
                              <Progress value={evaluation.experienceScore * 10} className="h-1" />
                              {evaluation.experienceRemark && (
                                <p className="text-sm text-gray-500 mt-1">{evaluation.experienceRemark}</p>
                              )}
                            </div>
                            <Separator />
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Case Studies Score</span>
                                <span className="font-medium">{evaluation.caseStudiesScore}/10</span>
                              </div>
                              <Progress value={evaluation.caseStudiesScore * 10} className="h-1" />
                              {evaluation.caseStudiesRemark && (
                                <p className="text-sm text-gray-500 mt-1">{evaluation.caseStudiesRemark}</p>
                              )}
                            </div>
                            <Separator />
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Domain Experience Score</span>
                                <span className="font-medium">{evaluation.domainExperienceScore}/10</span>
                              </div>
                              <Progress value={evaluation.domainExperienceScore * 10} className="h-1" />
                              {evaluation.domainExperienceRemark && (
                                <p className="text-sm text-gray-500 mt-1">{evaluation.domainExperienceRemark}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                          <h4 className="font-medium">Project Understanding</h4>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Approach Alignment Score</span>
                                <span className="font-medium">{evaluation.approachAlignmentScore}/10</span>
                              </div>
                              <Progress value={evaluation.approachAlignmentScore * 10} className="h-1" />
                              {evaluation.approachAlignmentRemark && (
                                <p className="text-sm text-gray-500 mt-1">{evaluation.approachAlignmentRemark}</p>
                              )}
                            </div>
                            <Separator />
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Understanding Challenges Score</span>
                                <span className="font-medium">{evaluation.understandingChallengesScore}/10</span>
                              </div>
                              <Progress value={evaluation.understandingChallengesScore * 10} className="h-1" />
                              {evaluation.understandingChallengesRemark && (
                                <p className="text-sm text-gray-500 mt-1">{evaluation.understandingChallengesRemark}</p>
                              )}
                            </div>
                            <Separator />
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Solution Tailoring Score</span>
                                <span className="font-medium">{evaluation.solutionTailoringScore}/10</span>
                              </div>
                              <Progress value={evaluation.solutionTailoringScore * 10} className="h-1" />
                              {evaluation.solutionTailoringRemark && (
                                <p className="text-sm text-gray-500 mt-1">{evaluation.solutionTailoringRemark}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Add similar sections for other categories */}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}