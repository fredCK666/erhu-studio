const obj = properties => ({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const str={type:'string'},num={type:'number'},integer={type:'integer'},bool={type:'boolean'};
const arr=items=>({type:'array',items});
const span=obj({start:integer,end:integer,text:str});
const measure=obj({marker:str,cells:arr(obj({label:str,units:num,uncertain:bool})),underlines:arr(obj({start:integer,end:integer,count:integer})),slurs:arr(obj({start:integer,end:integer,confirmed:bool})),bows:arr(span),fingerings:arr(span),upperNotes:arr(span)});
const scan=obj({title:str,header:obj({title:str,left:arr(str),right:str}),beatUnits:num,rows:arr(obj({prefix:str,measures:arr(measure)})),warnings:arr(str),complete:bool});
const scanLayout=obj({header:obj({title:str,left:arr(str),right:str}),rows:arr(obj({measureCount:integer,notes:str})),warnings:arr(str)});
const plan=obj({tasks:arr(obj({title:str,instruction:str,minutes:integer}))});
function legacyScore(value) {
  return {...value,autoUnderlines:false,rows:value.rows.map(row=>({...row,measures:row.measures.map(m=>({...m,
    underlines:m.underlines.map(a=>[a.start,a.end,a.count]), slurs:m.slurs.filter(a=>a.confirmed && a.end>a.start).map(a=>[a.start,a.end]),
    bows:m.bows.map(a=>[a.start,a.end,a.text]),fingerings:m.fingerings.map(a=>[a.start,a.end,a.text]),upperNotes:m.upperNotes.map(a=>[a.start,a.end,a.text])
  }))}))};
}
module.exports={scan,scanLayout,plan,legacyScore};
