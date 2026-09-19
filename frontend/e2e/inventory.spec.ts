import { expect, test, type Page } from '@playwright/test'

const user = {
  id: 1,
  email: 'person@example.com',
  displayName: 'Person Example',
  pictureUrl: null,
  householdId: 1,
  householdName: 'Our home',
  householdRole: 'OWNER',
  pendingInvitations: [],
}

const room = {
  id: 1,
  name: 'Bedroom',
  description: 'Main bedroom',
  color: '#D96F55',
  itemCount: 1,
}

const location = {
  id: 1,
  name: 'Top drawer',
  description: 'Documents',
  color: '#D8A52B',
  roomId: 1,
  roomName: 'Bedroom',
  itemCount: 1,
}

const category = {
  id: 1,
  name: 'Documents',
  color: '#145247',
  itemCount: 1,
}

const item = {
  id: 1,
  name: 'Passport',
  description: 'Travel document',
  quantity: 1,
  categoryId: 1,
  categoryName: 'Documents',
  categoryColor: '#145247',
  roomId: 1,
  roomName: 'Bedroom',
  storageLocationId: 1,
  storageLocationName: 'Top drawer',
  estimatedValue: 0,
  purchaseDate: null,
  warrantyExpirationDate: null,
  condition: 'GOOD',
  notes: null,
  photoUrl: null,
  createdAt: '2026-09-01T10:00:00',
  updatedAt: '2026-09-01T10:00:00',
}

async function mockAuthenticatedApi(page: Page) {
  await page.route('**/api/auth/me', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(user),
  }))
  await page.route('**/api/dashboard', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      totalItems: 1,
      totalRooms: 1,
      totalCategories: 1,
      totalEstimatedValue: 0,
      rooms: [room],
      recentActivity: [],
    }),
  }))
  await page.route('**/api/rooms*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([room]),
  }))
  await page.route('**/api/storage-locations*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([location]),
  }))
  await page.route('**/api/categories*', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([category]),
  }))
  await page.route(/\/api\/items(?:\/\d+)?(?:\?.*)?$/, route => {
    const url = new URL(route.request().url())
    const body = url.pathname.endsWith('/1') ? item : [item]
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
}

test('anonymous visitors see the sign-in page', async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'Authentication required' }),
  }))

  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible()
})

test('an authenticated user can browse items and open item details', async ({ page }) => {
  await mockAuthenticatedApi(page)

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Quick actions' })).toBeVisible()

  await page.getByRole('link', { name: 'Browse items' }).click()
  await expect(page.getByRole('heading', { name: 'All items' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Passport' })).toBeVisible()

  await page.getByRole('link', { name: /Passport/ }).first().click()
  await expect(page).toHaveURL(/\/items\/1$/)
  await expect(page.getByRole('heading', { name: 'Passport', exact: true })).toBeVisible()
  await expect(page.getByText('Bedroom → Top drawer')).toBeVisible()
})

test('item filters stay clear on desktop and compact on mobile', async ({ page }) => {
  await mockAuthenticatedApi(page)

  await page.goto('/items')
  await expect(page.getByRole('heading', { name: 'Refine your items' })).toBeVisible()
  await expect(page.getByLabel('Filter by room')).toBeVisible()

  await page.getByLabel('Filter by room').selectOption('1')
  await expect(page).toHaveURL(/roomId=1/)
  await expect(page.getByRole('button', { name: 'Room: Bedroom' })).toBeVisible()

  await page.getByRole('button', { name: 'Clear all' }).click()
  await expect(page).not.toHaveURL(/roomId=/)

  await page.setViewportSize({ width: 375, height: 760 })
  await page.reload()
  await expect(page.getByLabel('Filter by room')).toBeHidden()
  await page.getByRole('button', { name: 'Show' }).click()
  await expect(page.getByLabel('Filter by room')).toBeVisible()
})

test('an owner can export household data from profile settings', async ({ page }) => {
  await mockAuthenticatedApi(page)
  await page.route(/\/api\/household\/export/, route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/preview')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          format: 'json', householdName: 'Our home', roomCount: 1, storageLocationCount: 1,
          categoryCount: 1, itemCount: 1, movementCount: 0, photoCount: 0, movementHistoryIncluded: true,
        }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Content-Disposition': 'attachment; filename=our-home-inventory.json' },
      body: JSON.stringify({ format: 'nestled-household-export', version: 1, items: [] }),
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: /Open account menu/ }).click()
  await page.getByRole('menuitem', { name: 'Profile & settings' }).click()
  await expect(page.getByRole('heading', { name: 'Profile & settings' })).toBeVisible()
  await page.getByRole('link', { name: 'Data' }).click()
  await expect(page.getByRole('heading', { name: 'Household data' })).toBeVisible()

  await page.getByRole('button', { name: 'Export JSON' }).click()
  await expect(page.getByRole('heading', { name: 'Review JSON export' })).toBeVisible()
  await expect(page.getByText('Movement history: 0 records will be included.')).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download JSON' }).click()
  await expect((await download).suggestedFilename()).toBe('our-home-inventory.json')
})

test('an owner can review and import household data from profile settings', async ({ page }) => {
  await mockAuthenticatedApi(page)
  await page.route(/\/api\/auth\/csrf/, route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ headerName: 'X-XSRF-TOKEN', parameterName: '_csrf', token: 'csrf-token' }),
  }))
  await page.route(/\/api\/household\/import(?:\/|$)/, route => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/preview')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sourceHouseholdName: 'Old home', sourceVersion: 1, destinationHouseholdName: 'Our home',
          roomsToCreate: 1, existingRooms: 0, locationsToCreate: 1, existingLocations: 0,
          categoriesToCreate: 1, existingCategories: 0, itemsToImport: 1, duplicateItems: 0,
          movementRecordsSkipped: 0, errors: [],
          warnings: [{ path: 'photos', message: 'Photo files are not included in the export and cannot be imported' }],
          canImport: true,
        }),
      })
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sourceHouseholdName: 'Old home', destinationHouseholdName: 'Our home',
        roomsCreated: 1, locationsCreated: 1, categoriesCreated: 1, itemsImported: 1,
        duplicateItemsImported: 0, movementRecordsSkipped: 0,
      }),
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: /Open account menu/ }).click()
  await page.getByRole('menuitem', { name: 'Profile & settings' }).click()
  await expect(page.getByRole('heading', { name: 'Profile & settings' })).toBeVisible()
  await page.getByRole('link', { name: 'Data' }).click()
  await expect(page.getByRole('heading', { name: 'Household data' })).toBeVisible()

  await page.setInputFiles('input[aria-label="Import JSON file"]', {
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      format: 'nestled-household-export', version: 1, household: { name: 'Old home' },
      rooms: [{ name: 'Bedroom', description: null, color: null }],
      storageLocations: [{ name: 'Top drawer', description: null, color: null, roomName: 'Bedroom' }],
      categories: [{ name: 'Documents', color: null }],
      items: [{ name: 'Passport', description: null, quantity: 1, categoryName: 'Documents', roomName: 'Bedroom',
        storageLocationName: 'Top drawer', estimatedValue: 0, purchaseDate: null, warrantyExpirationDate: null,
        condition: 'GOOD', notes: null, photoAvailable: false, createdAt: null, updatedAt: null }],
      movementHistory: [],
    })),
  })

  await expect(page.getByRole('heading', { name: 'Review import' })).toBeVisible()
  await expect(page.getByText('Photo files are not included in the export and cannot be imported')).toBeVisible()
  await page.getByRole('button', { name: 'Import 1 item' }).click()
  await expect(page.getByRole('status')).toHaveText('Imported 1 item into Our home.')
})
