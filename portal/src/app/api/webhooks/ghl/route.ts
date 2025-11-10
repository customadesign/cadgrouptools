import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import GoHighLevelSubmission from '@/models/GoHighLevelSubmission';
import ManusTask from '@/models/ManusTask';
import Proposal from '@/models/Proposal';
import Client from '@/models/Client';
import ghlService from '@/services/ghlService';
import manusService from '@/services/manusService';

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('X-GHL-Signature') || 
                     request.headers.get('X-Webhook-Signature') || '';

    // Verify webhook signature
    if (!ghlService.verifyWebhookSignature(rawBody, signature)) {
      console.error('Invalid GoHighLevel webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody);
    
    console.log('Received GoHighLevel webhook:', {
      type: payload.type,
      formId: payload.formId,
    });

    // Only handle form submissions
    if (payload.type !== 'FormSubmitted' && payload.event !== 'form.submitted') {
      return NextResponse.json({ success: true, message: 'Event ignored' });
    }

    // Connect to database
    await connectToDatabase();

    // Parse the form submission
    const formData = ghlService.parseFormSubmission(payload);
    const formId = formData.formId;

    // Identify which company this submission belongs to
    const company = ghlService.identifyCompany(formId);

    if (!company) {
      console.error('Could not identify company for form:', formId);
      return NextResponse.json(
        { error: 'Unknown form' },
        { status: 400 }
      );
    }

    // Create GoHighLevelSubmission record
    const submission = await GoHighLevelSubmission.create({
      formId,
      formName: payload.formName || 'Unknown Form',
      submissionData: formData,
      company,
      status: 'received',
      clientEmail: formData.email,
      clientOrganization: formData.organization,
      webhookPayload: payload,
    });

    console.log('Created GHL submission record:', submission._id);

    // Create or update client record
    let client = null;
    if (formData.email) {
      client = await Client.findOneAndUpdate(
        { email: formData.email },
        {
          organization: formData.organization || 'Unknown',
          website: formData.website,
          email: formData.email,
          phone: formData.phone,
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
        { upsert: true, new: true }
      );
    }

    // Create Manus task based on company
    let manusTask;
    
    try {
      if (company === 'murphy') {
        manusTask = await manusService.createMurphyProposalTask(formData);
      } else if (company === 'esystems') {
        manusTask = await manusService.createESystemsProposalTask(formData);
      }

      if (manusTask) {
        // Create ManusTask record
        const manusTaskRecord = await ManusTask.create({
          manusTaskId: manusTask.id,
          taskType: company === 'murphy' ? 'proposal_murphy' : 'proposal_esystems',
          company,
          status: 'pending',
          inputData: formData,
        });

        // Create Proposal record
        const proposal = await Proposal.create({
          client: client?._id,
          status: 'draft',
          selectedServices: formData.services || [],
          murphyRate: company === 'murphy' ? 35 : undefined,
          researchJson: {
            formSubmission: formData,
            submittedAt: formData.submittedAt,
          },
        });

        // Link proposal to ManusTask
        manusTaskRecord.proposalId = proposal._id;
        await manusTaskRecord.save();

        // Update submission with Manus task and proposal IDs
        submission.manusTaskId = manusTask.id;
        submission.proposalId = proposal._id;
        submission.status = 'processing';
        await submission.save();

        console.log('Created proposal and Manus task:', {
          proposalId: proposal._id,
          manusTaskId: manusTask.id,
        });
      }
    } catch (error: any) {
      console.error('Error creating Manus task:', error);
      submission.status = 'failed';
      submission.errorMessage = error.message;
      await submission.save();

      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create Manus task',
          submissionId: submission._id 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      submissionId: submission._id,
      manusTaskId: manusTask?.id,
      company,
    });

  } catch (error: any) {
    console.error('Error processing GoHighLevel webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// Allow only POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

