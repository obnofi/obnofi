// tests/editor.spec.ts
import { test, expect } from '@playwright/test'

test('Tiptap 블록 에디터 기본 동작', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.click('.editor')
    await page.keyboard.type('테스트 노트')
    await expect(page.locator('.editor')).toContainText('테스트 노트')
})

test('/ 입력시 블록 메뉴 표시', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.click('.editor')
    await page.keyboard.type('/')
    await expect(page.locator('.block-menu')).toBeVisible()
})

test('캔버스 삽입', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.click('.editor')
    await page.keyboard.type('/canvas')
    await expect(page.locator('.tldraw')).toBeVisible()
})