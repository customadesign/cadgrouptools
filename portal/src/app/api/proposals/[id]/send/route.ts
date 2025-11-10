import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Proposal } from '@/models/Proposal';
import ManusTask from '@/models/ManusTask';
import { requireAuth } from '@/lib/auth';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.EMAIL_SERVER_PASSWORD) {
  sgMail.setApiKey(process.env.EMAIL_SERVER_PASSWORD);
}

// POST /api/proposals/[id]/send - Send proposal to client
export const POST = requireAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const body = await request.json();
    const { email, message } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Get proposal and manus task
    const proposal = await Proposal.findById(params.id)
      .populate('client', 'organization website email')
      .lean();

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }

    const manusTask = await ManusTask.findOne({ proposalId: params.id }).lean();
    const googleSlidesUrl = proposal.pdfKey || manusTask?.outputData?.slides_url;

    if (!googleSlidesUrl) {
      return NextResponse.json(
        { error: 'Proposal Google Slides not available yet' },
        { status: 400 }
      );
    }

    // Determine company name
    const companyName = manusTask?.taskType === 'proposal_esystems' 
      ? 'E-Systems Management' 
      : 'Murphy Consulting';

    // Send email via SendGrid
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM || 'noreply@cadgrouptools.com',
      subject: `Your ${companyName} Proposal`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your Proposal from ${companyName}</h2>
          
          <p>Dear ${(proposal.client as any)?.organization || 'Valued Client'},</p>
          
          ${message ? `<p>${message.replace(/\n/g, '<br>')}</p>` : ''}
          
          <p>Thank you for your interest in our services. We've prepared a detailed proposal for you.</p>
          
          <p style="margin: 30px 0;">
            <a href="${googleSlidesUrl}" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              View Your Proposal
            </a>
          </p>
          
          <p>If you have any questions or would like to discuss the proposal, please don't hesitate to reach out.</p>
          
          <p>Best regards,<br>
          The ${companyName} Team</p>
          
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; color: #666;">
            This is an automated email from ${companyName}. Please do not reply directly to this email.
          </p>
        </div>
      `,
    };

    await sgMail.send(msg);

    // Update proposal status
    await Proposal.findByIdAndUpdate(params.id, {
      status: 'sent',
      sentAt: new Date(),
    });

    return NextResponse.json({ 
      success: true,
      message: 'Proposal sent successfully'
    });

  } catch (error: any) {
    console.error('Error sending proposal email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
});

