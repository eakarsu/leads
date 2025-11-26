import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface WorkflowNode {
  id: string;
  type: string;
  data: any;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

async function executeTestWorkflow(
  objectId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  objectType: string,
  userId: string
) {
  const executionLog: any[] = [];

  // Find trigger node - check both n.type and n.data.type for compatibility
  const triggerNode = nodes.find((n) => n.type === 'trigger' || n.data?.type === 'trigger');
  if (!triggerNode) {
    throw new Error('No trigger node found');
  }

  // Execute workflow starting from trigger
  await executeNode(triggerNode, nodes, edges, objectId, objectType, executionLog, userId);

  return { success: true, log: executionLog };
}

async function executeNode(
  node: WorkflowNode,
  allNodes: WorkflowNode[],
  edges: WorkflowEdge[],
  objectId: string,
  objectType: string,
  log: any[],
  userId: string
) {
  // Get the actual node type - check both node.type and node.data.type
  const nodeType = node.data?.type || node.type;

  log.push({
    nodeId: node.id,
    nodeType: nodeType,
    timestamp: new Date().toISOString(),
    status: 'started',
  });

  try {
    let nextNodes: WorkflowNode[] = [];

    switch (nodeType) {
      case 'trigger':
        // Trigger just passes through
        nextNodes = getNextNodes(node.id, edges, allNodes);
        break;

      case 'condition':
        // Evaluate condition and branch accordingly
        const conditionResult = await evaluateCondition(node.data?.config || node.data, objectId, objectType);
        log.push({
          nodeId: node.id,
          result: conditionResult,
          timestamp: new Date().toISOString(),
        });

        // Find the next node based on condition result
        const nextEdge = edges.find(
          (e) => e.source === node.id && e.sourceHandle === (conditionResult ? 'true' : 'false')
        );
        if (nextEdge) {
          const nextNode = allNodes.find((n) => n.id === nextEdge.target);
          if (nextNode) nextNodes = [nextNode];
        }
        break;

      case 'action':
        // Execute action
        await executeAction(node.data?.config || node.data, objectId, objectType, log);
        nextNodes = getNextNodes(node.id, edges, allNodes);
        break;

      case 'email':
        // Send email action
        await sendEmailAction(node.data?.config || node.data, objectId, objectType, log);
        nextNodes = getNextNodes(node.id, edges, allNodes);
        break;

      case 'task':
        // Create task action
        await createTaskAction(node.data?.config || node.data, objectId, objectType, log, userId);
        nextNodes = getNextNodes(node.id, edges, allNodes);
        break;

      case 'update':
        // Update field action
        await updateFieldAction(node.data?.config || node.data, objectId, objectType, log);
        nextNodes = getNextNodes(node.id, edges, allNodes);
        break;

      case 'api':
        // API Call action
        await apiCallAction(node.data?.config || node.data, objectId, objectType, log);
        nextNodes = getNextNodes(node.id, edges, allNodes);
        break;
    }

    log.push({
      nodeId: node.id,
      nodeType: nodeType,
      timestamp: new Date().toISOString(),
      status: 'completed',
    });

    // Execute next nodes
    for (const nextNode of nextNodes) {
      await executeNode(nextNode, allNodes, edges, objectId, objectType, log, userId);
    }
  } catch (error: any) {
    log.push({
      nodeId: node.id,
      nodeType: nodeType,
      timestamp: new Date().toISOString(),
      status: 'failed',
      error: error.message,
    });
    throw error;
  }
}

function getNextNodes(nodeId: string, edges: WorkflowEdge[], allNodes: WorkflowNode[]): WorkflowNode[] {
  const nextEdges = edges.filter((e) => e.source === nodeId);
  return nextEdges
    .map((e) => allNodes.find((n) => n.id === e.target))
    .filter((n): n is WorkflowNode => n !== undefined);
}

async function evaluateCondition(data: any, objectId: string, objectType: string): Promise<boolean> {
  const { field, operator, value } = data;

  // Fetch the object
  const object = await getObject(objectId, objectType);
  if (!object) return false;

  const fieldValue = object[field];

  switch (operator) {
    case 'equals':
      return fieldValue == value;
    case 'notEquals':
      return fieldValue != value;
    case 'contains':
      return String(fieldValue).includes(value);
    case 'greaterThan':
      return Number(fieldValue) > Number(value);
    case 'lessThan':
      return Number(fieldValue) < Number(value);
    default:
      return false;
  }
}

async function executeAction(data: any, objectId: string, objectType: string, log: any[]) {
  log.push({
    action: 'execute',
    data,
    timestamp: new Date().toISOString(),
  });
}

async function sendEmailAction(data: any, objectId: string, objectType: string, log: any[]) {
  const { to, subject, body } = data;

  // Here you would integrate with your email service (Resend)
  log.push({
    action: 'sendEmail',
    to,
    subject,
    timestamp: new Date().toISOString(),
    status: 'sent',
  });
}

async function createTaskAction(data: any, objectId: string, objectType: string, log: any[], userId: string) {
  const { title, description, dueDate, assignedTo } = data;

  await prisma.task.create({
    data: {
      subject: title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'NOT_STARTED',
      priority: 'MEDIUM',
      assignedTo: assignedTo || userId,
      createdBy: userId,
      relatedTo: objectId,
    },
  });

  log.push({
    action: 'createTask',
    title,
    timestamp: new Date().toISOString(),
    status: 'created',
  });
}

async function updateFieldAction(data: any, objectId: string, objectType: string, log: any[]) {
  const { field, value } = data;

  const modelMap: Record<string, any> = {
    Lead: prisma.lead,
    Contact: prisma.contact,
    Opportunity: prisma.opportunity,
    ClientCompany: prisma.clientCompany,
  };

  const model = modelMap[objectType];
  if (model) {
    await model.update({
      where: { id: objectId },
      data: { [field]: value },
    });

    log.push({
      action: 'updateField',
      field,
      value,
      timestamp: new Date().toISOString(),
      status: 'updated',
    });
  }
}

async function getObject(objectId: string, objectType: string) {
  const modelMap: Record<string, any> = {
    Lead: prisma.lead,
    Contact: prisma.contact,
    Opportunity: prisma.opportunity,
    ClientCompany: prisma.clientCompany,
  };

  const model = modelMap[objectType];
  if (model) {
    return await model.findUnique({ where: { id: objectId } });
  }
  return null;
}

async function apiCallAction(data: any, objectId: string, objectType: string, log: any[]) {
  const { url, method = 'GET', headers, body, timeout = 30000 } = data.config || data;

  if (!url) {
    throw new Error('API URL is required');
  }

  try {
    // Get the object data for variable substitution
    const object = await getObject(objectId, objectType);

    // Replace variables in URL
    let processedUrl = url.replace(/\{\{objectId\}\}/g, objectId);
    if (object) {
      Object.keys(object).forEach((key) => {
        const regex = new RegExp(`\\{\\{field\\.${key}\\}\\}`, 'g');
        processedUrl = processedUrl.replace(regex, object[key] || '');
      });
    }

    // Parse and process headers
    let processedHeaders: any = {
      'Content-Type': 'application/json',
      'x-workflow-internal': 'true',
    };
    if (headers) {
      try {
        const parsedHeaders = typeof headers === 'string' ? JSON.parse(headers) : headers;
        processedHeaders = { ...processedHeaders, ...parsedHeaders };
      } catch (e) {
        log.push({
          action: 'apiCall',
          warning: 'Failed to parse headers',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Process request body
    let processedBody = body;
    if (body && typeof body === 'string') {
      processedBody = body.replace(/\{\{objectId\}\}/g, objectId);
      if (object) {
        Object.keys(object).forEach((key) => {
          const regex = new RegExp(`\\{\\{field\\.${key}\\}\\}`, 'g');
          const value = object[key];
          let replacement = '';
          if (value === null || value === undefined) {
            replacement = '';
          } else if (typeof value === 'string') {
            replacement = value
              .replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');
          } else {
            replacement = String(value);
          }
          processedBody = processedBody.replace(regex, replacement);
        });
      }
    }

    // Make the API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const fetchOptions: RequestInit = {
      method,
      headers: processedHeaders,
      signal: controller.signal,
    };

    if (method !== 'GET' && processedBody) {
      fetchOptions.body = typeof processedBody === 'string' ? processedBody : JSON.stringify(processedBody);
    }

    const response = await fetch(processedUrl, fetchOptions);
    clearTimeout(timeoutId);

    const responseData = await response.text();
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseData);
    } catch {
      parsedResponse = responseData;
    }

    log.push({
      action: 'apiCall',
      url: processedUrl,
      method,
      statusCode: response.status,
      statusText: response.statusText,
      response: parsedResponse,
      timestamp: new Date().toISOString(),
      status: response.ok ? 'success' : 'failed',
    });

    if (!response.ok) {
      throw new Error(`API call failed with status ${response.status}: ${response.statusText}`);
    }
  } catch (error: any) {
    log.push({
      action: 'apiCall',
      url,
      method,
      error: error.message,
      timestamp: new Date().toISOString(),
      status: 'failed',
    });
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { objectId, nodes, edges, objectType } = await request.json();

    if (!objectId) {
      return NextResponse.json({ error: 'objectId is required' }, { status: 400 });
    }

    if (!nodes || !Array.isArray(nodes)) {
      return NextResponse.json({ error: 'nodes array is required' }, { status: 400 });
    }

    if (!objectType) {
      return NextResponse.json({ error: 'objectType is required' }, { status: 400 });
    }

    const result = await executeTestWorkflow(
      objectId,
      nodes,
      edges || [],
      objectType,
      session.user.id
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error executing test workflow:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
