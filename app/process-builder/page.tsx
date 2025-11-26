'use client';

import { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Switch,
  FormControlLabel,
  Drawer,
  IconButton,
  Paper,
} from '@mui/material';
import DashboardLayout from '@/components/DashboardLayout';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';

interface ProcessFlow {
  id: string;
  name: string;
  description: string;
  objectType: string;
  isActive: boolean;
  nodes: any[];
  edges: any[];
}

const nodeTypes = [
  { type: 'trigger', label: 'Trigger', color: '#4caf50' },
  { type: 'condition', label: 'Condition', color: '#ff9800' },
  { type: 'email', label: 'Send Email', color: '#9c27b0' },
  { type: 'task', label: 'Create Task', color: '#f44336' },
  { type: 'update', label: 'Update Field', color: '#00bcd4' },
  { type: 'api', label: 'API Call', color: '#ff5722' },
];

const objectTypes = ['Lead', 'Contact', 'Opportunity', 'ClientCompany', 'Task'];

export default function ProcessBuilderPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [flows, setFlows] = useState<ProcessFlow[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<ProcessFlow | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openNodeConfig, setOpenNodeConfig] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testObjectId, setTestObjectId] = useState('');
  const [availableRecords, setAvailableRecords] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    objectType: 'Lead',
    isActive: false,
  });

  const [nodeConfigData, setNodeConfigData] = useState<any>({});

  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    try {
      const response = await fetch('/api/process-flows');
      if (!response.ok) throw new Error('Failed to fetch flows');
      const data = await response.json();
      setFlows(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({
      ...params,
      markerEnd: { type: MarkerType.ArrowClosed },
    }, eds)),
    [setEdges]
  );

  const deleteNode = (nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  };

  const addNode = (type: string) => {
    const nodeType = nodeTypes.find((nt) => nt.type === type);
    if (!nodeType) return;

    const nodeId = `${type}-${Date.now()}`;

    const newNode: Node = {
      id: nodeId,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: {
        label: (
          <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
            <span>{nodeType.label}</span>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(nodeId);
              }}
              sx={{
                color: 'white',
                padding: '2px',
                marginLeft: 1,
                '&:hover': { background: 'rgba(255,255,255,0.2)' }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        ),
        type: type,
        config: {},
        nodeId: nodeId,
      },
      style: {
        background: nodeType.color,
        color: 'white',
        border: '1px solid #222',
        padding: 10,
        borderRadius: 5,
        minWidth: 150,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setNodeConfigData(node.data.config || {});
    setOpenNodeConfig(true);
  };

  const saveNodeConfig = () => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              config: nodeConfigData,
            },
          };
        }
        return node;
      })
    );

    setOpenNodeConfig(false);
    setSelectedNode(null);
  };

  const saveFlow = async () => {
    try {
      const flowData = {
        name: formData.name || `Flow ${Date.now()}`,
        description: formData.description,
        objectType: formData.objectType,
        isActive: formData.isActive,
        nodes,
        edges,
      };

      // Check if this is an update (existing flow with real ID) or a create (no flow or temp ID)
      const isUpdate = selectedFlow && selectedFlow.id && !selectedFlow.id.startsWith('temp-');

      const response = isUpdate
        ? await fetch(`/api/process-flows/${selectedFlow.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(flowData),
          })
        : await fetch('/api/process-flows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(flowData),
          });

      if (!response.ok) throw new Error('Failed to save flow');

      const savedFlow = await response.json();
      setSelectedFlow(savedFlow);
      setSuccess('Flow saved successfully!');
      fetchFlows();
      setOpenDialog(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadAvailableRecords = async (objectType: string) => {
    try {
      const endpoint = objectType === 'Lead' ? '/api/leads' :
                       objectType === 'Opportunity' ? '/api/opportunities' :
                       objectType === 'Contact' ? '/api/contacts' :
                       objectType === 'ClientCompany' ? '/api/clients' : null;

      if (!endpoint) return;

      const response = await fetch(endpoint);
      if (!response.ok) return;

      const data = await response.json();
      setAvailableRecords(data.slice(0, 20)); // Limit to 20 for performance
    } catch (err) {
      console.error('Error loading records:', err);
    }
  };

  const testRunFlow = async () => {
    if (!testObjectId.trim()) {
      setError('Please select a record to test with');
      return;
    }

    if (nodes.length === 0) {
      setError('Please add at least one node to the workflow');
      return;
    }

    try {
      let response;

      // If the flow is saved (has a real ID), use the saved flow endpoint
      if (selectedFlow?.id && !selectedFlow.id.startsWith('temp-')) {
        response = await fetch(`/api/process-flows/${selectedFlow.id}/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ objectId: testObjectId }),
        });
      } else {
        // Otherwise, use the test-execute endpoint with the current nodes/edges
        response = await fetch('/api/process-flows/test-execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            objectId: testObjectId,
            nodes,
            edges,
            objectType: formData.objectType,
          }),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to execute flow');
      }

      const result = await response.json();
      const message = result.executionId
        ? `Flow executed successfully! Execution ID: ${result.executionId}`
        : 'Test run completed successfully!';
      setSuccess(message);
      setTestDialogOpen(false);
      setTestObjectId('');
      console.log('Execution log:', result.log);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const loadFlow = (flow: ProcessFlow) => {
    setSelectedFlow(flow);
    setFormData({
      name: flow.name,
      description: flow.description,
      objectType: flow.objectType,
      isActive: flow.isActive,
    });
    setNodes(flow.nodes || []);
    setEdges(flow.edges || []);
  };

  const newFlow = () => {
    setSelectedFlow(null);
    setFormData({
      name: '',
      description: '',
      objectType: 'Lead',
      isActive: false,
    });
    setNodes([]);
    setEdges([]);
    setOpenDialog(true);
  };

  const loadExampleWorkflow = (exampleName: string) => {
    const examples: Record<string, any> = {
      'Lead Auto-Score': {
        name: 'Auto-Score New Leads',
        description: 'Automatically score leads when created using AI',
        objectType: 'Lead',
        isActive: false,
        nodes: [
          {
            id: 'trigger-1',
            type: 'default',
            position: { x: 100, y: 100 },
            data: {
              label: 'Trigger',
              type: 'trigger',
              config: { triggerType: 'created' },
            },
            style: { background: '#4caf50', color: 'white', padding: 10, borderRadius: 5, minWidth: 150 },
          },
          {
            id: 'api-1',
            type: 'default',
            position: { x: 100, y: 200 },
            data: {
              label: 'API Call',
              type: 'api',
              config: {
                url: 'http://localhost:3000/api/ai/lead-score/{{objectId}}',
                method: 'GET',
                headers: '{\n  "Content-Type": "application/json"\n}',
                body: '',
              },
            },
            style: { background: '#ff5722', color: 'white', padding: 10, borderRadius: 5, minWidth: 150 },
          },
          {
            id: 'task-1',
            type: 'default',
            position: { x: 100, y: 300 },
            data: {
              label: 'Create Task',
              type: 'task',
              config: {
                title: 'Follow up with {{field.fullName}}',
                description: 'New high-score lead needs attention',
                dueDays: '1',
              },
            },
            style: { background: '#f44336', color: 'white', padding: 10, borderRadius: 5, minWidth: 150 },
          },
        ],
        edges: [
          { id: 'e1-2', source: 'trigger-1', target: 'api-1', markerEnd: { type: 'arrowclosed' } },
          { id: 'e2-3', source: 'api-1', target: 'task-1', markerEnd: { type: 'arrowclosed' } },
        ],
      },
      'Lead Qualification': {
        name: 'Qualify and Convert Leads',
        description: 'Qualify leads and convert high-score leads to opportunities',
        objectType: 'Lead',
        isActive: false,
        nodes: [
          {
            id: 'trigger-1',
            type: 'default',
            position: { x: 100, y: 50 },
            data: {
              label: 'Trigger',
              type: 'trigger',
              config: { triggerType: 'updated' },
            },
            style: { background: '#4caf50', color: 'white', padding: 10, borderRadius: 5, minWidth: 150 },
          },
          {
            id: 'condition-1',
            type: 'default',
            position: { x: 100, y: 150 },
            data: {
              label: 'Condition',
              type: 'condition',
              config: { field: 'status', operator: 'equals', value: 'Qualified' },
            },
            style: { background: '#ff9800', color: 'white', padding: 10, borderRadius: 5, minWidth: 150 },
          },
          {
            id: 'api-1',
            type: 'default',
            position: { x: 100, y: 250 },
            data: {
              label: 'API Call',
              type: 'api',
              config: {
                url: 'http://localhost:3000/api/leads/{{objectId}}/convert',
                method: 'POST',
                headers: '{\n  "Content-Type": "application/json"\n}',
                body: '{\n  "createOpportunity": true,\n  "opportunityName": "{{field.company}} - Deal"\n}',
              },
            },
            style: { background: '#ff5722', color: 'white', padding: 10, borderRadius: 5, minWidth: 150 },
          },
          {
            id: 'email-1',
            type: 'default',
            position: { x: 100, y: 350 },
            data: {
              label: 'Send Email',
              type: 'email',
              config: {
                to: '{{field.email}}',
                subject: 'Welcome to our Sales Process',
                body: 'Hi {{field.fullName}}, we are excited to work with you!',
              },
            },
            style: { background: '#9c27b0', color: 'white', padding: 10, borderRadius: 5, minWidth: 150 },
          },
        ],
        edges: [
          { id: 'e1-2', source: 'trigger-1', target: 'condition-1', markerEnd: { type: 'arrowclosed' } },
          { id: 'e2-3', source: 'condition-1', target: 'api-1', markerEnd: { type: 'arrowclosed' } },
          { id: 'e3-4', source: 'api-1', target: 'email-1', markerEnd: { type: 'arrowclosed' } },
        ],
      },
      'Welcome Email': {
        name: 'Send Welcome Email to New Leads',
        description: 'Automatically send welcome email when a lead is created',
        objectType: 'Lead',
        isActive: false,
        nodes: [
          {
            id: 'trigger-1',
            type: 'default',
            position: { x: 100, y: 100 },
            data: {
              label: 'Trigger',
              type: 'trigger',
              config: { triggerType: 'created' },
            },
            style: { background: '#4caf50', color: 'white', padding: 10, borderRadius: 5, minWidth: 150 },
          },
          {
            id: 'email-1',
            type: 'default',
            position: { x: 100, y: 200 },
            data: {
              label: 'Send Email',
              type: 'email',
              config: {
                to: '{{field.email}}',
                subject: 'Welcome to LeadGenFlow!',
                body: 'Hi {{field.fullName}}, thank you for your interest. We will be in touch soon!',
              },
            },
            style: { background: '#9c27b0', color: 'white', padding: 10, borderRadius: 5, minWidth: 150 },
          },
          {
            id: 'api-1',
            type: 'default',
            position: { x: 100, y: 300 },
            data: {
              label: 'API Call',
              type: 'api',
              config: {
                url: 'http://localhost:3000/api/notes',
                method: 'POST',
                headers: '{\n  "Content-Type": "application/json"\n}',
                body: '{\n  "content": "Welcome email sent to {{field.fullName}}",\n  "leadId": "{{objectId}}"\n}',
              },
            },
            style: { background: '#ff5722', color: 'white', padding: 10, borderRadius: 5, minWidth: 150 },
          },
        ],
        edges: [
          { id: 'e1-2', source: 'trigger-1', target: 'email-1', markerEnd: { type: 'arrowclosed' } },
          { id: 'e2-3', source: 'email-1', target: 'api-1', markerEnd: { type: 'arrowclosed' } },
        ],
      },
      'Opportunity Scoring': {
        name: 'Auto-Score Opportunities',
        description: 'Score opportunities and create tasks for high-value deals',
        objectType: 'Opportunity',
        isActive: false,
        nodes: [
          {
            id: 'trigger-1',
            type: 'default',
            position: { x: 100, y: 50 },
            data: {
              label: 'Trigger',
              type: 'trigger',
              config: { triggerType: 'created' },
            },
            style: { background: '#4caf50', color: 'white', padding: 10, borderRadius: 5, minWidth: 150 },
          },
          {
            id: 'api-1',
            type: 'default',
            position: { x: 100, y: 150 },
            data: {
              label: 'API Call',
              type: 'api',
              config: {
                url: 'http://localhost:3000/api/ai/opportunity-score/{{objectId}}',
                method: 'POST',
                headers: '{\n  "Content-Type": "application/json"\n}',
                body: '{}',
              },
            },
            style: { background: '#ff5722', color: 'white', padding: 10, borderRadius: 5, minWidth: 150 },
          },
          {
            id: 'condition-1',
            type: 'default',
            position: { x: 100, y: 250 },
            data: {
              label: 'Condition',
              type: 'condition',
              config: { field: 'amount', operator: 'greaterThan', value: '50000' },
            },
            style: { background: '#ff9800', color: 'white', padding: 10, borderRadius: 5, minWidth: 150 },
          },
          {
            id: 'task-1',
            type: 'default',
            position: { x: 100, y: 350 },
            data: {
              label: 'Create Task',
              type: 'task',
              config: {
                title: 'High-value opportunity: {{field.name}}',
                description: 'This is a large deal - prioritize!',
                dueDays: '1',
              },
            },
            style: { background: '#f44336', color: 'white', padding: 10, borderRadius: 5, minWidth: 150 },
          },
        ],
        edges: [
          { id: 'e1-2', source: 'trigger-1', target: 'api-1', markerEnd: { type: 'arrowclosed' } },
          { id: 'e2-3', source: 'api-1', target: 'condition-1', markerEnd: { type: 'arrowclosed' } },
          { id: 'e3-4', source: 'condition-1', target: 'task-1', markerEnd: { type: 'arrowclosed' } },
        ],
      },
    };

    const example = examples[exampleName];
    if (example) {
      // Create a temporary flow object to enable the buttons
      setSelectedFlow({
        id: 'temp-' + Date.now(),
        name: example.name,
        description: example.description,
        objectType: example.objectType,
        isActive: example.isActive,
        nodes: example.nodes,
        edges: example.edges,
      } as ProcessFlow);

      setFormData({
        name: example.name,
        description: example.description,
        objectType: example.objectType,
        isActive: example.isActive,
      });
      setNodes(example.nodes);
      setEdges(example.edges);
      setSuccess(`Loaded example: ${exampleName}. Click "Save Flow" to save it.`);
    }
  };

  const renderNodeConfigFields = () => {
    if (!selectedNode) return null;

    const nodeType = selectedNode.data.type;

    switch (nodeType) {
      case 'trigger':
        return (
          <>
            <TextField
              select
              label="Trigger Type"
              value={nodeConfigData.triggerType || 'created'}
              onChange={(e) =>
                setNodeConfigData({ ...nodeConfigData, triggerType: e.target.value })
              }
              fullWidth
              margin="normal"
            >
              <MenuItem value="created">Record Created</MenuItem>
              <MenuItem value="updated">Record Updated</MenuItem>
              <MenuItem value="deleted">Record Deleted</MenuItem>
            </TextField>
          </>
        );

      case 'condition':
        return (
          <>
            <TextField
              label="Field Name"
              value={nodeConfigData.field || ''}
              onChange={(e) =>
                setNodeConfigData({ ...nodeConfigData, field: e.target.value })
              }
              fullWidth
              margin="normal"
            />
            <TextField
              select
              label="Operator"
              value={nodeConfigData.operator || 'equals'}
              onChange={(e) =>
                setNodeConfigData({ ...nodeConfigData, operator: e.target.value })
              }
              fullWidth
              margin="normal"
            >
              <MenuItem value="equals">Equals</MenuItem>
              <MenuItem value="notEquals">Not Equals</MenuItem>
              <MenuItem value="contains">Contains</MenuItem>
              <MenuItem value="greaterThan">Greater Than</MenuItem>
              <MenuItem value="lessThan">Less Than</MenuItem>
            </TextField>
            <TextField
              label="Value"
              value={nodeConfigData.value || ''}
              onChange={(e) =>
                setNodeConfigData({ ...nodeConfigData, value: e.target.value })
              }
              fullWidth
              margin="normal"
            />
          </>
        );

      case 'email':
        return (
          <>
            <TextField
              label="To Email"
              value={nodeConfigData.to || ''}
              onChange={(e) =>
                setNodeConfigData({ ...nodeConfigData, to: e.target.value })
              }
              fullWidth
              margin="normal"
            />
            <TextField
              label="Subject"
              value={nodeConfigData.subject || ''}
              onChange={(e) =>
                setNodeConfigData({ ...nodeConfigData, subject: e.target.value })
              }
              fullWidth
              margin="normal"
            />
            <TextField
              label="Body"
              value={nodeConfigData.body || ''}
              onChange={(e) =>
                setNodeConfigData({ ...nodeConfigData, body: e.target.value })
              }
              multiline
              rows={4}
              fullWidth
              margin="normal"
            />
          </>
        );

      case 'task':
        return (
          <>
            <TextField
              label="Task Title"
              value={nodeConfigData.title || ''}
              onChange={(e) =>
                setNodeConfigData({ ...nodeConfigData, title: e.target.value })
              }
              fullWidth
              margin="normal"
            />
            <TextField
              label="Description"
              value={nodeConfigData.description || ''}
              onChange={(e) =>
                setNodeConfigData({ ...nodeConfigData, description: e.target.value })
              }
              multiline
              rows={3}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Due Date (days from now)"
              type="number"
              value={nodeConfigData.dueDays || '7'}
              onChange={(e) =>
                setNodeConfigData({ ...nodeConfigData, dueDays: e.target.value })
              }
              fullWidth
              margin="normal"
            />
          </>
        );

      case 'update':
        return (
          <>
            <TextField
              label="Field to Update"
              value={nodeConfigData.field || ''}
              onChange={(e) =>
                setNodeConfigData({ ...nodeConfigData, field: e.target.value })
              }
              fullWidth
              margin="normal"
            />
            <TextField
              label="New Value"
              value={nodeConfigData.value || ''}
              onChange={(e) =>
                setNodeConfigData({ ...nodeConfigData, value: e.target.value })
              }
              fullWidth
              margin="normal"
            />
          </>
        );

      case 'api':
        const apiTemplates = [
          {
            name: 'Custom API',
            url: '',
            method: 'POST',
            headers: '{\n  "Content-Type": "application/json"\n}',
            body: '{\n  "recordId": "{{objectId}}"\n}',
          },
          {
            name: 'AI: Score Lead',
            url: 'http://localhost:3000/api/ai/lead-score/{{objectId}}',
            method: 'GET',
            headers: '{\n  "Content-Type": "application/json"\n}',
            body: '',
          },
          {
            name: 'AI: Score Opportunity',
            url: 'http://localhost:3000/api/ai/opportunity-score/{{objectId}}',
            method: 'GET',
            headers: '{\n  "Content-Type": "application/json"\n}',
            body: '',
          },
          {
            name: 'AI: Lead Enrichment',
            url: 'http://localhost:3000/api/ai/lead-enrich',
            method: 'POST',
            headers: '{\n  "Content-Type": "application/json"\n}',
            body: '{\n  "email": "{{field.email}}",\n  "company": "{{field.company}}"\n}',
          },
          {
            name: 'AI: Lead Qualification',
            url: 'http://localhost:3000/api/ai/lead-qualify',
            method: 'POST',
            headers: '{\n  "Content-Type": "application/json"\n}',
            body: '{\n  "leadId": "{{objectId}}"\n}',
          },
          {
            name: 'AI: Next Best Action',
            url: 'http://localhost:3000/api/ai/next-best-action',
            method: 'POST',
            headers: '{\n  "Content-Type": "application/json"\n}',
            body: '{\n  "recordId": "{{objectId}}",\n  "recordType": "Lead"\n}',
          },
          {
            name: 'AI: Account Insights',
            url: 'http://localhost:3000/api/ai/account-insights/{{objectId}}',
            method: 'GET',
            headers: '{\n  "Content-Type": "application/json"\n}',
            body: '',
          },
          {
            name: 'Convert Lead to Opportunity',
            url: 'http://localhost:3000/api/leads/{{objectId}}/convert',
            method: 'POST',
            headers: '{\n  "Content-Type": "application/json"\n}',
            body: '{\n  "createOpportunity": true,\n  "opportunityName": "{{field.company}} - Deal"\n}',
          },
          {
            name: 'Create Task',
            url: 'http://localhost:3000/api/tasks',
            method: 'POST',
            headers: '{\n  "Content-Type": "application/json"\n}',
            body: '{\n  "title": "Follow up with {{field.fullName}}",\n  "description": "Contact lead from workflow",\n  "status": "TODO",\n  "priority": "HIGH",\n  "relatedToType": "Lead",\n  "relatedToId": "{{objectId}}"\n}',
          },
          {
            name: 'Send Email',
            url: 'http://localhost:3000/api/emails/send',
            method: 'POST',
            headers: '{\n  "Content-Type": "application/json"\n}',
            body: '{\n  "to": "{{field.email}}",\n  "subject": "Welcome!",\n  "body": "Hello {{field.fullName}}, welcome to our platform!"\n}',
          },
          {
            name: 'Create Note',
            url: 'http://localhost:3000/api/notes',
            method: 'POST',
            headers: '{\n  "Content-Type": "application/json"\n}',
            body: '{\n  "content": "Auto-generated note for {{field.fullName}}",\n  "leadId": "{{objectId}}"\n}',
          },
          {
            name: 'Create Notification',
            url: 'http://localhost:3000/api/notifications',
            method: 'POST',
            headers: '{\n  "Content-Type": "application/json"\n}',
            body: '{\n  "title": "New Lead Alert",\n  "message": "{{field.fullName}} has been created",\n  "type": "INFO"\n}',
          },
          {
            name: 'Slack Webhook (External)',
            url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
            method: 'POST',
            headers: '{\n  "Content-Type": "application/json"\n}',
            body: '{\n  "text": "New lead: {{field.fullName}} - {{field.email}}",\n  "channel": "#sales"\n}',
          },
          {
            name: 'Zapier Webhook (External)',
            url: 'https://hooks.zapier.com/hooks/catch/YOUR_HOOK_ID/',
            method: 'POST',
            headers: '{\n  "Content-Type": "application/json"\n}',
            body: '{\n  "recordId": "{{objectId}}",\n  "email": "{{field.email}}",\n  "name": "{{field.fullName}}"\n}',
          },
        ];

        const handleTemplateSelect = (templateName: string) => {
          const template = apiTemplates.find(t => t.name === templateName);
          if (template && templateName !== 'Custom API') {
            setNodeConfigData({
              ...nodeConfigData,
              url: template.url,
              method: template.method,
              headers: template.headers,
              body: template.body,
            });
          }
        };

        return (
          <>
            <TextField
              select
              label="API Template"
              defaultValue="Custom API"
              onChange={(e) => handleTemplateSelect(e.target.value)}
              fullWidth
              margin="normal"
              helperText="Select a pre-configured template or use Custom API"
            >
              {apiTemplates.map((template) => (
                <MenuItem key={template.name} value={template.name}>
                  {template.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="API URL"
              value={nodeConfigData.url || ''}
              onChange={(e) =>
                setNodeConfigData({ ...nodeConfigData, url: e.target.value })
              }
              fullWidth
              margin="normal"
              placeholder="https://api.example.com/endpoint"
            />
            <TextField
              select
              label="HTTP Method"
              value={nodeConfigData.method || 'POST'}
              onChange={(e) =>
                setNodeConfigData({ ...nodeConfigData, method: e.target.value })
              }
              fullWidth
              margin="normal"
            >
              <MenuItem value="GET">GET</MenuItem>
              <MenuItem value="POST">POST</MenuItem>
              <MenuItem value="PUT">PUT</MenuItem>
              <MenuItem value="PATCH">PATCH</MenuItem>
              <MenuItem value="DELETE">DELETE</MenuItem>
            </TextField>
            <TextField
              label="Headers (JSON)"
              value={nodeConfigData.headers || ''}
              onChange={(e) =>
                setNodeConfigData({ ...nodeConfigData, headers: e.target.value })
              }
              multiline
              rows={3}
              fullWidth
              margin="normal"
              placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
            />
            <TextField
              label="Request Body (JSON)"
              value={nodeConfigData.body || ''}
              onChange={(e) =>
                setNodeConfigData({ ...nodeConfigData, body: e.target.value })
              }
              multiline
              rows={4}
              fullWidth
              margin="normal"
              placeholder='{"key": "value", "recordId": "{{objectId}}"}'
              helperText="Use {{objectId}} to reference the record ID, {{field.name}} to reference field values"
            />
            <TextField
              label="Timeout (ms)"
              type="number"
              value={nodeConfigData.timeout || '30000'}
              onChange={(e) =>
                setNodeConfigData({ ...nodeConfigData, timeout: e.target.value })
              }
              fullWidth
              margin="normal"
            />
          </>
        );

      default:
        return <Typography>No configuration needed</Typography>;
    }
  };

  return (
    <DashboardLayout>
      <Box display="flex" height="calc(100vh - 100px)">
        <Drawer
          variant="persistent"
          anchor="left"
          open={drawerOpen}
          sx={{
            width: 280,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
              position: 'relative',
            },
          }}
        >
          <Box p={2}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Process Builder</Typography>
              <IconButton size="small" onClick={() => setDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Button
              variant="contained"
              fullWidth
              startIcon={<AddIcon />}
              onClick={newFlow}
              sx={{ mb: 2 }}
            >
              New Flow
            </Button>

            {selectedFlow && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  startIcon={<SaveIcon />}
                  onClick={() => setOpenDialog(true)}
                  sx={{ mb: 1 }}
                >
                  Save Flow
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<PlayArrowIcon />}
                  onClick={() => setTestDialogOpen(true)}
                  sx={{ mb: 2 }}
                >
                  Test Run
                </Button>
              </>
            )}

            <Typography variant="subtitle2" gutterBottom>
              Node Types
            </Typography>
            <List dense>
              {nodeTypes.map((nodeType) => (
                <ListItem key={nodeType.type} disablePadding>
                  <ListItemButton onClick={() => addNode(nodeType.type)}>
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: 1,
                        backgroundColor: nodeType.color,
                        mr: 1,
                      }}
                    />
                    <ListItemText primary={nodeType.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Example Workflows
            </Typography>
            <List dense>
              <ListItem disablePadding>
                <ListItemButton onClick={() => loadExampleWorkflow('Lead Auto-Score')}>
                  <ListItemText
                    primary="Lead Auto-Score"
                    secondary="AI scoring on create"
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => loadExampleWorkflow('Lead Qualification')}>
                  <ListItemText
                    primary="Lead Qualification"
                    secondary="Convert qualified leads"
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => loadExampleWorkflow('Welcome Email')}>
                  <ListItemText
                    primary="Welcome Email"
                    secondary="Send email to new leads"
                  />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton onClick={() => loadExampleWorkflow('Opportunity Scoring')}>
                  <ListItemText
                    primary="Opportunity Scoring"
                    secondary="Score opportunities"
                  />
                </ListItemButton>
              </ListItem>
            </List>

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Saved Flows
            </Typography>
            <List dense>
              {flows.map((flow) => (
                <ListItem key={flow.id} disablePadding>
                  <ListItemButton onClick={() => loadFlow(flow)}>
                    <ListItemText
                      primary={flow.name}
                      secondary={flow.objectType}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        <Box flex={1} position="relative">
          {!drawerOpen && (
            <IconButton
              sx={{ position: 'absolute', top: 10, left: 10, zIndex: 5 }}
              onClick={() => setDrawerOpen(true)}
            >
              <AddIcon />
            </IconButton>
          )}

          {error && (
            <Alert severity="error" onClose={() => setError('')} sx={{ m: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" onClose={() => setSuccess('')} sx={{ m: 2 }}>
              {success}
            </Alert>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
          >
            <Controls />
            <Background />
          </ReactFlow>
        </Box>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedFlow ? 'Save Flow' : 'Create New Flow'}
          </DialogTitle>
          <DialogContent>
            <TextField
              label="Flow Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              margin="normal"
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
              margin="normal"
            />
            <TextField
              select
              label="Object Type"
              value={formData.objectType}
              onChange={(e) => setFormData({ ...formData, objectType: e.target.value })}
              fullWidth
              margin="normal"
            >
              {objectTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={saveFlow} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={openNodeConfig}
          onClose={() => setOpenNodeConfig(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Configure {selectedNode?.data.label}</DialogTitle>
          <DialogContent>{renderNodeConfigFields()}</DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenNodeConfig(false)}>Cancel</Button>
            <Button onClick={saveNodeConfig} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={testDialogOpen}
          onClose={() => setTestDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          onTransitionEnter={() => loadAvailableRecords(formData.objectType)}
        >
          <DialogTitle>Test Run Workflow</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" paragraph>
              Select a {formData.objectType} to test this workflow with
            </Typography>
            <TextField
              select
              label={`Select ${formData.objectType}`}
              value={testObjectId}
              onChange={(e) => setTestObjectId(e.target.value)}
              fullWidth
              margin="normal"
              helperText={`Choose from your existing ${formData.objectType}s`}
            >
              {availableRecords.map((record) => (
                <MenuItem key={record.id} value={record.id}>
                  {record.fullName || record.name || record.firstName + ' ' + record.lastName || record.id}
                  {record.email && ` (${record.email})`}
                  {record.company && ` - ${record.company}`}
                </MenuItem>
              ))}
              {availableRecords.length === 0 && (
                <MenuItem disabled>No {formData.objectType}s found</MenuItem>
              )}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTestDialogOpen(false)}>Cancel</Button>
            <Button onClick={testRunFlow} variant="contained" color="primary" disabled={!testObjectId}>
              Run Test
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}
