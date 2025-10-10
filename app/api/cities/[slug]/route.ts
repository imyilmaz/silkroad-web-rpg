import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type RouteContext = {
  params: {
    slug: string;
  };
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const region = await prisma.region.findUnique({
      where: { slug: params.slug },
      include: {
        features: {
          orderBy: { id: "asc" },
          include: {
            npc: {
              include: {
                shopListings: {
                  include: { item: true },
                },
              },
            },
            targetRegion: {
              select: {
                slug: true,
                name: true,
                type: true,
              },
            },
          },
        },
        npcs: {
          orderBy: { id: "asc" },
          include: {
            shopListings: {
              include: { item: true },
            },
          },
        },
        connectionsFrom: {
          include: {
            toRegion: {
              select: {
                slug: true,
                name: true,
                type: true,
              },
            },
          },
        },
        connectionsTo: {
          include: {
            fromRegion: {
              select: {
                slug: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!region) {
      return NextResponse.json(
        { message: "B\u00f6lge bulunamad\u0131." },
        { status: 404 },
      );
    }

    const mapFeature = region.features.map((feature) => ({
      slug: feature.slug,
      name: feature.name,
      type: feature.type,
      description: feature.description,
      icon: feature.icon,
      posX: feature.posX,
      posY: feature.posY,
      npc: feature.npc
        ? {
            slug: feature.npc.slug,
            name: feature.npc.name,
            title: feature.npc.title,
            role: feature.npc.role,
            type: feature.npc.type,
          }
        : null,
      targetRegion: feature.targetRegion
        ? {
            slug: feature.targetRegion.slug,
            name: feature.targetRegion.name,
            type: feature.targetRegion.type,
          }
        : null,
    }));

    const npcList = region.npcs.map((npc) => ({
      slug: npc.slug,
      name: npc.name,
      title: npc.title,
      role: npc.role,
      type: npc.type,
      description: npc.description,
      shopListings: npc.shopListings.map((listing) => ({
        id: listing.id,
        itemId: listing.itemId,
        price: listing.price,
        currency: listing.currency,
        stock: listing.stock,
        item: {
          name: listing.item.name,
          type: listing.item.type,
          rarity: listing.item.rarity,
          icon: listing.item.icon,
          description: listing.item.description,
        },
      })),
    }));

    const travelFrom = region.connectionsFrom.map((connection) => ({
      description: connection.description,
      travelTime: connection.travelTime,
      requirement: connection.requirement,
      destination: connection.toRegion,
    }));

    const travelTo = region.connectionsTo.map((connection) => ({
      description: connection.description,
      travelTime: connection.travelTime,
      requirement: connection.requirement,
      origin: connection.fromRegion,
    }));

    return NextResponse.json({
      region: {
        slug: region.slug,
        name: region.name,
        type: region.type,
        description: region.description,
        ambientTag: region.ambientTag,
        levelMin: region.levelMin,
        levelMax: region.levelMax,
      },
      features: mapFeature,
      npcs: npcList,
      travel: {
        from: travelFrom,
        to: travelTo,
      },
    });
  } catch (error) {
    console.error("City API error:", error);
    return NextResponse.json(
      { message: "B\u00f6lge verisi getirilemedi." },
      { status: 500 },
    );
  }
}
