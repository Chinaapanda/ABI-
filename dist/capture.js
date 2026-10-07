class Capture extends AudioWorkletProcessor{
  constructor(){super();this.buffer=new Float32Array(512);this.offset=0;this.meterCounter=0;this.previous=0;this.phase=0;this.ratio=sampleRate/16000;this.level=0;this.port.onmessage=({data})=>{if(data.port)this.outputPort=data.port;};}
  process(inputs,outputs){
    const channels=inputs[0];if(!channels?.length)return true;
    for(let i=0;i<channels[0].length;i++){
      let value=0;for(const channel of channels)value+=channel[i]/channels.length;
      this.level=Math.max(Math.abs(value),this.level*.999);
      this.phase+=1;
      if(this.phase>=this.ratio){this.phase-=this.ratio;this.buffer[this.offset++]=value;
        if(this.offset===512){const samples=this.buffer;this.outputPort?.postMessage({type:'audio',samples},[samples.buffer]);this.buffer=new Float32Array(512);this.offset=0;}
      }
    }
    if(++this.meterCounter%12===0)this.port.postMessage({type:'level',value:this.level});
    // Outputs remain zero: captured game audio is never played back or doubled.
    return true;
  }
}
registerProcessor('abi-capture',Capture);
