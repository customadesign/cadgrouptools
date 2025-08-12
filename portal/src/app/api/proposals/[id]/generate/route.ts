import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Proposal } from '@/models/Proposal';
import { Client } from '@/models/Client';
import { requireAuth } from '@/lib/auth';

// POST /api/proposals/[id]/generate - Trigger research and generation for a proposal
export const POST = requireAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    const body = await request.json();
    const { regenerate = false } = body;

    await connectToDatabase();

    // Get proposal with client data
    const proposal = await Proposal.findById(id).populate('client');
    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    // Check if already has research and not regenerating
    if (proposal.researchJson && !regenerate) {
      return NextResponse.json(
        { error: 'Proposal already has research data. Set regenerate=true to regenerate.' },
        { status: 400 }
      );
    }

    // Prepare data for research pipeline
    const researchPayload = {
      proposalId: proposal._id.toString(),
      client: {
        organization: proposal.client.organization,
        website: proposal.client.website,
        industry: proposal.client.industry,
        email: proposal.client.email,
        phone: proposal.client.phone,
        address: proposal.client.address,
      },
      services: proposal.selectedServices,
      rates: {
        murphy: proposal.murphyRate,
        client: proposal.clientRate,
      },
    };

    // TODO: Integrate with actual CrewAI research pipeline
    // For now, we'll simulate the research process
    const mockResearchData = {
      websiteAnalysis: {
        status: 'active',
        technologies: ['WordPress', 'PHP', 'MySQL'],
        pageCount: 12,
        lastUpdated: '2024-01-15',
        seoScore: 65,
        performanceScore: 72,
        issues: [
          'Missing meta descriptions on 5 pages',
          'No SSL certificate detected',
          'Mobile responsiveness issues on 3 pages',
        ],
      },
      marketAnalysis: {
        industry: proposal.client.industry || 'General Business',
        competitors: 5,
        marketSize: '$2.3B',
        growthRate: '8.5%',
        trends: [
          'Increased focus on mobile-first design',
          'Growing demand for e-commerce integration',
          'Rise in voice search optimization',
        ],
      },
      seoOverview: {
        domainAuthority: 25,
        organicTraffic: 1200,
        topKeywords: [
          { keyword: 'business solutions', position: 15, volume: 500 },
          { keyword: 'consulting services', position: 8, volume: 300 },
        ],
        backlinks: 45,
        recommendations: [
          'Optimize for local SEO',
          'Create more long-form content',
          'Build high-quality backlinks',
        ],
      },
      proposedSolutions: {
        immediate: [
          'Fix SSL certificate issue',
          'Optimize mobile responsiveness',
          'Add missing meta descriptions',
        ],
        shortTerm: [
          'Implement SEO best practices',
          'Improve site speed',
          'Create content calendar',
        ],
        longTerm: [
          'Develop comprehensive digital marketing strategy',
          'Build custom CRM integration',
          'Implement advanced analytics',
        ],
      },
      estimatedTimeline: {
        phase1: '2-3 weeks',
        phase2: '4-6 weeks',
        phase3: '2-3 months',
      },
      investmentEstimate: {
        minimum: 5000,
        recommended: 12000,
        premium: 25000,
      },
    };

    // Generate HTML draft based on research
    const htmlDraft = generateProposalHTML(proposal, mockResearchData);

    // Update proposal with research data and HTML draft
    proposal.researchJson = mockResearchData;
    proposal.htmlDraft = htmlDraft;
    await proposal.save();

    return NextResponse.json({
      message: 'Proposal generation initiated',
      proposal: {
        id: proposal._id,
        status: proposal.status,
        hasResearch: true,
        hasHtmlDraft: true,
      },
    });
  } catch (error) {
    console.error('Error generating proposal:', error);
    return NextResponse.json(
      { error: 'Failed to generate proposal' },
      { status: 500 }
    );
  }
});

function generateProposalHTML(proposal: any, research: any): string {
  const client = proposal.client;
  const services = proposal.selectedServices.join(', ');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposal for ${client.organization}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1, h2, h3 {
            color: #1677ff;
        }
        .header {
            border-bottom: 3px solid #1677ff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .section {
            margin-bottom: 30px;
        }
        .services {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 5px;
        }
        .timeline {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
        }
        .phase {
            flex: 1;
            text-align: center;
            padding: 10px;
            background: #e8f4ff;
            margin: 0 5px;
            border-radius: 5px;
        }
        .investment {
            background: #fff3e0;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Strategic Proposal for ${client.organization}</h1>
        <p><strong>Prepared by:</strong> CADGroup Management</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <p>Based on our comprehensive analysis of ${client.organization}'s digital presence and market position, 
        we have identified key opportunities to enhance your online visibility, improve user engagement, 
        and drive business growth.</p>
    </div>

    <div class="section">
        <h2>Current State Analysis</h2>
        <h3>Website Performance</h3>
        <p>SEO Score: ${research.seoOverview.domainAuthority}/100</p>
        <p>Performance Score: ${research.websiteAnalysis.performanceScore}/100</p>
        <h3>Key Issues Identified</h3>
        <ul>
            ${research.websiteAnalysis.issues.map((issue: string) => `<li>${issue}</li>`).join('')}
        </ul>
    </div>

    <div class="section">
        <h2>Market Insights</h2>
        <p><strong>Industry:</strong> ${research.marketAnalysis.industry}</p>
        <p><strong>Market Size:</strong> ${research.marketAnalysis.marketSize}</p>
        <p><strong>Growth Rate:</strong> ${research.marketAnalysis.growthRate} annually</p>
        <h3>Current Trends</h3>
        <ul>
            ${research.marketAnalysis.trends.map((trend: string) => `<li>${trend}</li>`).join('')}
        </ul>
    </div>

    <div class="section services">
        <h2>Proposed Services</h2>
        <p>We recommend the following services to address your needs:</p>
        <p><strong>${services}</strong></p>
    </div>

    <div class="section">
        <h2>Implementation Timeline</h2>
        <div class="timeline">
            <div class="phase">
                <h3>Phase 1</h3>
                <p>${research.estimatedTimeline.phase1}</p>
                <p>Foundation & Quick Wins</p>
            </div>
            <div class="phase">
                <h3>Phase 2</h3>
                <p>${research.estimatedTimeline.phase2}</p>
                <p>Core Development</p>
            </div>
            <div class="phase">
                <h3>Phase 3</h3>
                <p>${research.estimatedTimeline.phase3}</p>
                <p>Growth & Optimization</p>
            </div>
        </div>
    </div>

    <div class="section investment">
        <h2>Investment Options</h2>
        <p><strong>Starter Package:</strong> $${research.investmentEstimate.minimum.toLocaleString()}</p>
        <p><strong>Recommended Package:</strong> $${research.investmentEstimate.recommended.toLocaleString()}</p>
        <p><strong>Premium Package:</strong> $${research.investmentEstimate.premium.toLocaleString()}</p>
    </div>

    <div class="section">
        <h2>Next Steps</h2>
        <ol>
            <li>Review this proposal with your team</li>
            <li>Schedule a consultation to discuss your specific needs</li>
            <li>Select your preferred service package</li>
            <li>Begin implementation within 1-2 weeks</li>
        </ol>
    </div>

    <div class="footer">
        <p>© ${new Date().getFullYear()} CADGroup Management. All rights reserved.</p>
        <p>This proposal is valid for 30 days from the date of issue.</p>
    </div>
</body>
</html>
  `;
}