import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { role, evaluatorId } = req.user;

  if (req.method === 'GET') {
    try {
      // Define access control based on role
      let evaluations;
      
      switch (role) {
        case 'CONTRIBUTOR':
          if (!evaluatorId) {
            console.error('Missing evaluatorId for contributor');
            return res.status(400).json({ error: 'Invalid evaluator ID' });
          }
          // Contributors can only see their own evaluations
          evaluations = await prisma.evaluation.findMany({
            where: {
              evaluatorId: evaluatorId,
            },
            include: {
              vendor: true,
              evaluator: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                  email: true
                }
              },
            },
            orderBy: {
              createdAt: 'desc'
            },
          });
          break;
          
        case 'DECISION_MAKER':
        case 'ADMIN':
          // Decision makers and admins can see all evaluations
          evaluations = await prisma.evaluation.findMany({
            include: {
              vendor: true,
              evaluator: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                  email: true
                }
              },
            },
            orderBy: {
              createdAt: 'desc'
            },
          });
          break;
          
        default:
          console.error(`Invalid role: ${role}`);
          return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return res.status(200).json(evaluations);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      return res.status(500).json({ error: 'Failed to fetch evaluations' });
    }
  }

  if (req.method === 'POST') {
    try {
      console.log('Received evaluation submission:', JSON.stringify(req.body, null, 2));
      console.log('User context:', JSON.stringify(req.user, null, 2));

      // Get or create evaluator ID based on user role
      let effectiveEvaluatorId = evaluatorId;
      
      if (!effectiveEvaluatorId && (role === 'DECISION_MAKER' || role === 'ADMIN')) {
        // Create or get evaluator record for decision makers and admins
        const evaluator = await prisma.evaluator.upsert({
          where: {
            userId: req.user.userId,
          },
          update: {},
          create: {
            userId: req.user.userId,
            role: role,
            name: req.user.email, // Using email as name if not provided
            email: req.user.email,
          },
        });
        effectiveEvaluatorId = evaluator.id;
        console.log('Created/Retrieved evaluator record:', evaluator);
      }

      if (!effectiveEvaluatorId) {
        console.error('No evaluator ID found for user:', req.user);
        return res.status(400).json({ error: 'Unable to determine evaluator ID. Please contact support.' });
      }

      const { 
        vendorId, 
        domain,
        overallScore,
        experienceScore,
        caseStudiesScore,
        domainExperienceScore,
        approachAlignmentScore,
        understandingChallengesScore,
        solutionTailoringScore,
        strategyAlignmentScore,
        methodologyScore,
        innovativeStrategiesScore,
        stakeholderEngagementScore,
        toolsFrameworkScore,
        costStructureScore,
        costEffectivenessScore,
        roiScore,
        referencesScore,
        testimonialsScore,
        sustainabilityScore,
        deliverablesScore,
        experienceRemark,
        caseStudiesRemark,
        domainExperienceRemark,
        approachAlignmentRemark,
        understandingChallengesRemark,
        solutionTailoringRemark,
        strategyAlignmentRemark,
        methodologyRemark,
        innovativeStrategiesRemark,
        stakeholderEngagementRemark,
        toolsFrameworkRemark,
        costStructureRemark,
        costEffectivenessRemark,
        roiRemark,
        referencesRemark,
        testimonialsRemark,
        sustainabilityRemark,
        deliverablesRemark,
      } = req.body;

      // Validate vendorId
      if (!vendorId) {
        console.error('Missing vendorId');
        return res.status(400).json({ error: 'Missing vendorId' });
      }

      // Validate that all score fields are numbers between 0 and 10
      const scoreFields = [
        'experienceScore', 'caseStudiesScore', 'domainExperienceScore',
        'approachAlignmentScore', 'understandingChallengesScore', 'solutionTailoringScore',
        'strategyAlignmentScore', 'methodologyScore', 'innovativeStrategiesScore',
        'stakeholderEngagementScore', 'toolsFrameworkScore', 'costStructureScore',
        'costEffectivenessScore', 'roiScore', 'referencesScore', 'testimonialsScore',
        'sustainabilityScore', 'deliverablesScore'
      ];

      const missingScores = scoreFields.filter(field => {
        const score = req.body[field];
        return typeof score !== 'number' || score < 0 || score > 10;
      });

      if (missingScores.length > 0) {
        console.error('Invalid scores:', missingScores);
        return res.status(400).json({ 
          error: 'Invalid scores detected',
          details: `The following scores are missing or invalid: ${missingScores.join(', ')}`
        });
      }

      // Check if an evaluation already exists for this vendor and evaluator
      const existingEvaluation = await prisma.evaluation.findFirst({
        where: {
          vendorId: vendorId,
          evaluatorId: effectiveEvaluatorId,
        },
      });

      if (existingEvaluation) {
        console.error('Evaluation already exists for this vendor and evaluator');
        return res.status(409).json({ error: 'Evaluation already exists for this vendor' });
      }

      const evaluation = await prisma.evaluation.create({
        data: {
          vendorId,
          evaluatorId: effectiveEvaluatorId,
          domain,
          overallScore,
          status: 'SUBMITTED',
          experienceScore,
          caseStudiesScore,
          domainExperienceScore,
          approachAlignmentScore,
          understandingChallengesScore,
          solutionTailoringScore,
          strategyAlignmentScore,
          methodologyScore,
          innovativeStrategiesScore,
          stakeholderEngagementScore,
          toolsFrameworkScore,
          costStructureScore,
          costEffectivenessScore,
          roiScore,
          referencesScore,
          testimonialsScore,
          sustainabilityScore,
          deliverablesScore,
          experienceRemark,
          caseStudiesRemark,
          domainExperienceRemark,
          approachAlignmentRemark,
          understandingChallengesRemark,
          solutionTailoringRemark,
          strategyAlignmentRemark,
          methodologyRemark,
          innovativeStrategiesRemark,
          stakeholderEngagementRemark,
          toolsFrameworkRemark,
          costStructureRemark,
          costEffectivenessRemark,
          roiRemark,
          referencesRemark,
          testimonialsRemark,
          sustainabilityRemark,
          deliverablesRemark,
        },
        include: {
          vendor: true,
          evaluator: {
            select: {
              id: true,
              name: true,
              role: true,
              email: true
            }
          },
        },
      });

      return res.status(201).json(evaluation);
    } catch (error) {
      console.error('Error creating evaluation:', error);
      return res.status(500).json({ error: 'Failed to create evaluation' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);