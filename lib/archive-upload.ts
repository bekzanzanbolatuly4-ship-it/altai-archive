export type TypeSpec={mime:string;ext:string;valid:(bytes:Buffer)=>boolean};

const allowed:Record<string,TypeSpec>={
 'application/pdf':{mime:'application/pdf',ext:'pdf',valid:b=>b.length>=5&&b.subarray(0,5).toString()==='%PDF-'},
 'image/jpeg':{mime:'image/jpeg',ext:'jpg',valid:b=>b.length>=3&&b[0]===0xff&&b[1]===0xd8&&b[2]===0xff},
 'image/png':{mime:'image/png',ext:'png',valid:b=>b.length>=8&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))},
 'image/webp':{mime:'image/webp',ext:'webp',valid:b=>b.length>=12&&b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP'},
 'image/tiff':{mime:'image/tiff',ext:'tiff',valid:b=>b.length>=4&&((b[0]===0x49&&b[1]===0x49&&b[2]===42&&b[3]===0)||(b[0]===0x4d&&b[1]===0x4d&&b[2]===0&&b[3]===42))}
};

const mimeAliases:Record<string,string>={
 'image/pjpeg':'image/jpeg','image/jpg':'image/jpeg','image/x-png':'image/png','image/tif':'image/tiff','image/x-tiff':'image/tiff'
};

const extToMime:Record<string,string>={
 pdf:'application/pdf',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',tif:'image/tiff',tiff:'image/tiff'
};

export function resolveUploadType(fileType:string,fileName:string):TypeSpec|null{
 const ext=fileName.split('.').pop()?.toLowerCase()||'';
 const expectedMime=extToMime[ext];
 if(!expectedMime)return null;
 const normalizedMime=mimeAliases[fileType.trim().toLowerCase()]||fileType.trim().toLowerCase();
 if(!allowed[normalizedMime]||normalizedMime!==expectedMime)return null;
 return allowed[expectedMime];
}
