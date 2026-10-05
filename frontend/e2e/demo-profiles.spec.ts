import { test, expect } from '@playwright/test';
import { functionalFixture, fixtureLogin, completeFixtureJourney } from './support/functionalFixture';

test.describe('Starter and arbitrary business regression - explicit browser fixtures',()=>{
 test.beforeEach(async({page})=>{await functionalFixture(page);await fixtureLogin(page);});
 test('Five business starters remain editable and do not auto-submit',async({page})=>{
  await page.goto('/onboarding?new=true');
  for(const name of ['Precision Workshop','Neighbourhood Kitchen','Clearpath Digital','City Storage','Community Clinic']){
   const starter=page.getByRole('button',{name:new RegExp(name)});await starter.click();
   await expect(starter).toHaveAttribute('aria-pressed','true');
   await expect(page.getByRole('textbox',{name:'Business name',exact:true})).toHaveValue(name);
   await page.getByRole('textbox',{name:'Business name',exact:true}).fill(name+' edited');
   await expect(page.getByRole('button',{name:/Continue to Products/})).toBeVisible();
  }
 });
 test('Heavy manufacturing context never acquires unrelated seeded results',async({page})=>{
  await completeFixtureJourney(page);await page.goto('/compliance');
  await expect(page.getByRole('heading',{name:'Illustrative business records checklist',exact:true})).toBeVisible();
  for(const irrelevant of ['Dairy Processing & Milk Safety','Packaged Drinking Water Standard','Restaurant & Eating House License','Textile Wet Processing Effluent Standard']) await expect(page.locator('main')).not.toContainText(irrelevant);
  await expect(page.locator('main')).toContainText('Planning');
 });
 test('Own business completes the real frontend state machine with a compact editable interview',async({page})=>{
  await completeFixtureJourney(page,true);await expect(page.getByRole('heading',{name:/Compliance Profile for Arbitrary synthetic business/})).toBeVisible();
 });
});
