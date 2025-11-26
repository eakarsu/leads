import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Import JSON demo data into the database
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { data } = await req.json();

    if (!data) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    const imported: Record<string, number> = {};

    // Map to store old ID -> new ID mappings for relationships
    const idMaps: Record<string, Map<string, string>> = {
      clientCompanies: new Map(),
      products: new Map(),
      contacts: new Map(),
      campaigns: new Map(),
      leads: new Map(),
      opportunities: new Map(),
      cases: new Map(),
      knowledgeCategories: new Map(),
      knowledgeArticles: new Map(),
      contracts: new Map(),
      quotes: new Map(),
      orders: new Map(),
      invoices: new Map(),
      assets: new Map(),
      entitlements: new Map(),
      tasks: new Map(),
      events: new Map(),
      customObjects: new Map(),
    };

    // 1. Import Client Companies
    if (data.clientCompanies?.length) {
      for (const item of data.clientCompanies) {
        const { id: oldId, ...rest } = item;
        const created = await prisma.clientCompany.create({
          data: {
            name: rest.name,
            industry: rest.industry,
            website: rest.website,
            contactName: rest.contactName,
            contactEmail: rest.contactEmail,
            contactPhone: rest.contactPhone,
            isPartner: rest.isPartner,
            partnerLevel: rest.partnerLevel,
            type: rest.type,
          },
        });
        idMaps.clientCompanies.set(oldId, created.id);
      }
      imported.clientCompanies = data.clientCompanies.length;
    }

    // 2. Import Products
    if (data.products?.length) {
      for (const item of data.products) {
        const { id: oldId, clientId, ...rest } = item;
        const created = await prisma.product.create({
          data: {
            clientId: idMaps.clientCompanies.get(clientId) || clientId,
            name: rest.name,
            description: rest.description,
            category: rest.category,
            unitPrice: rest.unitPrice,
            isActive: rest.isActive,
          },
        });
        idMaps.products.set(oldId, created.id);
      }
      imported.products = data.products.length;
    }

    // 3. Import Contacts
    if (data.contacts?.length) {
      for (const item of data.contacts) {
        const { id: oldId, clientId, ownerId, ...rest } = item;
        const created = await prisma.contact.create({
          data: {
            clientId: idMaps.clientCompanies.get(clientId) || clientId,
            firstName: rest.firstName,
            lastName: rest.lastName,
            email: rest.email,
            phone: rest.phone,
            title: rest.title,
            department: rest.department,
            isPrimary: rest.isPrimary,
            ownerId: userId,
            isPortalUser: rest.isPortalUser,
            isPartnerUser: rest.isPartnerUser,
            portalStatus: rest.portalStatus,
          },
        });
        idMaps.contacts.set(oldId, created.id);
      }
      imported.contacts = data.contacts.length;
    }

    // 4. Import Campaigns
    if (data.campaigns?.length) {
      for (const item of data.campaigns) {
        const { id: oldId, clientId, ownerId, ...rest } = item;
        const created = await prisma.campaign.create({
          data: {
            clientId: idMaps.clientCompanies.get(clientId) || clientId,
            name: rest.name,
            status: rest.status,
            channel: rest.channel,
            targetPersona: rest.targetPersona,
            startDate: new Date(rest.startDate),
            endDate: new Date(rest.endDate),
            ownerId: userId,
          },
        });
        idMaps.campaigns.set(oldId, created.id);
      }
      imported.campaigns = data.campaigns.length;
    }

    // 5. Import Leads
    if (data.leads?.length) {
      for (const item of data.leads) {
        const { id: oldId, clientId, campaignId, submittedBy, ...rest } = item;
        const created = await prisma.lead.create({
          data: {
            clientId: idMaps.clientCompanies.get(clientId) || clientId,
            fullName: rest.fullName,
            email: rest.email,
            phone: rest.phone,
            company: rest.company,
            title: rest.title,
            status: rest.status,
            leadSource: rest.leadSource,
            qualificationScore: rest.qualificationScore,
            submittedBy: userId,
            campaignId: idMaps.campaigns.get(campaignId) || undefined,
          },
        });
        idMaps.leads.set(oldId, created.id);
      }
      imported.leads = data.leads.length;
    }

    // 6. Import Opportunities
    if (data.opportunities?.length) {
      for (const item of data.opportunities) {
        const { id: oldId, clientId, contactId, ownerId, ...rest } = item;
        const created = await prisma.opportunity.create({
          data: {
            clientId: idMaps.clientCompanies.get(clientId) || clientId,
            contactId: idMaps.contacts.get(contactId) || undefined,
            name: rest.name,
            stage: rest.stage,
            amount: rest.amount,
            probability: rest.probability,
            expectedCloseDate: new Date(rest.expectedCloseDate),
            ownerId: userId,
          },
        });
        idMaps.opportunities.set(oldId, created.id);
      }
      imported.opportunities = data.opportunities.length;
    }

    // 7. Import Cases
    if (data.cases?.length) {
      for (const item of data.cases) {
        const { id: oldId, contactId, accountId, ownerId, ...rest } = item;
        const created = await prisma.case.create({
          data: {
            caseNumber: rest.caseNumber,
            subject: rest.subject,
            description: rest.description,
            status: rest.status,
            priority: rest.priority,
            origin: rest.origin,
            contactId: idMaps.contacts.get(contactId) || undefined,
            accountId: idMaps.clientCompanies.get(accountId) || undefined,
            ownerId: userId,
          },
        });
        idMaps.cases.set(oldId, created.id);
      }
      imported.cases = data.cases.length;
    }

    // 8. Import Knowledge Categories & Articles
    if (data.knowledgeCategories?.length) {
      for (const item of data.knowledgeCategories) {
        const { id: oldId, ...rest } = item;
        const created = await prisma.knowledgeCategory.create({
          data: {
            name: rest.name,
            description: rest.description,
          },
        });
        idMaps.knowledgeCategories.set(oldId, created.id);
      }
      imported.knowledgeCategories = data.knowledgeCategories.length;
    }

    if (data.knowledgeArticles?.length) {
      for (const item of data.knowledgeArticles) {
        const { id: oldId, categoryId, authorId, ...rest } = item;
        const created = await prisma.knowledgeArticle.create({
          data: {
            articleNumber: rest.articleNumber,
            title: rest.title,
            summary: rest.summary,
            content: rest.content,
            status: rest.status,
            categoryId: idMaps.knowledgeCategories.get(categoryId) || undefined,
            authorId: userId,
            keywords: rest.keywords,
            isPublic: rest.isPublic,
            viewCount: rest.viewCount,
          },
        });
        idMaps.knowledgeArticles.set(oldId, created.id);
      }
      imported.knowledgeArticles = data.knowledgeArticles.length;
    }

    // 9. Import Contracts
    if (data.contracts?.length) {
      for (const item of data.contracts) {
        const { id: oldId, accountId, ownerId, ...rest } = item;
        const created = await prisma.contract.create({
          data: {
            contractNumber: rest.contractNumber,
            name: rest.name || rest.contractNumber || 'Contract',
            accountId: idMaps.clientCompanies.get(accountId) || accountId,
            status: rest.status,
            startDate: new Date(rest.startDate),
            endDate: new Date(rest.endDate),
            contractTerm: rest.contractTerm,
            totalValue: rest.totalValue,
            ownerId: userId,
            description: rest.description,
          },
        });
        idMaps.contracts.set(oldId, created.id);
      }
      imported.contracts = data.contracts.length;
    }

    // 10. Import Quotes
    if (data.quotes?.length) {
      for (const item of data.quotes) {
        const { id: oldId, accountId, opportunityId, contactId, ownerId, ...rest } = item;
        const created = await prisma.quote.create({
          data: {
            quoteNumber: rest.quoteNumber,
            name: rest.name,
            accountId: idMaps.clientCompanies.get(accountId) || accountId,
            opportunityId: idMaps.opportunities.get(opportunityId) || undefined,
            contactId: idMaps.contacts.get(contactId) || undefined,
            status: rest.status,
            expirationDate: new Date(rest.expirationDate),
            subtotal: rest.subtotal,
            discount: rest.discount,
            tax: rest.tax,
            grandTotal: rest.totalPrice || rest.grandTotal,
            ownerId: userId,
          },
        });
        idMaps.quotes.set(oldId, created.id);
      }
      imported.quotes = data.quotes.length;
    }

    // 11. Import Orders
    if (data.orders?.length) {
      for (const item of data.orders) {
        const { id: oldId, accountId, contractId, quoteId, ownerId, ...rest } = item;
        const created = await prisma.order.create({
          data: {
            orderNumber: rest.orderNumber,
            accountId: idMaps.clientCompanies.get(accountId) || accountId,
            contractId: idMaps.contracts.get(contractId) || undefined,
            quoteId: idMaps.quotes.get(quoteId) || undefined,
            status: rest.status,
            orderDate: new Date(rest.orderDate),
            totalAmount: rest.totalAmount,
            ownerId: userId,
          },
        });
        idMaps.orders.set(oldId, created.id);
      }
      imported.orders = data.orders.length;
    }

    // 12. Import Invoices
    if (data.invoices?.length) {
      for (const item of data.invoices) {
        const { id: oldId, accountId, orderId, ownerId, ...rest } = item;
        const created = await prisma.invoice.create({
          data: {
            invoiceNumber: rest.invoiceNumber,
            accountId: idMaps.clientCompanies.get(accountId) || accountId,
            orderId: idMaps.orders.get(orderId) || undefined,
            status: rest.status,
            invoiceDate: new Date(rest.invoiceDate),
            dueDate: new Date(rest.dueDate),
            subtotal: rest.subtotal,
            tax: rest.tax,
            totalAmount: rest.totalAmount,
            ownerId: userId,
          },
        });
        idMaps.invoices.set(oldId, created.id);
      }
      imported.invoices = data.invoices.length;
    }

    // 13. Import Assets
    if (data.assets?.length) {
      for (const item of data.assets) {
        const { id: oldId, accountId, contactId, productId, ...rest } = item;
        const created = await prisma.asset.create({
          data: {
            name: rest.name,
            accountId: idMaps.clientCompanies.get(accountId) || accountId,
            contactId: idMaps.contacts.get(contactId) || undefined,
            productId: idMaps.products.get(productId) || undefined,
            serialNumber: rest.serialNumber,
            status: rest.status,
            purchaseDate: rest.purchaseDate ? new Date(rest.purchaseDate) : undefined,
            installDate: rest.installDate ? new Date(rest.installDate) : undefined,
            usageEndDate: rest.usageEndDate ? new Date(rest.usageEndDate) : undefined,
            price: rest.price,
            quantity: rest.quantity,
            ownerId: userId,
          },
        });
        idMaps.assets.set(oldId, created.id);
      }
      imported.assets = data.assets.length;
    }

    // 14. Import Entitlements
    if (data.entitlements?.length) {
      for (const item of data.entitlements) {
        const { id: oldId, accountId, assetId, contractId, ...rest } = item;
        const created = await prisma.entitlement.create({
          data: {
            name: rest.name,
            accountId: idMaps.clientCompanies.get(accountId) || accountId,
            assetId: idMaps.assets.get(assetId) || undefined,
            contractId: idMaps.contracts.get(contractId) || undefined,
            startDate: new Date(rest.startDate),
            endDate: new Date(rest.endDate),
            status: rest.status,
            remainingCases: rest.remainingCases,
            description: rest.type || rest.description,
          },
        });
        idMaps.entitlements.set(oldId, created.id);
      }
      imported.entitlements = data.entitlements.length;
    }

    // 15. Import Tasks
    if (data.tasks?.length) {
      for (const item of data.tasks) {
        const { id: oldId, opportunityId, contactId, assignedTo, createdBy, ...rest } = item;
        const created = await prisma.task.create({
          data: {
            subject: rest.subject,
            description: rest.description,
            status: rest.status,
            priority: rest.priority,
            dueDate: new Date(rest.dueDate),
            assignedTo: userId,
            createdBy: userId,
            opportunityId: opportunityId ? idMaps.opportunities.get(opportunityId) || undefined : undefined,
            contactId: idMaps.contacts.get(contactId) || undefined,
          },
        });
        idMaps.tasks.set(oldId, created.id);
      }
      imported.tasks = data.tasks.length;
    }

    // 16. Import Events
    if (data.events?.length) {
      for (const item of data.events) {
        const { id: oldId, ownerId, contactId, ...rest } = item;
        const created = await prisma.event.create({
          data: {
            subject: rest.subject,
            description: rest.description,
            location: rest.location,
            startTime: new Date(rest.startDateTime || rest.startTime),
            endTime: new Date(rest.endDateTime || rest.endTime),
            isAllDay: rest.isAllDay,
            ownerId: userId,
            contactId: idMaps.contacts.get(contactId) || undefined,
          },
        });
        idMaps.events.set(oldId, created.id);
      }
      imported.events = data.events.length;
    }

    // 17. Import Mass Email Jobs
    if (data.massEmailJobs?.length) {
      for (const item of data.massEmailJobs) {
        const { id: oldId, ownerId, ...rest } = item;
        await prisma.massEmailJob.create({
          data: {
            name: rest.name,
            subject: rest.subject,
            body: rest.body,
            recipientType: rest.recipientType,
            status: rest.status,
            totalRecipients: rest.totalRecipients,
            sentCount: rest.sentCount,
            openedCount: rest.openedCount,
            clickedCount: rest.clickedCount,
            scheduledAt: rest.scheduledAt ? new Date(rest.scheduledAt) : undefined,
            ownerId: userId,
          },
        });
      }
      imported.massEmailJobs = data.massEmailJobs.length;
    }

    // 18. Import Web Forms
    if (data.webForms?.length) {
      for (const item of data.webForms) {
        const { id: oldId, ...rest } = item;
        await prisma.webForm.create({
          data: {
            name: rest.name,
            formType: rest.formType,
            description: rest.description,
            fields: rest.fields,
            isActive: rest.isActive,
            captchaEnabled: rest.captchaEnabled,
            submissionCount: rest.submissionCount,
          },
        });
      }
      imported.webForms = data.webForms.length;
    }

    // 19. Import Data Imports
    if (data.dataImports?.length) {
      for (const item of data.dataImports) {
        const { id: oldId, ownerId, ...rest } = item;
        await prisma.dataImport.create({
          data: {
            name: rest.name,
            objectType: rest.objectType,
            fileName: rest.fileName,
            fileSize: rest.fileSize,
            status: rest.status,
            totalRows: rest.totalRows,
            processedRows: rest.processedRows,
            successRows: rest.successRows,
            failedRows: rest.failedRows,
            duplicateRows: rest.duplicateRows,
            fieldMapping: rest.fieldMapping,
            duplicateHandling: rest.duplicateHandling,
            ownerId: userId,
          },
        });
      }
      imported.dataImports = data.dataImports.length;
    }

    // 20. Import Custom Objects
    if (data.customObjects?.length) {
      for (const objDef of data.customObjects) {
        const { id: oldId, fields, records, ...rest } = objDef;
        const customObj = await prisma.customObject.create({
          data: {
            name: rest.name,
            label: rest.label,
            pluralLabel: rest.pluralLabel,
            description: rest.description,
            isActive: rest.isActive,
          },
        });
        idMaps.customObjects.set(oldId, customObj.id);

        // Create fields
        if (fields?.length) {
          for (const field of fields) {
            await prisma.customField.create({
              data: {
                objectId: customObj.id,
                name: field.name,
                label: field.label,
                type: field.type,
                isRequired: field.required || field.isRequired,
                sortOrder: field.order || field.sortOrder || 0,
              },
            });
          }
        }

        // Create records
        if (records?.length) {
          for (const record of records) {
            await prisma.customRecord.create({
              data: {
                objectId: customObj.id,
                data: record.name ? { ...record.data, name: record.name } : record.data,
                ownerId: userId,
              },
            });
          }
        }
      }
      imported.customObjects = data.customObjects.length;
    }

    // 21. Import Notes
    if (data.notes?.length) {
      for (const item of data.notes) {
        const { id: oldId, parentId, createdById, ...rest } = item;
        // Map parent ID based on parent type
        const noteData: any = {
          content: rest.title ? `${rest.title}\n\n${rest.content}` : rest.content,
          createdBy: userId,
        };

        if (rest.parentType === 'Lead') {
          noteData.leadId = idMaps.leads.get(parentId) || parentId;
        } else if (rest.parentType === 'Contact') {
          noteData.contactId = idMaps.contacts.get(parentId) || parentId;
        } else if (rest.parentType === 'Opportunity') {
          noteData.opportunityId = idMaps.opportunities.get(parentId) || parentId;
        }

        await prisma.note.create({
          data: noteData,
        });
      }
      imported.notes = data.notes.length;
    }

    // 22. Import Email Templates
    if (data.emailTemplates?.length) {
      for (const item of data.emailTemplates) {
        const { id: oldId, ...rest } = item;
        await prisma.emailTemplate.create({
          data: {
            name: rest.name,
            subject: rest.subject,
            body: rest.body,
            category: rest.category,
          },
        });
      }
      imported.emailTemplates = data.emailTemplates.length;
    }

    // 23. Import Reports
    if (data.reports?.length) {
      for (const item of data.reports) {
        const { id: oldId, ownerId, ...rest } = item;
        await prisma.report.create({
          data: {
            name: rest.name,
            description: rest.description,
            format: rest.format || 'TABULAR',
            objectType: rest.objectType,
            columns: rest.columns,
            filters: rest.filters || {},
            groupBy: rest.groupBy || [],
            isPublic: rest.isPublic,
            ownerId: userId,
          },
        });
      }
      imported.reports = data.reports.length;
    }

    // 24. Import Workflow Rules
    if (data.workflowRules?.length) {
      for (const item of data.workflowRules) {
        const { id: oldId, ...rest } = item;
        await prisma.workflowRule.create({
          data: {
            name: rest.name,
            description: rest.description,
            objectType: rest.objectType,
            triggerType: rest.triggerType,
            conditions: rest.conditions,
            actions: rest.actions,
            isActive: rest.isActive,
            priority: rest.priority,
          },
        });
      }
      imported.workflowRules = data.workflowRules.length;
    }

    // 25. Import Lead Activities
    if (data.leadActivities?.length) {
      for (const item of data.leadActivities) {
        const { id: oldId, leadId, userId: activityUserId, ...rest } = item;
        await prisma.leadActivity.create({
          data: {
            leadId: idMaps.leads.get(leadId) || leadId,
            type: rest.type,
            content: rest.content,
            userId: userId,
          },
        });
      }
      imported.leadActivities = data.leadActivities.length;
    }

    // 26. Import Roles (need to handle hierarchy)
    const roleIdMap = new Map<string, string>();
    if (data.roles?.length) {
      // First pass: create roles without parent references
      for (const item of data.roles) {
        const { id: oldId, parentRoleId, ...rest } = item;
        const created = await prisma.role.create({
          data: {
            name: rest.name,
            label: rest.label,
            description: rest.description,
            allowForecast: rest.allowForecast,
            caseAccessLevel: rest.caseAccessLevel,
            opportunityAccessLevel: rest.opportunityAccessLevel,
            contactAccessLevel: rest.contactAccessLevel,
            parentRoleId: null, // Set to null initially
          },
        });
        roleIdMap.set(oldId, created.id);
      }

      // Second pass: update parent references
      for (const item of data.roles) {
        if (item.parentRoleId) {
          const newId = roleIdMap.get(item.id);
          const newParentId = roleIdMap.get(item.parentRoleId);
          if (newId && newParentId) {
            await prisma.role.update({
              where: { id: newId },
              data: { parentRoleId: newParentId },
            });
          }
        }
      }
      imported.roles = data.roles.length;
    }

    // 27. Import Permission Sets
    if (data.permissionSets?.length) {
      for (const item of data.permissionSets) {
        const { id: oldId, ...rest } = item;
        await prisma.permissionSet.create({
          data: {
            name: rest.name,
            label: rest.label,
            description: rest.description,
            isCustom: rest.isCustom,
            permissions: rest.permissions,
          },
        });
      }
      imported.permissionSets = data.permissionSets.length;
    }

    // 28. Import Sharing Rules
    if (data.sharingRules?.length) {
      for (const item of data.sharingRules) {
        const { id: oldId, sharedFrom, sharedTo, ...rest } = item;
        await prisma.sharingRule.create({
          data: {
            name: rest.name,
            objectType: rest.objectType,
            description: rest.description,
            sharedFrom: roleIdMap.get(sharedFrom) || sharedFrom,
            sharedFromType: rest.sharedFromType,
            sharedTo: roleIdMap.get(sharedTo) || sharedTo,
            sharedToType: rest.sharedToType,
            accessLevel: rest.accessLevel,
            criteria: rest.criteria,
            isActive: rest.isActive,
          },
        });
      }
      imported.sharingRules = data.sharingRules.length;
    }

    // Calculate totals
    const totalRecords = Object.values(imported).reduce((sum, count) => sum + count, 0);

    return NextResponse.json({
      success: true,
      message: 'Demo data imported successfully into the database',
      totalRecords,
      imported,
    });
  } catch (error: any) {
    console.error('Import demo data error:', error);
    return NextResponse.json(
      { error: 'Failed to import demo data', details: error.message },
      { status: 500 }
    );
  }
}
