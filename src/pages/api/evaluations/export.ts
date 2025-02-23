import { NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth';
import * as XLSX from 'xlsx';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (!req.user) {
    console.error('Export attempt without authentication');
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if export is enabled in admin settings
    const adminSettings = await prisma.adminSettings.findFirst({
      where: { id: 1 }
    });

    if (!adminSettings?.exportEnabled) {
      console.error('Export functionality is disabled by admin');
      return res.status(403).json({ error: 'Export functionality is currently disabled' });
    }

    // Check user's export permission
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user?.canExportData) {
      console.error(`User ${user?.email} attempted to export without permission`);
      return res.status(403).json({ error: 'You do not have permission to export data' });
    }

    const vendorId = req.query.vendorId as string | undefined;
    console.log(`Starting export process for ${vendorId ? `vendor ${vendorId}` : 'all vendors'}`);

    // Fetch all vendors first
    const vendors = await prisma.vendor.findMany({
      where: vendorId ? { id: parseInt(vendorId) } : {},
      include: {
        evaluations: {
          include: {
            evaluator: {
              select: {
                id: true,
                name: true,
                role: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`Found ${vendors.length} vendors to process`);

    // Transform data for Excel - include vendors with no evaluations
    const excelData = vendors.flatMap(vendor => {
      // If vendor has no evaluations, create one row with empty evaluation data
      if (vendor.evaluations.length === 0) {
        return [{
          'Vendor Name': vendor.name,
          'Evaluator Name': 'No evaluation',
          'Evaluator Role': 'N/A',
          'Domain': vendor.scopes.join(', '),
          'Overall Score': 'No score',
          'Experience Score': 'N/A',
          'Experience Remarks': '',
          'Case Studies Score': 'N/A',
          'Case Studies Remarks': '',
          'Domain Experience Score': 'N/A',
          'Domain Experience Remarks': '',
          'Approach Alignment Score': 'N/A',
          'Approach Alignment Remarks': '',
          'Understanding Challenges Score': 'N/A',
          'Understanding Challenges Remarks': '',
          'Solution Tailoring Score': 'N/A',
          'Solution Tailoring Remarks': '',
          'Strategy Alignment Score': 'N/A',
          'Strategy Alignment Remarks': '',
          'Methodology Score': 'N/A',
          'Methodology Remarks': '',
          'Innovative Strategies Score': 'N/A',
          'Innovative Strategies Remarks': '',
          'Stakeholder Engagement Score': 'N/A',
          'Stakeholder Engagement Remarks': '',
          'Tools Framework Score': 'N/A',
          'Tools Framework Remarks': '',
          'Cost Structure Score': 'N/A',
          'Cost Structure Remarks': '',
          'Cost Effectiveness Score': 'N/A',
          'Cost Effectiveness Remarks': '',
          'ROI Score': 'N/A',
          'ROI Remarks': '',
          'References Score': 'N/A',
          'References Remarks': '',
          'Testimonials Score': 'N/A',
          'Testimonials Remarks': '',
          'Sustainability Score': 'N/A',
          'Sustainability Remarks': '',
          'Deliverables Score': 'N/A',
          'Deliverables Remarks': '',
          'Final Decision': vendor.finalDecision || 'Pending',
          'RFI Status': vendor.rfiStatus || 'Not Received',
          'RFI Received Date': vendor.rfiReceivedAt ? new Date(vendor.rfiReceivedAt).toLocaleDateString() : 'N/A',
          'Evaluation Date': 'No evaluation'
        }];
      }

      // If vendor has evaluations, create a row for each evaluation
      return vendor.evaluations.map(evaluation => ({
        'Vendor Name': vendor.name,
        'Evaluator Name': evaluation.evaluator.name,
        'Evaluator Role': evaluation.evaluator.role,
        'Domain': evaluation.domain,
        'Overall Score': evaluation.overallScore,
        'Experience Score': evaluation.experienceScore,
        'Experience Remarks': evaluation.experienceRemark || '',
        'Case Studies Score': evaluation.caseStudiesScore,
        'Case Studies Remarks': evaluation.caseStudiesRemark || '',
        'Domain Experience Score': evaluation.domainExperienceScore,
        'Domain Experience Remarks': evaluation.domainExperienceRemark || '',
        'Approach Alignment Score': evaluation.approachAlignmentScore,
        'Approach Alignment Remarks': evaluation.approachAlignmentRemark || '',
        'Understanding Challenges Score': evaluation.understandingChallengesScore,
        'Understanding Challenges Remarks': evaluation.understandingChallengesRemark || '',
        'Solution Tailoring Score': evaluation.solutionTailoringScore,
        'Solution Tailoring Remarks': evaluation.solutionTailoringRemark || '',
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
        'Cost Structure Score': evaluation.costStructureScore,
        'Cost Structure Remarks': evaluation.costStructureRemark || '',
        'Cost Effectiveness Score': evaluation.costEffectivenessScore,
        'Cost Effectiveness Remarks': evaluation.costEffectivenessRemark || '',
        'ROI Score': evaluation.roiScore,
        'ROI Remarks': evaluation.roiRemark || '',
        'References Score': evaluation.referencesScore,
        'References Remarks': evaluation.referencesRemark || '',
        'Testimonials Score': evaluation.testimonialsScore,
        'Testimonials Remarks': evaluation.testimonialsRemark || '',
        'Sustainability Score': evaluation.sustainabilityScore,
        'Sustainability Remarks': evaluation.sustainabilityRemark || '',
        'Deliverables Score': evaluation.deliverablesScore,
        'Deliverables Remarks': evaluation.deliverablesRemark || '',
        'Final Decision': vendor.finalDecision || 'Pending',
        'RFI Status': vendor.rfiStatus || 'Not Received',
        'RFI Received Date': vendor.rfiReceivedAt ? new Date(vendor.rfiReceivedAt).toLocaleDateString() : 'N/A',
        'Evaluation Date': new Date(evaluation.createdAt).toLocaleDateString()
      }));
    });

    if (excelData.length === 0) {
      console.log('No vendors found for export');
      return res.status(404).json({ error: 'No vendors found to export' });
    }

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Auto-size columns
    const colWidths = Object.keys(excelData[0] || {}).map(key => ({
      wch: Math.max(key.length, 20)
    }));
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Vendor Evaluations');

    // Generate buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=vendor-evaluations${vendorId ? '-' + vendors[0]?.name.replace(/[^a-z0-9]/gi, '-').toLowerCase() : ''}.xlsx`);
    
    console.log('Export completed successfully');
    return res.send(buf);
  } catch (error) {
    console.error('Error generating Excel report:', error);
    return res.status(500).json({ 
      error: 'Failed to generate Excel report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default withAuth(handler);