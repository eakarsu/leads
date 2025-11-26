import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Get import jobs
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = { ownerId: session.user.id };
    if (status) where.status = status;

    const imports = await prisma.dataImport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats
    const stats = {
      totalImports: imports.length,
      completedImports: imports.filter(i => i.status === 'COMPLETED').length,
      processingImports: imports.filter(i => i.status === 'PROCESSING').length,
      failedImports: imports.filter(i => i.status === 'FAILED' || i.status === 'PARTIALLY_COMPLETED').length,
      totalRecordsImported: imports.reduce((sum, i) => sum + (i.successRows || 0), 0),
      totalRecordsFailed: imports.reduce((sum, i) => sum + (i.failedRows || 0), 0),
    };

    return NextResponse.json({ imports, stats });
  } catch (error: any) {
    console.error('Error fetching imports:', error);
    return NextResponse.json({ error: 'Failed to fetch imports' }, { status: 500 });
  }
}

// Create import job
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, objectType, fileName, fileSize, fieldMapping, duplicateHandling, csvData } = body;

    if (!name || !objectType || !fileName || !fieldMapping) {
      return NextResponse.json(
        { error: 'Name, object type, file name, and field mapping are required' },
        { status: 400 }
      );
    }

    // Parse CSV and count rows
    const rows = csvData ? csvData.split('\n').filter((row: string) => row.trim()) : [];
    const totalRows = Math.max(0, rows.length - 1); // Exclude header row

    const importJob = await prisma.dataImport.create({
      data: {
        name,
        objectType,
        fileName,
        fileSize: fileSize || 0,
        fieldMapping,
        duplicateHandling: duplicateHandling || 'SKIP',
        totalRows,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(importJob, { status: 201 });
  } catch (error: any) {
    console.error('Error creating import job:', error);
    return NextResponse.json({ error: 'Failed to create import job' }, { status: 500 });
  }
}

// Process import job
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { importId, action, csvData } = body;

    if (!importId) {
      return NextResponse.json({ error: 'Import ID is required' }, { status: 400 });
    }

    const importJob = await prisma.dataImport.findUnique({
      where: { id: importId },
    });

    if (!importJob) {
      return NextResponse.json({ error: 'Import job not found' }, { status: 404 });
    }

    if (action === 'start' && csvData) {
      // Update status to processing
      await prisma.dataImport.update({
        where: { id: importId },
        data: {
          status: 'PROCESSING',
          startedAt: new Date(),
        },
      });

      // Parse CSV
      const rows = csvData.split('\n').filter((row: string) => row.trim());
      const headers = rows[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
      const dataRows = rows.slice(1);

      const fieldMapping = importJob.fieldMapping as Record<string, string>;
      const errors: any[] = [];
      let successCount = 0;
      let failedCount = 0;
      let duplicateCount = 0;

      for (let i = 0; i < dataRows.length; i++) {
        try {
          const values = dataRows[i].split(',').map((v: string) => v.trim().replace(/"/g, ''));
          const rowData: Record<string, any> = {};

          headers.forEach((header: string, index: number) => {
            const targetField = fieldMapping[header];
            if (targetField && values[index]) {
              rowData[targetField] = values[index];
            }
          });

          // Check for duplicates if needed
          if (importJob.duplicateHandling !== 'CREATE_NEW' && rowData.email) {
            let existing: any = null;
            if (importJob.objectType === 'Lead') {
              existing = await prisma.lead.findFirst({ where: { email: rowData.email } });
            } else if (importJob.objectType === 'Contact') {
              existing = await prisma.contact.findFirst({ where: { email: rowData.email } });
            }

            if (existing) {
              duplicateCount++;
              if (importJob.duplicateHandling === 'SKIP') {
                continue;
              } else if (importJob.duplicateHandling === 'UPDATE') {
                if (importJob.objectType === 'Lead') {
                  await prisma.lead.update({ where: { id: existing.id }, data: rowData });
                } else if (importJob.objectType === 'Contact') {
                  await prisma.contact.update({ where: { id: existing.id }, data: rowData });
                }
                successCount++;
                continue;
              }
            }
          }

          // Create record
          if (importJob.objectType === 'Lead') {
            // Need clientId for leads
            const client = await prisma.clientCompany.findFirst();
            if (client) {
              await prisma.lead.create({
                data: {
                  ...rowData,
                  clientId: client.id,
                  fullName: rowData.fullName || rowData.name || 'Unknown',
                },
              });
              successCount++;
            }
          } else if (importJob.objectType === 'Contact') {
            const client = await prisma.clientCompany.findFirst();
            if (client) {
              await prisma.contact.create({
                data: {
                  ...rowData,
                  clientId: client.id,
                  ownerId: session.user.id,
                  firstName: rowData.firstName || rowData.name?.split(' ')[0] || 'Unknown',
                  lastName: rowData.lastName || rowData.name?.split(' ')[1] || '',
                },
              });
              successCount++;
            }
          }

          // Update progress
          await prisma.dataImport.update({
            where: { id: importId },
            data: {
              processedRows: i + 1,
              successRows: successCount,
              failedRows: failedCount,
              duplicateRows: duplicateCount,
            },
          });
        } catch (rowError: any) {
          failedCount++;
          errors.push({ row: i + 2, error: rowError.message });
        }
      }

      // Mark as completed
      const finalStatus =
        failedCount === 0 ? 'COMPLETED' : failedCount === dataRows.length ? 'FAILED' : 'PARTIALLY_COMPLETED';

      const completedJob = await prisma.dataImport.update({
        where: { id: importId },
        data: {
          status: finalStatus,
          completedAt: new Date(),
          processedRows: dataRows.length,
          successRows: successCount,
          failedRows: failedCount,
          duplicateRows: duplicateCount,
          errorLog: errors.length > 0 ? errors : undefined,
        },
      });

      return NextResponse.json(completedJob);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing import:', error);
    return NextResponse.json({ error: 'Failed to process import' }, { status: 500 });
  }
}
