import fs from 'node:fs';
import assert from 'node:assert/strict';
import {generateKit,weaponPool,MODE_CAPS,generateFiveKits,RANDOM_STYLES} from './dist/loadout.js';
const db=JSON.parse(fs.readFileSync('dist/loadout-data.json','utf8'));
for(const mode of Object.keys(MODE_CAPS))for(let tier=3;tier<=MODE_CAPS[mode];tier++){assert.equal(weaponPool(db,{mode,tier}).length,db.weapons.length);assert(weaponPool(db,{mode,tier,role:'pistol'}).some(g=>g.name.includes('MP9')));}
let count=0;for(const mode of Object.keys(MODE_CAPS))for(let tier=3;tier<=MODE_CAPS[mode];tier++)for(const role of ['any','assault','close','precision','pistol'])for(const armor of ['any','separate','armored']){
 const cfg={mode,tier,role,armor};const pool=weaponPool(db,cfg);assert(pool.length);
 for(const gun of pool)for(let n=0;n<3;n++){
 const k=generateKit(db,cfg,Math.random,gun);assert.equal(k.ammo.caliber,k.weapon.caliber);assert(k.ammo.tier<=k.cap&&k.ammo.tier>=3);assert.equal(k.body.tier,tier);assert.equal(k.helmet.tier,tier);assert.equal(k.armored,k.rig===null);assert(k.backpack.slots>=20);assert(k.supplies.length>=7);assert.equal(k.headset,null);count++;
 }
}
assert.throws(()=>generateKit(db,{mode:'normal',tier:6}));assert.throws(()=>generateKit(db,{mode:'bad'}));console.log('Compatible kits verified:',count);

for(const mode of Object.keys(MODE_CAPS))for(let tier=3;tier<=MODE_CAPS[mode];tier++)for(const armor of ["any","separate","armored"])for(let n=0;n<30;n++){const batch=generateFiveKits(db,{mode,tier,armor});assert.equal(batch.length,5);assert.equal(new Set(batch.map(b=>b.kit.weapon.id)).size,5);batch.forEach((b,i)=>{assert.equal(b.style.role,RANDOM_STYLES[i].role);assert(weaponPool(db,{mode,role:b.style.role}).some(w=>w.id===b.kit.weapon.id));assert.equal(b.kit.ammo.caliber,b.kit.weapon.caliber);assert.equal(b.kit.tier,tier);});}
console.log("Five-style batches verified");
