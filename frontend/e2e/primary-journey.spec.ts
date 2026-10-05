import { test, expect } from '@playwright/test';
import { functionalFixture, fixtureLogin, completeFixtureJourney,fixtureRequirement } from './support/functionalFixture';
test('Manual auth to starter, compact questions, saved workspace, evidence and all sections',async({page})=>{
 const state=await functionalFixture(page);await fixtureLogin(page);await completeFixtureJourney(page);
 expect(state.answers.Q_DATA).toBe(true);expect(state.answers.Q_SCALE).toBe(25);
 await expect(page.locator('main')).toContainText('0 Standard / quality review areas');
 await expect(page.locator('main')).toContainText('0 Relevant scheme / support areas');
 await expect(page.locator('main')).not.toContainText('Zero Fabricated Laws');
 await expect(page.locator('main')).not.toContainText('Mandatory BIS Standards Evaluated');
 expect(state.requests.filter(r=>r.path.endsWith('/questions')&&r.method==='GET').length).toBe(1);
 await page.goto('/compliance');await page.getByRole('button',{name:'Why it applies · evidence & next steps'}).click();
 await expect(page.locator('main')).toContainText(fixtureRequirement.description);
 for(const path of ['/dashboard','/schemes','/standards','/documents','/workflows','/calendar','/assistant']){
  const initialRequests=state.requests.length;
  await page.goto(path);await expect(page.locator('main')).toBeVisible();await expect(page.locator('main')).not.toBeEmpty();
  await page.waitForLoadState('networkidle');
  expect(state.requests.slice(initialRequests).filter(r=>r.path==='/user/profile')).toHaveLength(1);
 }
});
