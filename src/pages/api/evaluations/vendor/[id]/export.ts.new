import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const vendorId = parseInt(req.query.id as string);
    
    // Fetch vendor and its evaluations
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        evaluations: {
          include: {
            evaluator: true
          }
        }
      }
    });

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // Prepare the workbook
    const wb = XLSX.utils.book_new();
    
    // Vendor Information Sheet
    const vendorInfo = {
      'Vendor Name': vendor.name,
      'Scopes': vendor.scopes.join(', '),
      'RFI Status': vendor.rfiStatus || 'Not Submitted',
      'RFI Received Date': vendor.rfiReceivedAt ? new Date(vendor.rfiReceivedAt).toLocaleDateString() : 'N/A',
      'Final Decision': vendor.finalDecision || 'Pending'
    };
    const vendorWs = XLSX.utils.json_to_sheet([vendorInfo]);
    XLSX.utils.book_append_sheet(wb, vendorWs, 'Vendor Information');

    if (vendor.evaluations.length > 0) {
      // Evaluations Sheet
      const evaluationsData = vendor.evaluations.map(evaluation => ({
        'Evaluator': evaluation.evaluator.name,
        'Domain': evaluation.domain,
        'Overall Score': evaluation.overallScore,
        'Status': evaluation.status,
        // Relevance and Quality of Experience
        'Experience Score': evaluation.experienceScore,
        'Experience Remarks': evaluation.experienceRemark || '',
        'Case Studies Score': evaluation.caseStudiesScore,
        'Case Studies Remarks': evaluation.caseStudiesRemark || '',
        'Domain Experience Score': evaluation.domainExperienceScore,
        'Domain Experience Remarks': evaluation.domainExperienceRemark || '',
        // Understanding of Project Objectives
        'Approach Alignment Score': evaluation.approachAlignmentScore,
        'Approach Alignment Remarks': evaluation.approachAlignmentRemark || '',
        'Understanding Challenges Score': evaluation.understandingChallengesScore,
        'Understanding Challenges Remarks': evaluation.understandingChallengesRemark || '',
        'Solution Tailoring Score': evaluation.solutionTailoringScore,
        'Solution Tailoring Remarks': evaluation.solutionTailoringRemark || '',
        // Proposed Approach and Methodology
        'Strategy Alignment Score': evaluation.strategyAlignmentScore,
        'Strategy Alignment Remarks': evaluation.strategyAlignmentRemark || '',
        'Methodology Score': evaluation.methodologyScore,
        'Methodology Remarks': evaluation.methodologyRemark || '',
        'Innovative Strategies Score': evaluation.innovativeStrategiesScore,
        'Innovative Strategies Remarks': evaluation.innovativeStrategiesRemark || '',
        'Stakeholder Engagement Score': evaluation.stakeholderEngagementScore,
        'Stakeholder Engagement Remarks': evaluation.stakeholderEngagementRemark || '',
        'Tools Framework Score': evaluation.toolsFrameworkScore,
        'Tools Framework Remarks': evaluation.toolsFrameworkRemark || '',
        // Cost and Value for Money
        'Cost Structure Score': evaluation.costStructureScore,
        'Cost Structure Remarks': evaluation.costStructureRemark || '',
        'Cost Effectiveness Score': evaluation.costEffectivenessScore,
        'Cost Effectiveness Remarks': evaluation.costEffectivenessRemark || '',
        'ROI Score': evaluation.roiScore,
        'ROI Remarks': evaluation.roiRemark || '',
        // References and Testimonials
        'References Score': evaluation.referencesScore,
        'References Remarks': evaluation.referencesRemark || '',
        'Testimonials Score': evaluation.testimonialsScore,
        'Testimonials Remarks': evaluation.testimonialsRemark || '',
        'Sustainability Score': evaluation.sustainabilityScore,
        'Sustainability Remarks': evaluation.sustainabilityRemark || '',
        // Deliverable Completeness
        'Deliverables Score': evaluation.deliverablesScore,
        'Deliverables Remarks': evaluation.deliverablesRemark || '',
      }));

      const evalWs = XLSX.utils.json_to_sheet(evaluationsData);
      XLSX.utils.book_append_sheet(wb, evalWs, 'Evaluations');
    } else {
      // No Evaluations Sheet
      const noEvalWs = XLSX.utils.json_to_sheet([{ 'Status': 'No evaluations available for this vendor' }]);
      XLSX.utils.book_append_sheet(wb, noEvalWs, 'Evaluations');
    }

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${vendor.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_evaluation.xlsx`);
    
    return res.send(buf);
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ message: 'Error exporting vendor evaluation' });
  }
}