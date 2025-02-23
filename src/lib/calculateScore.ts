export interface EvaluationScores {
  experienceScore: number
  caseStudiesScore: number
  domainExperienceScore: number
  approachAlignmentScore: number
  understandingChallengesScore: number
  solutionTailoringScore: number
  strategyAlignmentScore: number
  methodologyScore: number
  innovativeStrategiesScore: number
  stakeholderEngagementScore: number
  toolsFrameworkScore: number
  costStructureScore: number
  costEffectivenessScore: number
  roiScore: number
  referencesScore: number
  testimonialsScore: number
  sustainabilityScore: number
  deliverablesScore: number
}

export const calculateWeightedScore = (scores: EvaluationScores): number => {
  // 1. Relevance and Quality of Experience (25%)
  const experienceWeight = (
    (scores.experienceScore / 10 * 0.10) + // 10%
    (scores.caseStudiesScore / 10 * 0.10) + // 10%
    (scores.domainExperienceScore / 10 * 0.05) // 5%
  ) * 100

  // 2. Understanding of Project Objectives (20%)
  const understandingWeight = (
    (scores.approachAlignmentScore / 10 * 0.07) + // 7%
    (scores.understandingChallengesScore / 10 * 0.07) + // 7%
    (scores.solutionTailoringScore / 10 * 0.06) // 6%
  ) * 100

  // 3. Proposed Approach and Methodology (26%)
  const methodologyWeight = (
    (scores.strategyAlignmentScore / 10 * 0.07) + // 7%
    (scores.methodologyScore / 10 * 0.06) + // 6%
    (scores.innovativeStrategiesScore / 10 * 0.05) + // 5%
    (scores.stakeholderEngagementScore / 10 * 0.05) + // 5%
    (scores.toolsFrameworkScore / 10 * 0.03) // 3%
  ) * 100

  // 4. Cost and Value for Money (14%)
  const costWeight = (
    (scores.costStructureScore / 10 * 0.06) + // 6%
    (scores.costEffectivenessScore / 10 * 0.05) + // 5%
    (scores.roiScore / 10 * 0.03) // 3%
  ) * 100

  // 5. References and Testimonials (10%)
  const referencesWeight = (
    (scores.referencesScore / 10 * 0.06) + // 6%
    (scores.testimonialsScore / 10 * 0.02) + // 2%
    (scores.sustainabilityScore / 10 * 0.02) // 2%
  ) * 100

  // 6. Deliverable Completeness (5%)
  const deliverablesWeight = (scores.deliverablesScore / 10 * 0.05) * 100 // 5%

  return experienceWeight + understandingWeight + methodologyWeight + costWeight + referencesWeight + deliverablesWeight
}