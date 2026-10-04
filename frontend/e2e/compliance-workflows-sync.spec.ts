import { test, expect } from '@playwright/test';
import {functionalFixture,fixtureLogin,fixtureRequirement} from './support/functionalFixture';
test.describe('Assessment-scoped compliance/workflow synchronization',()=>{
 test.beforeEach(async({page})=>{await functionalFixture(page);await fixtureLogin(page);});
 test('Compliance renders the persisted result without adding industrial requirements',async({page})=>{
  await page.goto('/compliance');await expect(page.getByRole('heading',{name:fixtureRequirement.name,exact:true})).toBeVisible();
  await expect(page.locator('main')).not.toContainText('Factory License Registration');
  await expect(page.locator('main')).not.toContainText('Consent to Establish');
  await page.getByRole('button',{name:'Why it applies · evidence & next steps'}).click();
  await expect(page.getByRole('link',{name:'Open workflow',exact:true})).toHaveAttribute('href',new RegExp('requirement_id='+fixtureRequirement.requirement_id));
  await page.getByRole('button',{name:'Inspect assessment trace'}).click();
  const dialog=page.getByRole('dialog');
  await expect(dialog).toContainText('Source passage not recorded.');
  await expect(dialog.locator('blockquote')).toHaveCount(0);
  await expect(dialog).not.toContainText('Statutory environmental clearances applicable');
 });
 test('Workflow stays linked to its requirement and empty schemes never become fabricated incentives',async({page})=>{
  await page.goto('/workflows');await expect(page.getByRole('heading',{name:fixtureRequirement.name,exact:true,level:2})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Collect records',exact:true})).toBeVisible();
  await page.goto('/schemes');await expect(page.locator('main')).not.toContainText('Startup India Seed Fund Scheme');
  await expect(page.locator('main')).toContainText(/No.*scheme|No.*match|No.*support/i);
 });
});
