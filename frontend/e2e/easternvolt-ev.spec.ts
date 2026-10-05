import {test,expect} from '@playwright/test';
import {functionalFixture,fixtureLogin} from './support/functionalFixture';
test('EV equipment standards distinguish contextual quality guidance from reviewed mandatory standards',async({page})=>{
 await functionalFixture(page,{standard:true});await fixtureLogin(page);await page.goto('/standards');
 await expect(page.getByRole('heading',{name:'Illustrative quality review'})).toBeVisible();
 await expect(page.getByText('Quality area to explore',{exact:true})).toBeVisible();
 await expect(page.locator('main')).toContainText('no reviewed standard or mandatory status established');
 await page.getByRole('button',{name:/Evidence & source clauses/}).click();
 await expect(page.locator('main')).toContainText('Synthetic contextual authority');
 await expect(page.locator('main').getByRole('link',{name:'Official Gazette'})).not.toBeVisible();
 await page.getByRole('link',{name:/View details/}).click();
 await expect(page.getByRole('heading',{name:'Illustrative quality review'})).toBeVisible();
});
