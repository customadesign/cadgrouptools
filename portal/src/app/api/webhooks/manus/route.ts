import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import ManusTask from '@/models/ManusTask';
import AccountingDocument from '@/models/AccountingDocument';
import Proposal from '@/models/Proposal';
import manusService from '@/services/manusService';

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('X-Webhook-Signature') || '';

    // Verify webhook signature
    if (!manusService.verifyWebhookSignature(rawBody, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse the webhook payload
    const payload = JSON.parse(rawBody);
    const { event, task_id, data } = payload;

    console.log('Received Manus webhook:', { event, task_id });

    // Connect to database
    await connectToDatabase();

    // Find the corresponding ManusTask record
    const manusTask = await ManusTask.findOne({ manusTaskId: task_id });

    if (!manusTask) {
      console.error('ManusTask not found for task_id:', task_id);
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Add webhook event to history
    manusTask.webhookEvents.push({
      timestamp: new Date(),
      status: event,
      data: data,
    });

    // Handle different webhook events
    switch (event) {
      case 'task.completed':
        await handleTaskCompleted(manusTask, data);
        break;

      case 'task.failed':
        await handleTaskFailed(manusTask, data);
        break;

      case 'task.processing':
        manusTask.status = 'processing';
        await manusTask.save();
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error processing Manus webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Handle task completion webhook
 */
async function handleTaskCompleted(manusTask: any, data: any) {
  manusTask.status = 'completed';
  manusTask.outputData = data;

  // Handle based on task type
  switch (manusTask.taskType) {
    case 'proposal_murphy':
    case 'proposal_esystems':
      await handleProposalCompleted(manusTask, data);
      break;

    case 'accounting':
      await handleAccountingCompleted(manusTask, data);
      break;
  }

  await manusTask.save();
}

/**
 * Handle task failure webhook
 */
async function handleTaskFailed(manusTask: any, data: any) {
  manusTask.status = 'failed';
  manusTask.outputData = data;

  // Update related records
  if (manusTask.proposalId) {
    await Proposal.findByIdAndUpdate(manusTask.proposalId, {
      status: 'failed',
      error: data.error || 'Manus task failed',
    });
  }

  if (manusTask.accountingUploadId) {
    await AccountingDocument.findByIdAndUpdate(manusTask.accountingUploadId, {
      processingStatus: 'failed',
      errorMessage: data.error || 'Manus task failed',
    });
  }

  await manusTask.save();
}

/**
 * Handle proposal task completion
 */
async function handleProposalCompleted(manusTask: any, data: any) {
  if (!manusTask.proposalId) {
    console.error('No proposalId associated with completed proposal task');
    return;
  }

  // Extract proposal data from Manus output
  const proposalData = {
    status: 'finalized',
    htmlDraft: data.proposal_html || data.html || '',
    pdfKey: data.pdf_url || data.document_url || '',
    googleSlidesUrl: data.slides_url || data.presentation_url || '',
    researchJson: data.research || data.analysis || {},
    completedAt: new Date(),
  };

  // Update the proposal record
  await Proposal.findByIdAndUpdate(manusTask.proposalId, proposalData);

  console.log('Proposal completed:', manusTask.proposalId);
}

/**
 * Handle accounting task completion
 */
async function handleAccountingCompleted(manusTask: any, data: any) {
  if (!manusTask.accountingUploadId) {
    console.error('No accountingUploadId associated with completed accounting task');
    return;
  }

  // Extract analysis results from Manus output
  const analysisData = {
    processingStatus: 'completed',
    analysisResult: {
      transactions: data.transactions || [],
      summary: data.summary || {},
      plStatement: data.pl_statement || data.profit_loss || {},
      insights: data.insights || [],
      extractedAt: new Date(),
    },
  };

  // Update the accounting document record
  await AccountingDocument.findByIdAndUpdate(
    manusTask.accountingUploadId,
    analysisData
  );

  // If this is a monthly P&L, we might want to trigger additional processing
  if (data.pl_statement) {
    console.log('P&L statement generated for company:', manusTask.company);
    // Could trigger notifications, reports, etc.
  }

  console.log('Accounting analysis completed:', manusTask.accountingUploadId);
}

// Allow only POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

