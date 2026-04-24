import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parsePaginationParams, buildPrismaQuery, buildPaginatedResponse } from '@/lib/pagination';

// GET - List assets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paginationParams = parsePaginationParams(request);

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const status = searchParams.get('status');
    const productId = searchParams.get('productId');
    const search = searchParams.get('search');

    const whereClause: any = {};

    if (accountId) {
      whereClause.accountId = accountId;
    }

    if (status) {
      whereClause.status = status;
    }

    if (productId) {
      whereClause.productId = productId;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.asset.count({ where: whereClause });

    const assets = await prisma.asset.findMany({
      where: whereClause,
      ...buildPrismaQuery(paginationParams),
    });

    // Fetch account names for assets
    const accountIds = [...new Set(assets.map(a => a.accountId))];
    const accounts = await prisma.clientCompany.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, name: true },
    });
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    // Fetch product names for assets
    const productIds = [...new Set(assets.map(a => a.productId).filter(Boolean))] as string[];
    const products = productIds.length > 0 ? await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, code: true },
    }) : [];
    const productMap = new Map(products.map(p => [p.id, p]));

    // Add relations to assets
    const assetsWithRelations = assets.map(asset => ({
      ...asset,
      account: accountMap.get(asset.accountId) || null,
      product: asset.productId ? productMap.get(asset.productId) || null : null,
      _count: { cases: 0, entitlements: 0, children: 0 },
    }));

    // Calculate stats
    const stats = {
      totalAssets: assetsWithRelations.length,
      installedAssets: assetsWithRelations.filter(a => a.status === 'INSTALLED').length,
      purchasedAssets: assetsWithRelations.filter(a => a.status === 'PURCHASED').length,
      warrantyExpiringSoon: assetsWithRelations.filter(a => {
        if (!a.warrantyEndDate) return false;
        const daysUntilExpiry = Math.ceil((new Date(a.warrantyEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      }).length,
      totalValue: assetsWithRelations.reduce((sum, a) => sum + (typeof a.price === 'number' ? a.price : 0) * (a.quantity || 1), 0),
    };

    return NextResponse.json(buildPaginatedResponse(assetsWithRelations, total, paginationParams));
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create a new asset
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      accountId,
      contactId,
      productId,
      parentAssetId,
      serialNumber,
      status,
      quantity,
      price,
      purchaseDate,
      installDate,
      usageEndDate,
      warrantyEndDate,
      description,
    } = body;

    const asset = await prisma.asset.create({
      data: {
        name,
        accountId,
        contactId,
        productId,
        parentAssetId,
        serialNumber,
        status: status || 'PURCHASED',
        quantity: quantity || 1,
        price: price || 0,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        installDate: installDate ? new Date(installDate) : null,
        usageEndDate: usageEndDate ? new Date(usageEndDate) : null,
        warrantyEndDate: warrantyEndDate ? new Date(warrantyEndDate) : null,
        description,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update an asset
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      name,
      contactId,
      parentAssetId,
      serialNumber,
      status,
      quantity,
      price,
      purchaseDate,
      installDate,
      usageEndDate,
      warrantyEndDate,
      description,
    } = body;

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        name,
        contactId,
        parentAssetId,
        serialNumber,
        status,
        quantity,
        price,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        installDate: installDate ? new Date(installDate) : undefined,
        usageEndDate: usageEndDate ? new Date(usageEndDate) : undefined,
        warrantyEndDate: warrantyEndDate ? new Date(warrantyEndDate) : undefined,
        description,
      },
    });

    return NextResponse.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete an asset
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }

    // Check for child assets
    const childAssets = await prisma.asset.count({
      where: { parentAssetId: id },
    });

    if (childAssets > 0) {
      return NextResponse.json(
        { error: 'Cannot delete asset with child assets. Please reassign or delete child assets first.' },
        { status: 400 }
      );
    }

    // Delete related asset cases
    await prisma.assetCase.deleteMany({
      where: { assetId: id },
    });

    // Delete asset
    await prisma.asset.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
