import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const vendorId = parseInt(req.query.id as string);
    
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        evaluations: {
          include: {
            evaluator: true
          }
        },
        documents: true,
        votes: {
          include: {
            user: true
          }
        }
      }
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Calculate average scores per category if evaluations exist
    let averageScores = null;
    if (vendor.evaluations.length > 0) {
      averageScores = {
        relevanceAndExperience: vendor.evaluations.reduce((acc, evaluation) => 
          acc + (evaluation.experienceScore + evaluation.caseStudiesScore + evaluation.domainExperienceScore) / 3, 0) / vendor.evaluations.length,
        projectObjectives: vendor.evaluations.reduce((acc, evaluation) => 
          acc + (evaluation.approachAlignmentScore + evaluation.understandingChallengesScore + evaluation.solutionTailoringScore) / 3, 0) / vendor.evaluations.length,
        approachAndMethodology: vendor.evaluations.reduce((acc, evaluation) => 
          acc + (evaluation.strategyAlignmentScore + evaluation.methodologyScore + evaluation.innovativeStrategiesScore + 
          evaluation.stakeholderEngagementScore + evaluation.toolsFrameworkScore) / 5, 0) / vendor.evaluations.length,
        costAndValue: vendor.evaluations.reduce((acc, evaluation) => 
          acc + (evaluation.costStructureScore + evaluation.costEffectivenessScore + evaluation.roiScore) / 3, 0) / vendor.evaluations.length,
        referencesAndTestimonials: vendor.evaluations.reduce((acc, evaluation) => 
          acc + (evaluation.referencesScore + evaluation.testimonialsScore + evaluation.sustainabilityScore) / 3, 0) / vendor.evaluations.length,
        deliverables: vendor.evaluations.reduce((acc, evaluation) => 
          acc + evaluation.deliverablesScore, 0) / vendor.evaluations.length,
        overallAverage: vendor.evaluations.reduce((acc, evaluation) => 
          acc + evaluation.overallScore, 0) / vendor.evaluations.length
      };
    }

    const report = {
      vendorInfo: {
        name: vendor.name,
        scopes: vendor.scopes,
        rfiStatus: vendor.rfiStatus || 'Not Submitted',
        rfiReceivedAt: vendor.rfiReceivedAt ? new Date(vendor.rfiReceivedAt).toISOString() : null,
        finalDecision: vendor.finalDecision || 'Pending'
      },
      documents: vendor.documents.map(doc => ({
        name: doc.name,
        type: doc.type,
        domain: doc.domain,
        uploadedAt: doc.uploadedAt
      })),
      evaluations: vendor.evaluations.map(evaluation => ({
        evaluator: evaluation.evaluator.name,
        domain: evaluation.domain,
        overallScore: evaluation.overallScore,
        status: evaluation.status,
        details: {
          experienceRemark: evaluation.experienceRemark,
          caseStudiesRemark: evaluation.caseStudiesRemark,
          domainExperienceRemark: evaluation.domainExperienceRemark,
          approachAlignmentRemark: evaluation.approachAlignmentRemark,
          understandingChallengesRemark: evaluation.understandingChallengesRemark,
          solutionTailoringRemark: evaluation.solutionTailoringRemark,
          strategyAlignmentRemark: evaluation.strategyAlignmentRemark,
          methodologyRemark: evaluation.methodologyRemark,
          innovativeStrategiesRemark: evaluation.innovativeStrategiesRemark,
          stakeholderEngagementRemark: evaluation.stakeholderEngagementRemark,
          toolsFrameworkRemark: evaluation.toolsFrameworkRemark,
          costStructureRemark: evaluation.costStructureRemark,
          costEffectivenessRemark: evaluation.costEffectivenessRemark,
          roiRemark: evaluation.roiRemark,
          referencesRemark: evaluation.referencesRemark,
          testimonialsRemark: evaluation.testimonialsRemark,
          sustainabilityRemark: evaluation.sustainabilityRemark,
          deliverablesRemark: evaluation.deliverablesRemark
        }
      })),
      averageScores,
      voting: {
        accept: vendor.votes.filter(v => v.vote === 'ACCEPT').length,
        reject: vendor.votes.filter(v => v.vote === 'REJECT').length,
        total: vendor.votes.length
      }
    };

    return res.status(200).json(report);
  } catch (error) {
    console.error('Report generation error:', error);
    return res.status(500).json({ message: 'Error generating vendor report' });
  }
}