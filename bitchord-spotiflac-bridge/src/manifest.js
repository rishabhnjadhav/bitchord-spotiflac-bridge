export const manifest={
  id:process.env.ADDON_ID||"com.example.bitchord.spotiflac",
  name:process.env.ADDON_NAME||"SpotiFLAC Bridge",
  version:process.env.ADDON_VERSION||"0.1.0",
  resources:["search","stream"],
  settings:[{key:"quality",type:"select",default:"lossless",options:[
    {label:"Lossless",value:"lossless"},{label:"High",value:"high"},{label:"Low",value:"low"}]}]
};