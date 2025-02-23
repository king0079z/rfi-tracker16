import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Printer } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface VendorActionsProps {
  vendorId: number;
  vendorName: string;
}

export function VendorActions({ vendorId, vendorName }: VendorActionsProps) {
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`/api/evaluations/vendor/${vendorId}/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to export evaluation');

      // Get the filename from the Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/["']/g, '')
        : `${vendorName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_evaluation.xlsx`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: "The evaluation has been exported successfully.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export the evaluation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await fetch(`/api/vendors/${vendorId}/report`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const data = await response.json();

      // Create a printable view
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Pop-up blocked. Please allow pop-ups to print the report.');
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>${vendorName} - Evaluation Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1, h2, h3 { color: #1a1a1a; }
              .section { margin-bottom: 20px; }
              .score { color: #0066cc; font-weight: bold; }
              .remark { margin-left: 20px; color: #666; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
            </style>
          </head>
          <body>
            <h1>${vendorName} - Evaluation Report</h1>
            
            <div class="section">
              <h2>Vendor Information</h2>
              <table>
                <tr><th>Scopes</th><td>${data.vendorInfo.scopes.join(', ')}</td></tr>
                <tr><th>RFI Status</th><td>${data.vendorInfo.rfiStatus}</td></tr>
                <tr><th>RFI Received Date</th><td>${data.vendorInfo.rfiReceivedAt ? new Date(data.vendorInfo.rfiReceivedAt).toLocaleDateString() : 'N/A'}</td></tr>
                <tr><th>Final Decision</th><td>${data.vendorInfo.finalDecision}</td></tr>
              </table>
            </div>

            ${data.evaluations.length > 0 ? `
              <div class="section">
                <h2>Evaluation Summary</h2>
                <table>
                  <tr>
                    <th>Category</th>
                    <th>Average Score</th>
                  </tr>
                  <tr><td>Relevance and Experience</td><td class="score">${(data.averageScores.relevanceAndExperience * 10).toFixed(2)}%</td></tr>
                  <tr><td>Project Objectives</td><td class="score">${(data.averageScores.projectObjectives * 10).toFixed(2)}%</td></tr>
                  <tr><td>Approach and Methodology</td><td class="score">${(data.averageScores.approachAndMethodology * 10).toFixed(2)}%</td></tr>
                  <tr><td>Cost and Value</td><td class="score">${(data.averageScores.costAndValue * 10).toFixed(2)}%</td></tr>
                  <tr><td>References and Testimonials</td><td class="score">${(data.averageScores.referencesAndTestimonials * 10).toFixed(2)}%</td></tr>
                  <tr><td>Deliverables</td><td class="score">${(data.averageScores.deliverables * 10).toFixed(2)}%</td></tr>
                  <tr><th>Overall Average</th><th class="score">${(data.averageScores.overallAverage).toFixed(2)}%</th></tr>
                </table>
              </div>

              <div class="section">
                <h2>Detailed Evaluations</h2>
                ${data.evaluations.map((evaluation: any) => `
                  <div class="evaluation">
                    <h3>Evaluator: ${evaluation.evaluator}</h3>
                    <p>Domain: ${evaluation.domain}</p>
                    <p>Overall Score: <span class="score">${evaluation.overallScore.toFixed(2)}%</span></p>
                    <p>Status: ${evaluation.status}</p>
                    
                    <h4>Remarks:</h4>
                    ${Object.entries(evaluation.details)
                      .filter(([_, value]) => value)
                      .map(([key, value]) => `
                        <div class="remark">
                          <strong>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace('Remark', '')}</strong>: ${value}
                        </div>
                      `).join('')}
                  </div>
                `).join('<hr>')}
              </div>
            ` : '<h2>No evaluations available for this vendor</h2>'}

            <div class="section">
              <h2>Voting Summary</h2>
              <table>
                <tr>
                  <th>Accept Votes</th>
                  <td>${data.voting.accept}</td>
                </tr>
                <tr>
                  <th>Reject Votes</th>
                  <td>${data.voting.reject}</td>
                </tr>
                <tr>
                  <th>Total Votes</th>
                  <td>${data.voting.total}</td>
                </tr>
              </table>
            </div>
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();
      printWindow.print();

      toast({
        title: "Report Generated",
        description: "The report has been generated and opened in a new window.",
      });
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Report Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate the report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handleExport}
        title="Export Evaluation"
      >
        <FileDown className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrint}
        title="Print Report"
      >
        <Printer className="h-4 w-4" />
      </Button>
    </div>
  );
}