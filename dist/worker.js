import {Matcher} from './matcher.js';
let matcher=null;
function receive(message){
  if(message.type==='audio'&&matcher){
    const results=matcher.push(message.samples);
    for(const result of results)postMessage({type:'match',...result});
  }
}
self.onmessage=async({data})=>{
  try{
    if(data.type==='init'){matcher=new Matcher(data.refs);matcher.threshold=.94;matcher.allowEarly=true;postMessage({type:'ready'});}
    if(data.type==='port'){data.port.onmessage=e=>receive(e.data);data.port.start();}
    if(data.type==='audio')receive(data);
    if(data.type==='reset')matcher?.reset();
    if(data.type==='settings'&&matcher){matcher.threshold=data.threshold;matcher.allowEarly=data.early;}
  }catch(error){postMessage({type:'error',message:error.message});}
};
