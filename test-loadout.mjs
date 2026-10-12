import fs from 'node:fs';
import assert from 'node:assert/strict';
import {generateKit,weaponPool,MODE_CAPS} from './dist/loadout.js';
const db=JSON.parse(fs.readFileSync('dist/loadout-data.json','utf8'));
let count=0;for(const mode of Object.keys(MODE_CAPS))for(let tier=3;tier<=MODE_CAPS[mode];tier++)for(const role of ['any','assault','close','precision'])for(const armor of ['any','separate','armored']){
 const cfg={mode,tier,role,armor};const pool=weaponPool(db,cfg);assert(pool.length);
 for(const gun of pool)for(let n=0;n<3;n++){
 const k=generateKit(db,cfg,Math.random,gun);assert.equal(k.ammo.caliber,k.weapon.caliber);assert(k.ammo.tier<=k.cap&&k.ammo.tier>=Math.max(3,tier-1));assert.equal(k.body.tier,tier);assert.equal(k.helmet.tier,tier);assert.equal(k.armored,k.rig===null);assert(k.backpack.slots>=20);assert(k.supplies.length>=7);assert.equal(k.headset,null);count++;
 }
}
assert.throws(()=>generateKit(db,{mode:'normal',tier:6}));assert.throws(()=>generateKit(db,{mode:'bad'}));console.log('Compatible kits verified:',count);
