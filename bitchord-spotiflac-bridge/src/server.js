import express from "express";
import { manifest } from "./manifest.js";
import { ProviderAdapter } from "./providers/spotiflac/adapter.js";
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
app.get("/stream/:id",async(q,r)=>{
  try{const x=await provider.stream(decodeURIComponent(q.params.id),{quality:String(q.query.quality||"lossless"),atmos:String(q.query.atmos||"auto")}); if(!x)return r.status(404).json({error:"stream_not_found"}); r.set("Cache-Control","no-store").json(x)}
  catch(e){console.error(e.message);r.status(e.statusCode||502).json({error:"provider_unavailable"})}
});
app.listen(port,()=>console.log(`BitChord bridge listening on :${port}`));
