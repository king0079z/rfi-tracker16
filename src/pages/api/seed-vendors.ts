import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Starting vendor seeding process...')
    
    // First, get existing vendors with their RFI statuses
    const existingVendors = await prisma.vendor.findMany({
      select: {
        id: true,
        name: true,
        rfiStatus: true,
        rfiReceived: true,
        rfiReceivedAt: true
      }
    })
    
    // Create a map of existing vendor statuses
    const vendorStatusMap = existingVendors.reduce((acc, vendor) => {
      acc[vendor.name] = {
        id: vendor.id,
        rfiStatus: vendor.rfiStatus || 'Pending',
        rfiReceived: vendor.rfiReceived || false,
        rfiReceivedAt: vendor.rfiReceivedAt
      }
      return acc
    }, {} as Record<string, { id: number, rfiStatus: string, rfiReceived: boolean, rfiReceivedAt: Date | null }>)

    // Clean up only comments and documents, preserve evaluations
    console.log('Cleaning up existing data...')
    await prisma.$transaction([
      prisma.comment.deleteMany({}),
      prisma.document.deleteMany({})
    ])

    const vendors = [
      {
        name: 'DB Broadcast',
        scopes: ['Media'],
        contacts: ['info@db-broadcast.com'],
        rfiReceived: vendorStatusMap['DB Broadcast']?.rfiReceived ?? true,
        rfiReceivedAt: vendorStatusMap['DB Broadcast']?.rfiReceivedAt ?? new Date('2024-02-15'),
        rfiStatus: vendorStatusMap['DB Broadcast']?.rfiStatus || 'Received',
      },
      {
        name: 'Accenture',
        scopes: ['Media', 'AI'],
        contacts: ['meidi.elkhater@accenture.com'],
        rfiReceived: vendorStatusMap['Accenture']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['Accenture']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['Accenture']?.rfiStatus || 'Pending',
      },
      {
        name: 'Atos',
        scopes: ['Media', 'AI'],
        contacts: ['aleksandra.tyszkiewicz@atos.net'],
        rfiReceived: vendorStatusMap['Atos']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['Atos']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['Atos']?.rfiStatus || 'Pending',
      },
      {
        name: 'BCG',
        scopes: ['Media', 'AI'],
        contacts: ['Pardo.Alberto@bcg.com'],
        rfiReceived: vendorStatusMap['BCG']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['BCG']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['BCG']?.rfiStatus || 'Pending',
      },
      {
        name: 'Cognizant',
        scopes: ['AI'],
        contacts: ['inquiry@cognizant.com', 'maged.wassim@gmail.com'],
        rfiReceived: vendorStatusMap['Cognizant']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['Cognizant']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['Cognizant']?.rfiStatus || 'Pending',
      },
      {
        name: 'Dell',
        scopes: ['AI'],
        contacts: ['Tarek_Elkadi@Dell.com', 'Mohamad.berjawi@dell.com'],
        rfiReceived: vendorStatusMap['Dell']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['Dell']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['Dell']?.rfiStatus || 'Pending',
      },
      {
        name: 'Delloitte',
        scopes: ['Media', 'AI'],
        contacts: ['nkhoury@deloitte.com'],
        rfiReceived: vendorStatusMap['Delloitte']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['Delloitte']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['Delloitte']?.rfiStatus || 'Pending',
      },
      {
        name: 'Digitas',
        scopes: ['AI'],
        contacts: ['Kareem.monem@digitas.com'],
        rfiReceived: vendorStatusMap['Digitas']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['Digitas']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['Digitas']?.rfiStatus || 'Pending',
      },
      {
        name: 'Diversified',
        scopes: ['Media'],
        contacts: ['Lsmeding@onediversified.com'],
        rfiReceived: vendorStatusMap['Diversified']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['Diversified']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['Diversified']?.rfiStatus || 'Pending',
      },
      {
        name: 'EY',
        scopes: ['AI'],
        contacts: ['Ahmad.alshaer@qa.ey.com', 'Marwan.ajami1@qa.ey.com'],
        rfiReceived: vendorStatusMap['EY']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['EY']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['EY']?.rfiStatus || 'Pending',
      },
      {
        name: 'GlobalLogic',
        scopes: ['Media', 'AI'],
        contacts: ['leeon.fleming@globallogic.com'],
        rfiReceived: vendorStatusMap['GlobalLogic']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['GlobalLogic']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['GlobalLogic']?.rfiStatus || 'Pending',
      },
      {
        name: 'GlobeCast',
        scopes: ['Media'],
        contacts: ['Giorgio.Giacomini@globecastme.com'],
        rfiReceived: vendorStatusMap['GlobeCast']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['GlobeCast']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['GlobeCast']?.rfiStatus || 'Pending',
      },
      {
        name: 'IBM',
        scopes: ['AI'],
        contacts: ['wissam.shmait1@ibm.com'],
        rfiReceived: vendorStatusMap['IBM']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['IBM']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['IBM']?.rfiStatus || 'Pending',
      },
      {
        name: 'InfoSys',
        scopes: ['Media', 'AI'],
        contacts: ['prabhsimran.singh01@infosys.com'],
        rfiReceived: vendorStatusMap['InfoSys']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['InfoSys']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['InfoSys']?.rfiStatus || 'Pending',
      },
      {
        name: 'KPMG',
        scopes: ['AI'],
        contacts: ['ahmedbenabdallah@kpmg.com'],
        rfiReceived: vendorStatusMap['KPMG']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['KPMG']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['KPMG']?.rfiStatus || 'Pending',
      },
      {
        name: 'Mckinsey',
        scopes: ['AI'],
        contacts: ['Clayton_OToole@mckinsey.com'],
        rfiReceived: vendorStatusMap['Mckinsey']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['Mckinsey']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['Mckinsey']?.rfiStatus || 'Pending',
      },
      {
        name: 'NEP',
        scopes: ['Media'],
        contacts: ['jrahme@nepgroup.com'],
        rfiReceived: vendorStatusMap['NEP']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['NEP']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['NEP']?.rfiStatus || 'Pending',
      },
      {
        name: 'PWC',
        scopes: ['Media', 'AI'],
        contacts: ['jadoun.naber@pwc.com'],
        rfiReceived: vendorStatusMap['PWC']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['PWC']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['PWC']?.rfiStatus || 'Pending',
      },
      {
        name: 'Qvest',
        scopes: ['Media'],
        contacts: ['ahmad.kayal@qvest.com'],
        rfiReceived: vendorStatusMap['Qvest']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['Qvest']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['Qvest']?.rfiStatus || 'Pending',
      },
      {
        name: 'SoftServe',
        scopes: ['AI'],
        contacts: ['vkaratov@cisco.com'],
        rfiReceived: vendorStatusMap['SoftServe']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['SoftServe']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['SoftServe']?.rfiStatus || 'Pending',
      },
      {
        name: 'SouthWorks',
        scopes: ['AI'],
        contacts: ['gerardo.meola@southworks.com'],
        rfiReceived: vendorStatusMap['SouthWorks']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['SouthWorks']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['SouthWorks']?.rfiStatus || 'Pending',
      },
      {
        name: 'TenX',
        scopes: ['AI'],
        contacts: ['adnan@tenx.ai'],
        rfiReceived: vendorStatusMap['TenX']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['TenX']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['TenX']?.rfiStatus || 'Pending',
      },
      {
        name: 'Valtech',
        scopes: ['AI'],
        contacts: ['vishal.rami@valtech.com'],
        rfiReceived: vendorStatusMap['Valtech']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['Valtech']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['Valtech']?.rfiStatus || 'Pending',
      },
      {
        name: 'Whyfive',
        scopes: ['AI'],
        contacts: ['Ahmed@whyfive.com'],
        rfiReceived: vendorStatusMap['Whyfive']?.rfiReceived ?? false,
        rfiReceivedAt: vendorStatusMap['Whyfive']?.rfiReceivedAt ?? null,
        rfiStatus: vendorStatusMap['Whyfive']?.rfiStatus || 'Pending',
      },
    ]

    console.log(`Processing ${vendors.length} vendors...`)
    
    // Instead of deleting all vendors, update existing ones and create new ones
    for (const vendor of vendors) {
      const existingVendor = vendorStatusMap[vendor.name]
      
      if (existingVendor) {
        // Update existing vendor
        await prisma.vendor.update({
          where: { id: existingVendor.id },
          data: vendor
        })
      } else {
        // Create new vendor
        await prisma.vendor.create({
          data: vendor
        })
      }
    }

    // Remove vendors that are no longer in the list
    const currentVendorNames = vendors.map(v => v.name)
    const vendorsToRemove = existingVendors.filter(v => !currentVendorNames.includes(v.name))
    
    for (const vendor of vendorsToRemove) {
      // First remove all related evaluations
      await prisma.evaluation.deleteMany({
        where: { vendorId: vendor.id }
      })
      // Then remove the vendor
      await prisma.vendor.delete({
        where: { id: vendor.id }
      })
    }

    console.log('Vendor seeding completed successfully')
    return res.status(200).json({ 
      message: 'Vendors seeded successfully',
      count: vendors.length
    })
  } catch (error) {
    console.error('Error seeding vendors:', error)
    return res.status(500).json({ 
      error: 'Failed to seed vendors',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}