export const METHODS={
 wheel:{action:'หมุนสุ่ม 1 ชุด',help:'หมุนวงล้อเพื่อเลือกปืน · เปลี่ยน 8 ตัวอย่างทุกครั้ง'},
 slots:{action:'ดึงสล็อต',help:'ปืน หมวก และเกราะเลื่อนใน 3 ช่อง แล้วหยุดเผยชุด'},
 cards:{action:'สับไพ่',help:'สับไพ่คว่ำ 3 ใบ แล้วเลือกเปิด 1 ใบเพื่อรับชุด'},
 dice:{action:'ทอยลูกเต๋า',help:'ทอยลูกเต๋าแล้วเผยปืน · แต้มเป็นลูกเล่น ไม่จำกัดปืนเหลือ 6 กระบอก'},
 ticket:{action:'จับฉลาก 1 ใบ',help:'เขย่ากล่องแล้วดึงฉลากปืนออกมา 1 ใบ'}
};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function element(tag,className,text){const e=document.createElement(tag);e.className=className;e.textContent=text;return e;}
function reveal(stage,kit){const image=element('img','draw-image','');image.src=kit.weapon.image;image.alt=kit.weapon.name;image.referrerPolicy='no-referrer';image.onerror=()=>image.hidden=true;stage.append(image,element('strong','draw-name',kit.weapon.name));}
export async function animateDraw(method,stage,generate,pool,reduced){
 stage.replaceChildren();stage.dataset.method=method;
 if(method==='cards'){
  stage.append(element('p','draw-caption','เลือกไพ่ 1 ใบ'));
  const row=element('div','draw-cards','');stage.append(row);
  return new Promise(resolve=>{for(let i=0;i<3;i++){const card=element('button','draw-card',`ABI\n${i+1}`);card.setAttribute('aria-label',`เปิดไพ่ใบที่ ${i+1}`);row.append(card);card.onclick=async()=>{for(const b of row.children)b.disabled=true;const kit=generate();card.classList.add('chosen');card.textContent='✓';if(!reduced)await pause(450);reveal(stage,kit);resolve(kit);};}});
 }
 const kit=generate();
 if(method==='slots'){
  const row=element('div','slot-row',''),labels=['ปืน','หมวก','เกราะ'];stage.append(row);
  const cells=labels.map(label=>{const box=element('div','slot-cell','');box.append(element('small','',label));const value=element('strong','','…');box.append(value);row.append(box);return value;});
  const final=[kit.weapon.name,kit.helmet.name,kit.body.name];
  if(!reduced)for(let tick=0;tick<15;tick++){cells.forEach((cell,i)=>{cell.textContent=i===0?pool[Math.floor(Math.random()*pool.length)].name:tick%2?'▓▓▓':'░░░';});await pause(80+tick*5);}
  for(let i=0;i<3;i++){cells[i].textContent=final[i];cells[i].classList.add('settled');if(!reduced)await pause(180);}
 }else if(method==='dice'){
  const die=element('div','draw-die','⚀');stage.append(die);
  if(!reduced){die.classList.add('rolling');for(let i=0;i<14;i++){die.textContent=['⚀','⚁','⚂','⚃','⚄','⚅'][Math.floor(Math.random()*6)];await pause(110);}die.classList.remove('rolling');}
  die.textContent=['⚀','⚁','⚂','⚃','⚄','⚅'][Math.floor(Math.random()*6)];reveal(stage,kit);
 }else if(method==='ticket'){
  const box=element('div','ticket-box','ABI');stage.append(box);
  if(!reduced){box.classList.add('shaking');await pause(1300);box.classList.remove('shaking');}
  const ticket=element('div','draw-ticket',`🎟 ${kit.weapon.name}`);stage.append(ticket);reveal(stage,kit);
 }else throw new Error('วิธีสุ่มไม่ถูกต้อง');
 return kit;
}
