import express from "express";
import { manifest } from "./manifest.js";
import { ProviderAdapter } from "./providers/spotiflac/adapter.js";
import { pipeline } from "node:stream/promises";
const app=express(), provider=new ProviderAdapter(), port=Number(process.env.PORT||3000);
app.disable("x-powered-by");
app.get("/manifest.json",(_,r)=>r.json(manifest));
app.get("/health",(_,r)=>r.json({ok:true,providerConfigured:Boolean(process.env.PROVIDER_BASE_URL)}));
app.get("/search",async(q,r)=>{
  const text=String(q.query.q||"").trim(), quality=String(q.query.quality||"lossless"), atmos=String(q.query.atmos||"auto");
  if(!text)return r.json({tracks:[]});
  try{r.set("Cache-Control","no-store").json({tracks:await provider.search(text,{quality,atmos})})}
  catch(e){console.error(e.message);r.status(e.statusCode||502).json({tracks:[],error:"provider_unavailable"})}
});
async function proxyStream(q,r){
  const controller=new AbortController();
  const abort=()=>controller.abort();
  q.on("aborted",abort); r.on("close",()=>{if(!r.writableEnded)abort()});
  try{
    const x=await provider.stream(q.params.id,{quality:String(q.query.quality||"lossless"),atmos:String(q.query.atmos||"auto")});
    if(!x)return r.status(404).json({error:"stream_not_found"});
    const headers={...x.headers,Accept:"*/*"};
    for(const name of Object.keys(headers))if(["range","if-range"].includes(name.toLowerCase()))delete headers[name];
    if(q.headers.range)headers.Range=q.headers.range;
    if(q.headers["if-range"])headers["If-Range"]=q.headers["if-range"];
    const upstream=await fetch(x.url,{method:q.method,headers,signal:controller.signal,redirect:"follow"});
    if(!(upstream.status>=200&&upstream.status<300)&&upstream.status!==416){await upstream.body?.cancel();return r.status(upstream.status===404?404:502).json({error:upstream.status===404?"stream_not_found":"source_unavailable"})}
    for(const name of ["accept-ranges","content-length","content-range","content-type","etag","last-modified","content-disposition"]){const value=upstream.headers.get(name);if(value)r.set(name,value)}
    r.set("Cache-Control","no-store");r.status(upstream.status);
    if(q.method==="HEAD"||!upstream.body)return r.end();
    await pipeline(upstream.body,r);
  }catch(e){
    if(controller.signal.aborted)return;
    console.error(e.message);
    if(!r.headersSent)r.status(e.statusCode||502).json({error:"provider_unavailable"});else r.destroy(e);
  }finally{q.off("aborted",abort)}
}
app.route("/stream/:id").get(proxyStream).head(proxyStream);
app.listen(port,()=>console.log(`BitChord bridge listening on :${port}`));
