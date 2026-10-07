const $=id=>document.getElementById(id);
let database,last=null,worker,stream=null,context=null,node=null,source=null,analyzing=false,ready=false,clipGeneration=0;
const money=new Intl.NumberFormat('en-US');
function status(text){$('status').textContent=text;}
function empty(text){$('items').replaceChildren();const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=4;td.className='empty';td.textContent=text;tr.append(td);$('items').append(tr);$('count').textContent='0 รายการ';}
function render(){
  if(!last||!database)return;
  const best=last.scores[0],names=new Set(last.scores.filter(s=>s.score>=best.score-.04).map(s=>s.name));
  let items=database.items.filter(i=>names.has(i.pickupSound));
  const profile=$('profile').value,cargo=$('cargo').value,size=$('size').value;
  if(profile||cargo){const allowed=new Set();for(const p of database.pools){if(profile&&String(p.profile)!==profile)continue;if(cargo&&String(p.price)!==cargo)continue;for(const i of p.items)allowed.add(i.id);}items=items.filter(i=>allowed.has(i.id));}
  if(size)items=items.filter(i=>i.size.join('x')===size);
  items.sort((a,b)=>b.contactPrice-a.contactPrice);$('items').replaceChildren();
  for(const item of items){const row=document.createElement('tr');for(const value of [item.name,item.size.join('x'),money.format(item.contactPrice),item.soundId]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}$('items').append(row);}
  if(!items.length)empty('ไม่พบไอเท็มในตัวกรองนี้ ลองเปลี่ยนขนาดช่องหรือ Cargo');
  $('count').textContent=`${items.length} รายการ`;
  $('match-state').textContent=`${last.early?'ผลเบื้องต้น · ยังไม่ยืนยัน':'จับคู่เสียงครบ'} · ความเหมือน ${best.score.toFixed(2)}`;
  $('match-state').dataset.early=String(last.early);
  $('timing').textContent=`ใช้เสียง ${Math.round(last.observedMs)} ms · คำนวณ ${Math.round(last.computeMs)} ms`;
}
function settings(){worker?.postMessage({type:'settings',threshold:Number($('threshold').value),early:$('early').checked});$('threshold-value').value=Number($('threshold').value).toFixed(2);}
async function stop(){
  analyzing=false;clipGeneration++;if(stream)for(const track of stream.getTracks())track.stop();stream=null;
  node?.disconnect();source?.disconnect();node=null;source=null;
  const previous=context;context=null;if(previous&&previous.state!=='closed')await previous.close().catch(()=>{});
  worker?.postMessage({type:'reset'});$('start').disabled=!ready;$('stop').disabled=true;$('meter-fill').style.width='0%';$('source').textContent='หยุดรับเสียงแล้ว';
}
async function start(){
  if(!ready)return;
  try{
    await stop();
    if(!navigator.mediaDevices?.getDisplayMedia)throw new Error('เบราว์เซอร์นี้ไม่รองรับการแชร์เสียงหน้าต่าง ลองเปิดใน Chrome หรือ Edge รุ่นล่าสุด');
    stream=await navigator.mediaDevices.getDisplayMedia({video:{displaySurface:'window',frameRate:1},audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},windowAudio:'window',systemAudio:'exclude',monitorTypeSurfaces:'exclude',selfBrowserSurface:'exclude',surfaceSwitching:'exclude'});
    const video=stream.getVideoTracks()[0],audio=stream.getAudioTracks()[0];
    if(video?.getSettings().displaySurface!=='window')throw new Error('กรุณาเลือกแท็บ “หน้าต่าง” แล้วเลือกเกม เว็บนี้ไม่ใช้เสียงรวมทั้งเครื่อง');
    if(!audio)throw new Error('ไม่ได้รับเสียงหน้าต่างเกม ลองใหม่และเปิด “แชร์เสียงของหน้าต่าง” หากไม่มีตัวเลือกนี้ เบราว์เซอร์ยังไม่รองรับ');
    context=new AudioContext({sampleRate:16000,latencyHint:'interactive'});await context.resume();await context.audioWorklet.addModule('./capture.js');
    const channel=new MessageChannel();worker.postMessage({type:'port',port:channel.port1},[channel.port1]);worker.postMessage({type:'reset'});settings();
    node=new AudioWorkletNode(context,'abi-capture');node.port.postMessage({port:channel.port2},[channel.port2]);
    node.port.onmessage=({data})=>{if(data.type==='level')$('meter-fill').style.width=`${Math.min(100,Math.sqrt(data.value)*150)}%`;};
    source=context.createMediaStreamSource(new MediaStream([audio]));source.connect(node);node.connect(context.destination);
    video.addEventListener('ended',()=>{void stop().then(()=>status('หยุดแชร์หน้าต่างแล้ว'));},{once:true});
    analyzing=true;$('start').disabled=true;$('stop').disabled=false;$('source').textContent='เสียงของหน้าต่างที่คุณเลือก';status('กำลังฟังเสียงหน้าต่างเกม');
  }catch(error){await stop();status(error.name==='NotAllowedError'?'ยกเลิกการแชร์ หรือเบราว์เซอร์ไม่ได้รับอนุญาตให้แชร์หน้าต่าง':error.message);}
}
async function analyzeBuffer(arrayBuffer,label){
  await stop();const generation=clipGeneration;status('กำลังอ่านคลิป…');let decoder;
  try{
    decoder=new AudioContext({sampleRate:16000});const audio=await decoder.decodeAudioData(arrayBuffer);const mono=new Float32Array(audio.length);
    for(let ch=0;ch<audio.numberOfChannels;ch++){const channel=audio.getChannelData(ch);for(let i=0;i<mono.length;i++)mono[i]+=channel[i]/audio.numberOfChannels;}
    await decoder.close();decoder=null;if(generation!==clipGeneration)return;
    if(audio.sampleRate!==16000)throw new Error('เบราว์เซอร์นี้ไม่รองรับอัตราเสียงที่ใช้ทดสอบ');
    analyzing=true;last=null;empty('กำลังเทียบเสียง…');worker.postMessage({type:'reset'});settings();$('stop').disabled=false;$('start').disabled=true;$('source').textContent=label;status('กำลังทดสอบคลิปในเครื่อง');
    let offset=0;const tick=()=>{if(generation!==clipGeneration)return;const samples=mono.slice(offset,offset+512);offset+=samples.length;worker.postMessage({type:'audio',samples},[samples.buffer]);
      if(offset<mono.length)setTimeout(tick,32);else setTimeout(()=>{if(generation!==clipGeneration)return;$('test-status').textContent=last?'ทดสอบเสร็จแล้ว':'ทดสอบเสร็จ ไม่พบเสียงที่ผ่านคะแนนขั้นต่ำ';$('start').disabled=false;$('stop').disabled=true;status('ทดสอบคลิปเสร็จแล้ว');},100);
    };tick();
  }catch(error){if(decoder)await decoder.close();await stop();status('อ่านคลิปไม่ได้: '+error.message);}
}
async function init(){
  try{
    const [dataResponse,refResponse]=await Promise.all([fetch('./data.json'),fetch('./references.json')]);if(!dataResponse.ok||!refResponse.ok)throw new Error('โหลดข้อมูลไม่สำเร็จ');
    database=await dataResponse.json();const refs=await refResponse.json();
    for(const p of database.profiles)$('profile').add(new Option(p.label,String(p.id)));
    for(const price of [...new Set(database.pools.map(p=>p.price))].sort((a,b)=>a-b))$('cargo').add(new Option(money.format(price),String(price)));
    worker=new Worker('./worker.js',{type:'module'});worker.onerror=()=>{status('ตัวจับเสียงทำงานไม่ได้ กรุณารีโหลดหน้า');void stop();};
    worker.onmessage=({data})=>{
      if(data.type==='ready'){ready=true;$('start').disabled=false;$('demo').disabled=false;status('พร้อม • เปิดเกมแล้วกดเริ่มฟัง');initTraining(database);}
      if(data.type==='match'&&analyzing){last=data;render();}
      if(data.type==='error'){status('ประมวลผลไม่ได้: '+data.message);void stop();}
    };worker.postMessage({type:'init',refs});
  }catch(error){status('เตรียมข้อมูลไม่ได้: '+error.message);}
}
$('start').addEventListener('click',start);$('stop').addEventListener('click',()=>{void stop().then(()=>status('หยุดฟังแล้ว'));});
for(const id of ['size','profile','cargo'])$(id).addEventListener('change',render);
for(const id of ['threshold','early'])$(id).addEventListener('input',settings);
$('demo').addEventListener('click',async()=>{try{const r=await fetch('./reference-test.wav');if(!r.ok)throw new Error('โหลดเสียงไม่ได้');await analyzeBuffer(await r.arrayBuffer(),'เสียงอ้างอิงทดสอบ');}catch(error){status(error.message);}});
$('clip').addEventListener('change',async e=>{const file=e.target.files[0];if(file){if(file.size>50*1024*1024){status('เลือกคลิปไม่เกิน 50 MB');return;}await analyzeBuffer(await file.arrayBuffer(),'คลิป: '+file.name);}});
window.addEventListener('pagehide',()=>{stream?.getTracks().forEach(track=>track.stop());worker?.terminate();});
if(document.modelContext?.registerTool){
  const lifecycle=new AbortController();
  for(const tool of [{name:'get_sound_candidates',description:'อ่านไอเท็มที่เป็นไปได้และผลจับคู่เสียงล่าสุด',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({match:last,filters:{size:$('size').value,profile:$('profile').value,cargo:$('cargo').value},items:[...$('items').querySelectorAll('tr')].map(r=>r.textContent)})},{name:'set_item_size_filter',description:'ตั้งตัวกรองขนาดช่องและอัปเดตรายการไอเท็ม',inputSchema:{type:'object',properties:{size:{type:'string',enum:['','1x1','1x2','2x1','2x2','2x3','3x2']}},required:['size'],additionalProperties:false},execute:input=>{if(!input||!['','1x1','1x2','2x1','2x2','2x3','3x2'].includes(input.size)||Object.keys(input).length!==1)throw new Error('ขนาดช่องไม่ถูกต้อง');$('size').value=input.size;render();return{size:input.size,count:$('count').textContent};}}]){try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
import {initTraining} from './training.js';
void init();
