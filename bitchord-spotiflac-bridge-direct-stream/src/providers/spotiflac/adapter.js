const demo=[{id:"demo:1",title:"Bridge Test Track",artist:"Demo Artist",album:"Bridge Test",duration:180,artworkURL:"https://placehold.co/600x600/jpg?text=Demo",format:"flac",audioQuality:"LOSSLESS"}];
async function getJSON(url){
  const h={"Accept":"application/json"}, key=process.env.PROVIDER_API_KEY;
  if(key) h[process.env.PROVIDER_AUTH_HEADER||"X-Provider-Key"]=key;
  const c=new AbortController(), t=setTimeout(()=>c.abort(),Number(process.env.PROVIDER_TIMEOUT_MS||15000));
  try{const r=await fetch(url,{headers:h,signal:c.signal}); if(!r.ok){const e=new Error(`Provider HTTP ${r.status}`);e.statusCode=r.status===404?404:502;throw e} return await r.json()}finally{clearTimeout(t)}
}
function tracks(a){return a.map(t=>({id:String(t.id??""),title:String(t.title??t.name??""),artist:t.artist??t.artists,album:t.album??t.album_name,duration:t.duration??(Number(t.duration_ms)/1000||undefined),artworkURL:t.artworkURL??t.cover_url??t.images?.[0],format:t.format??"flac",audioQuality:t.audioQuality??t.quality??"LOSSLESS",...(t.atmos?{atmos:true,audioModes:["DOLBY_ATMOS"]}:{})})).filter(t=>t.id&&t.title)}
function stream(x){
  if(!x?.url)return null;
  const u=new URL(x.url);
  if(!["http:","https:"].includes(u.protocol))throw new Error("Non-HTTP media URL");
  const headers={};
  for(const [name,value] of Object.entries(x.headers||{})){
    if(/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name)&&typeof value==="string"&&!/[\r\n]/.test(value))headers[name]=value;
  }
  return {url:u.toString(),headers,format:x.format??x.container,quality:x.quality,codec:x.codec,container:x.container,manifest:x.manifest??"none",encrypted:Boolean(x.encrypted),sampleRate:x.sampleRate,bitDepth:x.bitDepth,bitrate:x.bitrate};
}
export class ProviderAdapter{
  constructor(){this.base=process.env.PROVIDER_BASE_URL?.trim()}
  async search(q,o){if(!this.base)return demo.filter(t=>`${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(q.toLowerCase()));
    const u=new URL("/search",this.base);u.searchParams.set("q",q);u.searchParams.set("quality",o.quality);u.searchParams.set("atmos",o.atmos);return tracks((await getJSON(u))?.tracks||[])}
  async stream(id,o){if(!this.base)return null;const u=new URL(`/stream/${encodeURIComponent(id)}`,this.base);u.searchParams.set("quality",o.quality);u.searchParams.set("atmos",o.atmos);return stream(await getJSON(u))}
}
