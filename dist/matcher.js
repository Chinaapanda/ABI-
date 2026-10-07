const RATE=16000,N=512,HOP=128,BINS=188;
const windowHann=Float64Array.from({length:N},(_,i)=>.5-.5*Math.cos(2*Math.PI*i/N));
const reverse=new Uint16Array(N);
for(let i=0;i<N;i++){let v=i,r=0;for(let j=0;j<9;j++){r=(r<<1)|(v&1);v>>=1;}reverse[i]=r;}
function spectrum(samples){
  const re=new Float64Array(N),im=new Float64Array(N);
  for(let i=0;i<N;i++)re[reverse[i]]=samples[i]*windowHann[i];
  for(let len=2;len<=N;len<<=1){const a=-2*Math.PI/len,wr0=Math.cos(a),wi0=Math.sin(a);
    for(let start=0;start<N;start+=len){let wr=1,wi=0;for(let j=0;j<len/2;j++){
      const u=start+j,v=u+len/2,tr=wr*re[v]-wi*im[v],ti=wr*im[v]+wi*re[v];
      re[v]=re[u]-tr;im[v]=im[u]-ti;re[u]+=tr;im[u]+=ti;
      const next=wr*wr0-wi*wi0;wi=wr*wi0+wi*wr0;wr=next;
    }}
  }
  const out=new Float32Array(BINS);let norm=0;
  for(let i=0;i<BINS;i++){out[i]=Math.sqrt(Math.hypot(re[i+2],im[i+2]));norm+=out[i]*out[i];}
  norm=Math.sqrt(norm)||1;for(let i=0;i<BINS;i++)out[i]/=norm;
  return out;
}
export class Matcher{
  constructor(refs){this.refs=refs.map(r=>({...r,values:r.values??new Float32Array(Uint8Array.from(atob(r.data),c=>c.charCodeAt(0)).buffer)}));this.threshold=.94;this.allowEarly=true;this.reset();}
  reset(){this.samples=[];this.frames=[];this.energies=[];this.totalFrames=0;this.lastMatchFrame=-1e9;this.lastName=null;this.firstActiveFrame=null;}
  push(input){
    for(const x of input)this.samples.push(x);
    const results=[];
    while(this.samples.length>=N){
      const block=this.samples.slice(0,N);let energy=0;for(const x of block)energy+=x*x;
      energy=Math.sqrt(energy/N);this.frames.push(spectrum(block));this.energies.push(energy);this.samples.splice(0,HOP);this.totalFrames++;
      if(this.frames.length>250){this.frames.shift();this.energies.shift();}
      if(energy>.0006&&this.firstActiveFrame===null)this.firstActiveFrame=this.totalFrames;
      if(energy<.0003&&this.energies.slice(-15).every(x=>x<.0003))this.firstActiveFrame=null;
      if(this.totalFrames%2===0&&this.energies.slice(-100).some(x=>x>.0006)){const result=this.match();if(result)results.push(result);}
    }
    return results;
  }
  score(ref,length,start){
    let sum=0;for(let t=0;t<length;t++){const f=this.frames[start+t],offset=t*BINS;for(let b=0;b<BINS;b++)sum+=f[b]*ref.values[offset+b];}return sum/length;
  }
  match(){
    const started=performance.now(),count=this.frames.length;let full=[],early=[];
    for(const ref of this.refs){
      let best=-1,bestStart=0;
      // Only evaluate matches ending in the last 40 ms; never rediscover old audio.
      for(let start=Math.max(0,count-ref.frames-12);start<=count-ref.frames;start++){
        const s=this.score(ref,ref.frames,start);if(s>best){best=s;bestStart=start;}
      }
      if(best>=0)full.push({name:ref.name,score:best,durationMs:(ref.frames*HOP+N-HOP)/RATE*1000,start:bestStart});
      let provisional=-1,observed=0;
      for(const length of [20,35,55]){
        if(length>=ref.frames||length>count)continue;
        for(let start=Math.max(0,count-length-4);start<=count-length;start++){
          const s=this.score(ref,length,start);if(s>provisional){provisional=s;observed=length;}
        }
      }
      if(provisional>=0)early.push({name:ref.name,score:provisional,durationMs:(observed*HOP+N-HOP)/RATE*1000});
    }
    full.sort((a,b)=>b.score-a.score);early.sort((a,b)=>b.score-a.score);
    const fullBest=full[0],earlyBest=early[0];let result=null;
    if(fullBest&&fullBest.score>=this.threshold&&fullBest.score-(full[1]?.score??0)>=.015){result={scores:full.slice(0,3),early:false};}
    else if(this.allowEarly&&earlyBest&&earlyBest.score>=.97&&earlyBest.score-(early[1]?.score??0)>=.035){result={scores:early.slice(0,3),early:true};}
    if(!result)return null;
    const best=result.scores[0];
    if(best.name===this.lastName&&this.totalFrames-this.lastMatchFrame<12)return null;
    this.lastName=best.name;this.lastMatchFrame=this.totalFrames;
    result.computeMs=performance.now()-started;result.observedMs=best.durationMs;return result;
  }
}
export {spectrum};
