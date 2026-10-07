const $=id=>document.getElementById(id);
export function makeQuestion(items, random=Math.random){
 const groups=new Map();for(const item of items){if(!item.pickupSound)continue;if(!groups.has(item.pickupSound))groups.set(item.pickupSound,[]);groups.get(item.pickupSound).push(item);}
 const keys=[...groups.keys()];if(keys.length<4)throw new Error('ต้องมีเสียงอย่างน้อย 4 กลุ่ม');
 const pick=a=>a[Math.floor(random()*a.length)];const key=pick(keys),correct=pick(groups.get(key));
 const wrong=keys.filter(k=>k!==key);const options=[correct];for(let i=0;i<3;i++){const k=wrong.splice(Math.floor(random()*wrong.length),1)[0];options.push(pick(groups.get(k)));}
 for(let i=options.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[options[i],options[j]]=[options[j],options[i]];}
 return {correct,options,related:groups.get(key)};
}
export function initTraining(database){
 let q,answered=false,score=0,total=0,streak=0;const audio=new Audio();audio.preload='auto';
 const stats=()=>{$('quiz-score').textContent=`คะแนน ${score}/${total} · streak ${streak}`;};
 function play(){audio.currentTime=0;audio.play().catch(()=>{$('quiz-feedback').textContent='เล่นเสียงไม่ได้ ลองกดเล่นเสียงอีกครั้ง';});}
 function next(){audio.pause();q=makeQuestion(database.items);answered=false;audio.src='./audio/'+encodeURIComponent(q.correct.pickupSound)+'.ogg';$('quiz-choices').replaceChildren();$('quiz-related').replaceChildren();$('quiz-feedback').textContent='เลือกไอเท็มที่ตรงกับเสียง';
 for(const item of q.options){const b=document.createElement('button');b.className='secondary';const picture=document.createElement('span');picture.className='quiz-picture';const label=document.createElement('span');label.textContent=item.name;
 if(item.iconAvailable&&item.iconUrl){const img=document.createElement('img');img.src=item.iconUrl;img.alt='';img.width=88;img.height=88;img.decoding='async';img.referrerPolicy='no-referrer';img.onerror=()=>{picture.replaceChildren();picture.classList.add('missing');picture.textContent='ไม่มีรูป';};picture.append(img);}else{picture.classList.add('missing');picture.textContent='ไม่มีรูป';}
 b.append(picture,label);b.onclick=()=>{if(answered)return;answered=true;total++;const ok=item.id===q.correct.id;if(ok){score++;streak++;}else streak=0;stats();for(const button of $('quiz-choices').children)button.disabled=true;b.dataset.result=ok?'correct':'wrong';const correctIndex=q.options.findIndex(i=>i.id===q.correct.id);$('quiz-choices').children[correctIndex].dataset.result='correct';$('quiz-feedback').textContent=ok?'ถูกต้อง!':'เฉลย: '+q.correct.name;const p=document.createElement('p');p.textContent='ไอเท็มที่ใช้เสียงเดียวกัน: '+q.related.map(i=>i.name).join(' · ');$('quiz-related').append(p);};$('quiz-choices').append(b);}}
 $('quiz-play').onclick=play;$('quiz-next').onclick=()=>{next();play();};$('quiz-reset').onclick=()=>{score=total=streak=0;stats();next();};
 function tab(training){audio.pause();if(training)$('stop').click();$('listen-panel').hidden=training;$('train-panel').hidden=!training;$('listen-tab').setAttribute('aria-pressed',String(!training));$('train-tab').setAttribute('aria-pressed',String(training));}
 $('listen-tab').onclick=()=>tab(false);$('train-tab').onclick=()=>tab(true);window.addEventListener('pagehide',()=>audio.pause());next();stats();
}
