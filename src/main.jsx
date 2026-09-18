import '@fontsource/geist-sans/400.css';
import '@fontsource/geist-sans/500.css';
import '@fontsource/geist-sans/600.css';
import '@fontsource/geist-sans/700.css';
import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {supabase,cloudReady} from './supabase';
import {LayoutDashboard,CheckSquare,BookOpen,CalendarDays,CalendarClock,Timer,Plus,Search,ChevronDown,Trash2,Check,Clock3,Target,Flame,LogOut,Menu,X,ArrowUpRight,Play,Pause,RotateCcw,Settings,Pencil,Sun,Moon,Monitor,CircleUser,Palette,Bell,SlidersHorizontal,ShieldCheck,FileText,Upload,Download,ExternalLink,File,FilePlus2} from 'lucide-react';
import './styles.css';

const seedSubjects=[{id:'s1',name:'Work Project',code:'PRJ',category:'Work',color:'#8b5cf6',icon:'book-open',target_hours:30},{id:'s2',name:'Personal Growth',code:'LIFE',category:'Personal',color:'#06b6d4',icon:'database',target_hours:25},{id:'s3',name:'Learning',code:'LEARN',category:'Learning',color:'#f59e0b',icon:'network',target_hours:25},{id:'s4',name:'Home & Life',code:'LIFE',category:'Personal',color:'#ec4899',icon:'cpu',target_hours:18}];
const WEEKDAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const ORBIT_QUOTES=[
 {title:'Small steps, every day.',body:'Progress is built one task at a time.'},
 {title:'Focus on what matters.',body:'A little progress today compounds tomorrow.'},
 {title:'Make it happen.',body:'Start small, stay consistent, keep moving.'},
 {title:'Done beats perfect.',body:'Momentum comes from finishing the next thing.'},
 {title:'Your future self will thank you.',body:'The work you do today makes tomorrow easier.'},
 {title:'Keep moving forward.',body:'Even one focused session is progress.'},
 {title:'Build your momentum.',body:'Consistency turns ordinary days into results.'},
 {title:'One task at a time.',body:'Clear the next step, then take the next one.'},
 {title:'Progress, not pressure.',body:'Give yourself room to learn and keep going.'}
];
const seedTasks=[{id:'t1',title:'Review project notes',subject_id:'s1',due_date:'2026-09-11',priority:'High',status:'In Progress',estimated_minutes:60,tags:['review'],notes:''},{id:'t2',title:'Finish weekly plan',subject_id:'s2',due_date:'2026-09-12',priority:'Urgent',status:'Todo',estimated_minutes:45,tags:['planning'],notes:''},{id:'t3',title:'Read and summarize an article',subject_id:'s3',due_date:'2026-09-10',priority:'Medium',status:'Todo',estimated_minutes:30,tags:['learning'],notes:''}];
function uid(){return crypto.randomUUID?.()||Math.random().toString(36).slice(2)}

const ATTACHMENT_DB='orbit_attachment_store';
const ATTACHMENT_STORE='pdfs';
function openAttachmentDB(){return new Promise((resolve,reject)=>{if(!('indexedDB' in window)){reject(new Error('IndexedDB unavailable'));return}const req=indexedDB.open(ATTACHMENT_DB,2);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(ATTACHMENT_STORE)){const store=db.createObjectStore(ATTACHMENT_STORE,{keyPath:'id'});store.createIndex('subject_id','subject_id',{unique:false})}if(!db.objectStoreNames.contains(SYLLABUS_STORE))db.createObjectStore(SYLLABUS_STORE,{keyPath:'subject_id'});if(!db.objectStoreNames.contains(RESOURCE_STORE)){const store=db.createObjectStore(RESOURCE_STORE,{keyPath:'id'});store.createIndex('subject_id','subject_id',{unique:false})}};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||new Error('Unable to open attachment storage'))})}
async function listSubjectPdfs(subjectId){const db=await openAttachmentDB();return new Promise((resolve,reject)=>{const tx=db.transaction(ATTACHMENT_STORE,'readonly');const req=tx.objectStore(ATTACHMENT_STORE).index('subject_id').getAll(subjectId);req.onsuccess=()=>{db.close();resolve(req.result.sort((a,b)=>b.created_at.localeCompare(a.created_at)))};req.onerror=()=>{db.close();reject(req.error)}})}
async function saveSubjectPdf(subjectId,file){const db=await openAttachmentDB();const row={id:uid(),subject_id:subjectId,name:file.name,size:file.size,type:file.type||'application/pdf',created_at:new Date().toISOString(),blob:file};return new Promise((resolve,reject)=>{const tx=db.transaction(ATTACHMENT_STORE,'readwrite');tx.objectStore(ATTACHMENT_STORE).put(row);tx.oncomplete=()=>{db.close();resolve(row)};tx.onerror=()=>{db.close();reject(tx.error)}})}
async function deleteSubjectPdf(id){const db=await openAttachmentDB();return new Promise((resolve,reject)=>{const tx=db.transaction(ATTACHMENT_STORE,'readwrite');tx.objectStore(ATTACHMENT_STORE).delete(id);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
const SYLLABUS_STORE='syllabus'; const RESOURCE_STORE='subject_resources';
async function loadSubjectSyllabus(subjectId){const db=await openAttachmentDB();return new Promise((resolve,reject)=>{const req=db.transaction(SYLLABUS_STORE,'readonly').objectStore(SYLLABUS_STORE).get(subjectId);req.onsuccess=()=>{db.close();resolve(req.result?.chapters||[])};req.onerror=()=>{db.close();reject(req.error)}})}
async function saveSubjectSyllabus(subjectId,chapters){const db=await openAttachmentDB();return new Promise((resolve,reject)=>{const tx=db.transaction(SYLLABUS_STORE,'readwrite');tx.objectStore(SYLLABUS_STORE).put({subject_id:subjectId,chapters,updated_at:new Date().toISOString()});tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
async function listSubjectFiles(subjectId){const db=await openAttachmentDB();return new Promise((resolve,reject)=>{const req=db.transaction(RESOURCE_STORE,'readonly').objectStore(RESOURCE_STORE).index('subject_id').getAll(subjectId);req.onsuccess=()=>{db.close();resolve(req.result.sort((a,b)=>b.created_at.localeCompare(a.created_at)))};req.onerror=()=>{db.close();reject(req.error)}})}
async function saveSubjectFile(subjectId,file){const db=await openAttachmentDB();const row={id:uid(),subject_id:subjectId,name:file.name,size:file.size,type:file.type||'application/octet-stream',created_at:new Date().toISOString(),blob:file};return new Promise((resolve,reject)=>{const tx=db.transaction(RESOURCE_STORE,'readwrite');tx.objectStore(RESOURCE_STORE).put(row);tx.oncomplete=()=>{db.close();resolve(row)};tx.onerror=()=>{db.close();reject(tx.error)}})}
async function readSubjectFile(id){const db=await openAttachmentDB();return new Promise((resolve,reject)=>{const req=db.transaction(RESOURCE_STORE,'readonly').objectStore(RESOURCE_STORE).get(id);req.onsuccess=()=>{db.close();resolve(req.result)};req.onerror=()=>{db.close();reject(req.error)}})}
async function deleteSubjectFile(id){const db=await openAttachmentDB();return new Promise((resolve,reject)=>{const tx=db.transaction(RESOURCE_STORE,'readwrite');tx.objectStore(RESOURCE_STORE).delete(id);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
async function deleteSubjectLocalData(subjectId){const db=await openAttachmentDB();return new Promise((resolve,reject)=>{const tx=db.transaction([ATTACHMENT_STORE,SYLLABUS_STORE,RESOURCE_STORE],'readwrite');for(const storeName of [ATTACHMENT_STORE,RESOURCE_STORE]){const store=tx.objectStore(storeName),idx=store.index('subject_id');idx.openKeyCursor(IDBKeyRange.only(subjectId)).onsuccess=e=>{const c=e.target.result;if(c){store.delete(c.primaryKey);c.continue()}}}tx.objectStore(SYLLABUS_STORE).delete(subjectId);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})}
async function readSubjectPdf(id){const db=await openAttachmentDB();return new Promise((resolve,reject)=>{const req=db.transaction(ATTACHMENT_STORE,'readonly').objectStore(ATTACHMENT_STORE).get(id);req.onsuccess=()=>{db.close();resolve(req.result)};req.onerror=()=>{db.close();reject(req.error)}})}
function formatBytes(bytes){if(!bytes)return '0 KB';const units=['B','KB','MB','GB'];const i=Math.min(Math.floor(Math.log(bytes)/Math.log(1024)),units.length-1);return `${(bytes/1024**i).toFixed(i?1:0)} ${units[i]}`}
function playCompletionSound(){
 try{
  const C=window.AudioContext||window.webkitAudioContext;
  if(!C)return;
  const ctx=new C();
  const now=ctx.currentTime;
  [0,0.16,0.32].forEach((offset,i)=>{
   const osc=ctx.createOscillator();
   const gain=ctx.createGain();
   osc.type='sine';
   osc.frequency.value=[660,880,1046.5][i];
   gain.gain.setValueAtTime(0.0001,now+offset);
   gain.gain.exponentialRampToValueAtTime(0.16,now+offset+0.02);
   gain.gain.exponentialRampToValueAtTime(0.0001,now+offset+0.13);
   osc.connect(gain).connect(ctx.destination);
   osc.start(now+offset);
   osc.stop(now+offset+0.14);
  });
  setTimeout(()=>ctx.close?.(),700);
 }catch{}
}
function formatDashboardDate(date=new Date()){return date.toLocaleDateString(undefined,{weekday:'long',day:'2-digit',month:'short',year:'numeric'}).toUpperCase().replace(',', ' ·')}
function localDateKey(date=new Date()){const y=date.getFullYear();const m=String(date.getMonth()+1).padStart(2,'0');const d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`}

const GOOGLE_CALENDAR_SCOPE='https://www.googleapis.com/auth/calendar.events';
function nextDateKey(dateKey){const d=fromDateKey(dateKey);d.setDate(d.getDate()+1);return localDateKey(d)}
function timeToMinutes(value){if(!value)return null;const [h,m]=String(value).split(':').map(Number);if(!Number.isFinite(h)||!Number.isFinite(m))return null;return h*60+m}
function durationMinutes(startDate,startTime,endDate,endTime){if(!startDate||!endDate||!startTime||!endTime)return null;const a=new Date(`${startDate}T${startTime}:00`),b=new Date(`${endDate}T${endTime}:00`);const diff=Math.round((b-a)/60000);return Number.isFinite(diff)&&diff>0?diff:null}
function sessionDuration(date,start,end){if(!date||!start||!end)return null;let diff=durationMinutes(date,start,date,end);if(diff)return diff;const next=new Date(`${date}T${end}:00`);next.setDate(next.getDate()+1);return durationMinutes(date,start,localDateKey(next),end)}
function formatTimeValue(v){if(!v)return '';const [h,m]=String(v).split(':').map(Number);if(!Number.isFinite(h)||!Number.isFinite(m))return v;const d=new Date(2000,0,1,h,m);return d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}
function browserTimeZone(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'}catch{return 'UTC'}}
function calendarEventPayload(task,subjectName){
 const description=[`ORBIT Tracker task`,subjectName?`Subject: ${subjectName}`:null,task.notes||null,task.priority?`Priority: ${task.priority}`:null].filter(Boolean).join('\n');
 const startDate=task.start_date||task.due_date;
 const endDate=task.end_date||task.due_date;
 const hasTimed=Boolean(startDate&&endDate&&task.start_time&&task.end_time&&durationMinutes(startDate,task.start_time,endDate,task.end_time));
 if(hasTimed){
  const tz=browserTimeZone();
  return {summary:task.title?.trim()||'ORBIT Task',description,start:{dateTime:`${startDate}T${task.start_time}:00`,timeZone:tz},end:{dateTime:`${endDate}T${task.end_time}:00`,timeZone:tz},transparency:'opaque'};
 }
 return {summary:task.title?.trim()||'ORBIT Task',description,start:{date:startDate},end:{date:nextDateKey(endDate)},transparency:'opaque'};
}
async function googleCalendarRequest(accessToken,path,options={}){
 const response=await fetch(`https://www.googleapis.com/calendar/v3${path}`,{...options,headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json',...(options.headers||{})}});
 if(!response.ok){let message='Google Calendar request failed.';try{const body=await response.json();message=body?.error?.message||message}catch{}const error=new Error(message);error.status=response.status;throw error}
 if(response.status===204)return null;
 return response.json();
}
async function createGoogleCalendarEvent(accessToken,task,subjectName){
 if(!accessToken||!task?.due_date)return null;
 const eventId=`orbit${String(task.id||uid()).replace(/-/g,'')}`.slice(0,1024);
 const event={id:eventId,...calendarEventPayload(task,subjectName)};
 return googleCalendarRequest(accessToken,'/calendars/primary/events',{method:'POST',body:JSON.stringify(event)});
}
async function updateGoogleCalendarEvent(accessToken,eventId,task,subjectName){
 if(!accessToken||!eventId)return null;
 if(!task?.due_date)return googleCalendarRequest(accessToken,`/calendars/primary/events/${encodeURIComponent(eventId)}`,{method:'DELETE'});
 const event=calendarEventPayload(task,subjectName);
 return googleCalendarRequest(accessToken,`/calendars/primary/events/${encodeURIComponent(eventId)}`,{method:'PATCH',body:JSON.stringify(event)});
}
async function deleteGoogleCalendarEvent(accessToken,eventId){
 if(!accessToken||!eventId)return;
 return googleCalendarRequest(accessToken,`/calendars/primary/events/${encodeURIComponent(eventId)}`,{method:'DELETE'});
}
function googleEventIdForTask(task){return task?.id?`orbit${String(task.id).replace(/-/g,'')}`.slice(0,1024):null}
async function deleteCalendarEventForTask(accessToken,task){
 const eventId=task?.google_event_id||googleEventIdForTask(task);
 if(!accessToken||!eventId)return;
 try{await deleteGoogleCalendarEvent(accessToken,eventId)}catch(e){if(e.status!==404)throw e}
}
async function syncTaskToGoogleCalendar(accessToken,task,subjectName){
 if(!accessToken||!task)return task;
 if(task.timetable_cancelled){if(task.google_event_id)await deleteGoogleCalendarEvent(accessToken,task.google_event_id).catch(error=>{if(error.status!==404)throw error});return {...task,google_event_id:null};}
 if(!task.due_date){
  if(task.google_event_id) await deleteGoogleCalendarEvent(accessToken,task.google_event_id).catch(error=>{if(error.status!==404)throw error});
  return task.google_event_id?{...task,google_event_id:null}:task;
 }
 if(task.google_event_id){
  try{await updateGoogleCalendarEvent(accessToken,task.google_event_id,task,subjectName);return task}
  catch(error){if(error.status!==404)throw error}
 }
 const event=await createGoogleCalendarEvent(accessToken,task,subjectName);
 return event?.id?{...task,google_event_id:event.id}:task;
}


const TIMETABLE_WEEKS=16;
function normalizeWeekday(value){const s=String(value||'').trim().toLowerCase();const map={sun:0,sunday:0,mon:1,monday:1,tue:2,tues:2,tuesday:2,wed:3,wednesday:3,thu:4,thur:4,thurs:4,thursday:4,fri:5,friday:5,sat:6,saturday:6};return Number.isInteger(map[s])?map[s]:null}
function parseTimeValue(value){const s=String(value||'').trim().toUpperCase().replace(/\./g,'');const m=s.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);if(!m)return null;let h=Number(m[1]),min=Number(m[2]||0),ap=m[3];if(min>59||h>23)return null;if(ap){if(h<1||h>12)return null;if(ap==='AM'&&h===12)h=0;if(ap==='PM'&&h!==12)h+=12}return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`}
function parseTimeRange(text){const s=String(text||'').replace(/[–—−]/g,'-').replace(/\bto\b/ig,'-');const m=s.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*-\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/i);if(!m)return null;let a=parseTimeValue(m[1]),b=parseTimeValue(m[2]);if(a&&b&&!/AM|PM/i.test(m[2])&&/AM|PM/i.test(m[1])){const suffix=/AM|PM/i.exec(m[1])?.[0];b=parseTimeValue(`${m[2]} ${suffix}`)}return a&&b?{start_time:a,end_time:b}:null}
function nextOccurrenceDate(startDate,weekday){const d=fromDateKey(startDate);const delta=(weekday-d.getDay()+7)%7;d.setDate(d.getDate()+delta);return localDateKey(d)}
function buildTimetableOccurrences(entry,startDate,endDate){const rangeStart=entry.start_date||startDate,rangeEnd=entry.end_date||endDate;const out=[];let d=fromDateKey(nextOccurrenceDate(rangeStart,entry.weekday));const last=fromDateKey(rangeEnd);let guard=0;while(d<=last&&guard<400){const date=localDateKey(d);let endDateKey=date;if(timeToMinutes(entry.end_time)<=timeToMinutes(entry.start_time))endDateKey=nextDateKey(date);out.push({date,endDate:endDateKey});d.setDate(d.getDate()+7);guard++}return out}
function parseTimetableCsv(text){const rows=[];const lines=String(text||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!lines.length)return rows;const split=(line)=>{const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){q=!q;continue}if(c===','&&!q){out.push(cur.trim());cur=''}else cur+=c}out.push(cur.trim());return out};const header=split(lines[0]).map(x=>x.toLowerCase().replace(/[^a-z]/g,''));const idx=(names)=>header.findIndex(h=>names.some(n=>h.includes(n)));const di=idx(['day','weekday']),si=idx(['starttime','start']),ei=idx(['endtime','end']),ci=idx(['class','subject','course','title','name']),ri=idx(['room','location']);for(const line of lines.slice(1)){const c=split(line),weekday=normalizeWeekday(c[di]);const range=si>=0&&ei>=0?{start_time:parseTimeValue(c[si]),end_time:parseTimeValue(c[ei])}:parseTimeRange(`${c[si]||''}-${c[ei]||''}`);const title=(ci>=0?c[ci]:'').trim();if(weekday==null||!range?.start_time||!range?.end_time||!title)continue;rows.push({weekday,start_time:range.start_time,end_time:range.end_time,title,room:ri>=0?c[ri]:'',source:'csv'})}return rows}
function cleanOcrCellText(text){
 return String(text||'').replace(/\s+/g,' ').replace(/[|]+/g,' ').replace(/\s+([),.\]])/g,'$1').replace(/([([\-])\s+/g,'$1').trim();
}
function parseRoomFromOcr(text){
 const s=cleanOcrCellText(text); const m=s.match(/\b(MSB\s*[- ]?\d{2,4}|Room\s*[- ]?\w+|Rm\.?\s*[- ]?\w+)\b/i); return m?m[1].replace(/\s+/g,' ').trim():'';
}
function likelyClassText(text){
 const s=cleanOcrCellText(text); if(s.length<4)return false;
 if(/^(remedial|class|lab|room|year|no)$/i.test(s))return false;
 if(/^(recess|r\s*e\s*c\s*e\s*s\s*s)$/i.test(s.replace(/\s+/g,'')))return false;
 return /(?:\b[A-Z]{2,6}[- ]?[A-Z]{0,4}\s*[- ]?\d{3}[A-Z]?\b|\b(?:BSC|MC-CS|HSMC|ESC|PROJ)\s+\d{3}\b|\b(?:Mathematics|Physics|Chemistry|English|Project|Computer)\b)/i.test(s) || s.length>=10;
}
function parseTimetableOcr(text){
 const rows=[]; const lines=String(text||'').split(/\r?\n/).map(x=>cleanOcrCellText(x)).filter(Boolean);
 const dayRe=/\b(Sun(?:day)?|Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?)\b/i;
 for(const line of lines){const dm=line.match(dayRe),range=parseTimeRange(line);if(!dm||!range)continue;let title=cleanOcrCellText(line.replace(dayRe,'').replace(/\d{1,2}(?::\d{2})?\s*(?:AM|PM)?\s*(?:-|–|—|to)\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM)?/i,''));if(!likelyClassText(title))continue;rows.push({weekday:normalizeWeekday(dm[1]),start_time:range.start_time,end_time:range.end_time,title,room:'',source:'ocr'})}
 return rows;
}
function detectDarkLines(gray,axis,threshold=120,minRatio=.78){
 const vals=axis==='x'?[...Array(gray.width).keys()].map(x=>{let n=0;for(let y=0;y<gray.height;y+=2){if(gray.data[y*gray.width+x]<threshold)n++}return n/(gray.height/2)}):[...Array(gray.height).keys()].map(y=>{let n=0;for(let x=0;x<gray.width;x+=2){if(gray.data[y*gray.width+x]<threshold)n++}return n/(gray.width/2)});
 const raw=[]; vals.forEach((v,i)=>{if(v>=minRatio)raw.push(i)}); const out=[]; for(const i of raw){if(!out.length||i-out[out.length-1]>2)out.push(i)} return out;
}
async function recognizeTimetableImage(file,T){
 const bitmap=await createImageBitmap(file); const scale=Math.min(2.4,2400/bitmap.width); const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=true;ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);if(bitmap.close)bitmap.close();
 const src=ctx.getImageData(0,0,canvas.width,canvas.height); const gray=new Uint8ClampedArray(canvas.width*canvas.height); for(let i=0,j=0;i<src.data.length;i+=4,j++)gray[j]=Math.round(.299*src.data[i]+.587*src.data[i+1]+.114*src.data[i+2]);
 const imageData={width:canvas.width,height:canvas.height,data:gray};
 const allY=detectDarkLines(imageData,'y',145,.72).filter(y=>y>4&&y<canvas.height-4);
 const allX=detectDarkLines(imageData,'x',145,.72).filter(x=>x>4&&x<canvas.width-4);
 const worker=await T.createWorker('eng');
 const ocrCanvas=async(x0,y0,x1,y1)=>{const w=Math.max(1,Math.round(x1-x0)),h=Math.max(1,Math.round(y1-y0));const c=document.createElement('canvas');c.width=Math.round(w*1.6);c.height=Math.round(h*1.6);const cc=c.getContext('2d',{willReadFrequently:true});cc.fillStyle='#fff';cc.fillRect(0,0,c.width,c.height);cc.drawImage(canvas,x0,y0,w,h,0,0,c.width,c.height);const r=await worker.recognize(c);return {text:cleanOcrCellText(r?.data?.text||''),confidence:Number(r?.data?.confidence||0)}};
 try{
  // Header time labels. The two-page college routine layout uses a narrow recess column between 1:50 and 2:20.
  const headerBand=allY.filter(y=>y>canvas.height*.02&&y<canvas.height*.20); const hTop=headerBand[0]||Math.round(canvas.height*.14),hBottom=headerBand[1]||Math.round(canvas.height*.20);
  const headerWords=(await ocrCanvas(0,hTop+2,canvas.width,hBottom-2)).text.split(' ');
  // Prefer fixed column boundaries detected in the header; fall back to known relative positions from OCR time labels.
  const headerXs=allX.filter(x=>x>canvas.width*.16&&x<canvas.width*.98); const baseBounds=[];
  for(let i=0;i<headerXs.length-1;i++){const a=headerXs[i],b=headerXs[i+1];if(b-a>45)baseBounds.push({left:a,right:b})}
  // If line detection is sparse, reconstruct the time columns from the actual image's common 9-column geometry.
  let columns=baseBounds.filter(b=>b.right-b.left>45&&b.right-b.left<canvas.width*.25);
  if(columns.length<6){
   const left=Math.round(canvas.width*.177), right=Math.round(canvas.width*.934), widths=[.15,.15,.15,.15,.10,.19,.17,.17,.19];let x=left;columns=[];for(const f of widths){const nx=x+(right-left)*f;columns.push({left:x,right:nx});x=nx}
  }
  // Normalize to the actual time slots; remove the year/day area and the recess column.
  const timeSlots=[
   {start:'10:30',end:'11:20'},{start:'11:20',end:'12:10'},{start:'12:10',end:'13:00'},{start:'13:00',end:'13:50'},
   {start:'14:20',end:'15:10'},{start:'15:10',end:'16:00'},{start:'16:00',end:'16:50'},{start:'16:50',end:'17:40'}
  ];
  // Build slot boundaries from the image header's vertical rules by detecting x-lines in the header area.
  const headerX=[]; for(const x of allX){let dark=0;for(let y=hTop;y<hBottom;y++)if(gray[y*canvas.width+x]<145)dark++;if(dark>=(hBottom-hTop)*.55)headerX.push(x)}
  const compact=[];for(const x of headerX){if(!compact.length||x-compact[compact.length-1]>2)compact.push(x)}
  let slotBounds=compact.filter(x=>x>canvas.width*.16&&x<canvas.width*.97);
  if(slotBounds.length<9){slotBounds=[];const ratios=[.177,.252,.327,.411,.496,.551,.598,.652,.745,.837,.934];for(const r of ratios)slotBounds.push(Math.round(canvas.width*r))}
  // Find the recess boundaries and convert the remaining intervals into the eight actual time slots.
  const intervals=[];for(let i=0;i<slotBounds.length-1;i++){const l=slotBounds[i],r=slotBounds[i+1];if(r-l>35)intervals.push({left:l,right:r})}
  const actualIntervals=intervals.length>=8?intervals.slice(0,4).concat(intervals.slice(Math.max(5,intervals.length-4))):[];
  const slotRects=actualIntervals.length===8?actualIntervals:timeSlots.map((t,i)=>({left:canvas.width*(.177+i*.095),right:canvas.width*(.177+(i+1)*.095)}));

  // Horizontal row bands: every day in these routine sheets contains three year rows. Day labels are used to map groups of three bands.
  const yBounds=allY.filter(y=>y>canvas.height*.18&&y<canvas.height*.98); const bands=[];for(let i=0;i<yBounds.length-1;i++){const top=yBounds[i]+3,bottom=yBounds[i+1]-3;if(bottom-top>=28&&bottom-top<130)bands.push({top,bottom})}
  const dayWords=await ocrCanvas(0,Math.max(0,Math.min(...yBounds,canvas.height*.2)),Math.min(canvas.width*.16,260),canvas.height*.98);
  const dayMatches=[]; const dayRegex=/(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sun|Mon|Tue|Wed|Thu|Fri|Sat)/ig;let dm;while((dm=dayRegex.exec(dayWords.text||'')))dayMatches.push(normalizeWeekday(dm[1]));
  const days=dayMatches.length>=1?dayMatches.slice(0,Math.ceil(bands.length/3)):[1,2,3,4,5,6].slice(0,Math.ceil(bands.length/3));
  const rows=[];
  for(let bi=0;bi<bands.length;bi++){
   const day=days[Math.min(days.length-1,Math.floor(bi/3))]; if(day==null)continue; const band=bands[bi];
   // Detect vertical rules specifically inside this row so merged cells remain merged. Each resulting cell is OCR'd independently.
   const rowX=[];for(let x=0;x<canvas.width;x++){let dark=0;for(let y=band.top;y<band.bottom;y++)if(gray[y*canvas.width+x]<145)dark++;if(dark>=(band.bottom-band.top)*.62)rowX.push(x)}
   const rb=[];for(const x of rowX){if(!rb.length||x-rb[rb.length-1]>2)rb.push(x)}
   const cellBounds=rb.filter(x=>x>canvas.width*.16&&x<canvas.width*.98);const cells=[];for(let i=0;i<cellBounds.length-1;i++){const l=cellBounds[i],r=cellBounds[i+1];if(r-l>30)cells.push({left:l,right:r})}
   for(const cell of cells){
    if(cell.left<canvas.width*.17)continue;
    // Skip the recess column by its horizontal location.
    const cx=(cell.left+cell.right)/2; if(cx>canvas.width*.49&&cx<canvas.width*.56)continue;
    const ocr=await ocrCanvas(cell.left+4,band.top+4,cell.right-4,band.bottom-4); let title=ocr.text;
    if(!likelyClassText(title)||ocr.confidence<25)continue;
    title=title.replace(/\b(?:2d|3d|4th|2nd|3rd|year)\b/ig,'').trim();
    // Determine which actual time columns this merged cell covers by overlap with slot rectangles.
    const overlap=slotRects.map((r,i)=>({i,ov:Math.max(0,Math.min(cell.right,r.right)-Math.max(cell.left,r.left))})).filter(x=>x.ov>10).map(x=>x.i); if(!overlap.length)continue;
    const first=Math.min(...overlap),last=Math.max(...overlap); const st=timeSlots[first],en=timeSlots[last]; if(!st||!en)continue;
    rows.push({weekday:day,start_time:parseTimeValue(st.start),end_time:parseTimeValue(en.end),title,room:parseRoomFromOcr(await ocrCanvas(Math.max(0,cell.left-130),band.top+2,Math.max(0,cell.left-4),band.bottom-2).then(x=>x.text)),source:'ocr',confidence:'geometry'});
   }
  }
  const unique=[];const seen=new Set();for(const r of rows){const k=`${r.weekday}|${r.start_time}|${r.end_time}|${r.title.toLowerCase()}`;if(!seen.has(k)){seen.add(k);unique.push(r)}}
  return {rows:unique,text:headerWords.concat(dayWords.text||'').join(' '),confidence:unique.length?'high':'low'};
 }finally{await worker.terminate()}
}
function loadPdfJs(){return new Promise((resolve,reject)=>{if(window.pdfjsLib){resolve(window.pdfjsLib);return}const existing=document.querySelector('script[data-orbit-pdfjs]');if(existing){existing.addEventListener('load',()=>resolve(window.pdfjsLib));existing.addEventListener('error',()=>reject(new Error('Could not load the PDF reader.')));return}const script=document.createElement('script');script.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';script.async=true;script.dataset.orbitPdfjs='1';script.onload=()=>{if(window.pdfjsLib)window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';resolve(window.pdfjsLib)};script.onerror=()=>reject(new Error('Could not load the PDF reader. Check your internet connection and try again.'));document.head.appendChild(script)})}
async function ocrPdfFile(file,T){
 const pdfjs=await loadPdfJs();const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;let combined='';let rows=[];const limit=Math.min(pdf.numPages,12);
 for(let n=1;n<=limit;n++){const page=await pdf.getPage(n);const viewport=page.getViewport({scale:2.1});const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);const ctx=canvas.getContext('2d',{willReadFrequently:true});await page.render({canvasContext:ctx,viewport}).promise;const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(blob){const result=await recognizeTimetableImage(blob,T);rows.push(...(result.rows||[]));combined+=`${result.text||''}\n`;}canvas.width=1;canvas.height=1}
 const unique=[];const seen=new Set();for(const r of rows){const k=`${r.weekday}|${r.start_time}|${r.end_time}|${r.title.toLowerCase()}`;if(!seen.has(k)){seen.add(k);unique.push(r)}}return {text:combined,rows:unique,pages:pdf.numPages,processed:limit}
}
function loadTesseract(){return new Promise((resolve,reject)=>{if(window.Tesseract){resolve(window.Tesseract);return}const existing=document.querySelector('script[data-orbit-tesseract]');if(existing){existing.addEventListener('load',()=>resolve(window.Tesseract));existing.addEventListener('error',()=>reject(new Error('Could not load OCR engine.')));return}const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';script.async=true;script.dataset.orbitTesseract='1';script.onload=()=>resolve(window.Tesseract);script.onerror=()=>reject(new Error('Could not load OCR engine. Check your internet connection and try again.'));document.head.appendChild(script)})}
function timetableTaskRow(entry,occurrence,userId){const start=occurrence.date,end=occurrence.endDate||occurrence.date;return {user_id:userId||undefined,title:entry.title,notes:entry.room?`Classroom: ${entry.room}`:'',subject_id:null,due_date:end,start_date:start,end_date:end,start_time:entry.start_time,end_time:entry.end_time,estimated_minutes:durationMinutes(start,entry.start_time,end,entry.end_time),priority:'Medium',status:'Todo',tags:['class'],timetable_source:true,timetable_weekday:entry.weekday,timetable_room:entry.room||null,timetable_cancelled:false,timetable_key:`${entry.weekday}|${entry.start_date||''}|${entry.end_date||''}|${entry.start_time}|${entry.end_time}|${entry.title}`};}
function App(){
 const [user,setUser]=useState(null);
 const [theme,setTheme]=useState(()=>localStorage.getItem('orbit_theme')||'dark'); const [density,setDensity]=useState(()=>localStorage.getItem('orbit_density')||'Comfortable'); const [subjects,setSubjects]=useState([]); const [tasks,setTasks]=useState([]); const [sessions,setSessions]=useState([]); const [tab,setTab]=useState('Dashboard'); const [search,setSearch]=useState(''); const [filter,setFilter]=useState('All'); const [modal,setModal]=useState(null); const [mobile,setMobile]=useState(false); const [timer,setTimer]=useState(()=>Number(localStorage.getItem('orbit_default_focus')||25)*60); const [running,setRunning]=useState(false); const [focusStartedAt,setFocusStartedAt]=useState(null); const [focusInitialSeconds,setFocusInitialSeconds]=useState(0); const [pendingFocusReset,setPendingFocusReset]=useState(null); const [focusMode,setFocusMode]=useState('pomodoro'); const [pomodoros,setPomodoros]=useState(1); const [customMinutes,setCustomMinutes]=useState(30); const [profileOpen,setProfileOpen]=useState(false); const [searchOpen,setSearchOpen]=useState(false); const [sidebarCollapsed,setSidebarCollapsed]=useState(()=>localStorage.getItem('orbit_sidebar_collapsed')==='1'); const [selectedSubject,setSelectedSubject]=useState(null); const [settingsPanel,setSettingsPanel]=useState(null); const [sessionModal,setSessionModal]=useState(false); const [subjectEdit,setSubjectEdit]=useState(null); const [authModal,setAuthModal]=useState(false); const [googleProviderToken,setGoogleProviderToken]=useState(null); const [timetableModal,setTimetableModal]=useState(false); const [timetableSeriesEdit,setTimetableSeriesEdit]=useState(null); const [sessionHistoryDate,setSessionHistoryDate]=useState(null); const [momentumModal,setMomentumModal]=useState(false); const [streakRequirement,setStreakRequirement]=useState(()=>Number(localStorage.getItem('orbit_streak_requirement')||180)); const [quoteIndex,setQuoteIndex]=useState(()=>Math.floor(Math.random()*ORBIT_QUOTES.length)); const [quoteChanging,setQuoteChanging]=useState(false);
 useEffect(()=>{
  const root=document.documentElement;
  const apply=()=>{
   const resolved=theme==='system'?(window.matchMedia?.('(prefers-color-scheme: light)').matches?'light':'dark'):theme;
   root.dataset.theme=resolved;
   root.dataset.themePreference=theme;
  };
  apply();
  const media=window.matchMedia?.('(prefers-color-scheme: light)');
  const onChange=()=>theme==='system'&&apply();
  media?.addEventListener?.('change',onChange);
  localStorage.setItem('orbit_theme',theme);
  return()=>media?.removeEventListener?.('change',onChange);
 },[theme]);
 useEffect(()=>{ if(cloudReady){
  supabase.auth.getSession().then(({data})=>{const session=data.session||null;const nextUser=session?.user||null;const token=session?.provider_token||sessionStorage.getItem('orbit_google_provider_token')||null;setUser(nextUser);setGoogleProviderToken(token);if(nextUser){setAuthModal(false);setSettingsPanel(null)}});
  const {data:sub}=supabase.auth.onAuthStateChange((_e,s)=>{const nextUser=s?.user||null;const token=s?.provider_token||null;setUser(nextUser);setGoogleProviderToken(token);if(token)sessionStorage.setItem('orbit_google_provider_token',token);if(_e==='SIGNED_OUT')sessionStorage.removeItem('orbit_google_provider_token');if(nextUser){setAuthModal(false);setSettingsPanel(null)}});
  return()=>sub.subscription.unsubscribe()
 } else {setSubjects(JSON.parse(localStorage.getItem('orbit_subjects')||'null')||seedSubjects);setTasks(JSON.parse(localStorage.getItem('orbit_tasks')||'null')||seedTasks);setSessions(JSON.parse(localStorage.getItem('orbit_sessions')||'[]'))}},[]);
 useEffect(()=>{if(!cloudReady){localStorage.setItem('orbit_subjects',JSON.stringify(subjects));localStorage.setItem('orbit_tasks',JSON.stringify(tasks));localStorage.setItem('orbit_sessions',JSON.stringify(sessions))}},[subjects,tasks,sessions]);
 const completionArmed=useRef(false);
 useEffect(()=>{
  if(running)completionArmed.current=true;
  if(!running&&timer===0&&completionArmed.current){
   completionArmed.current=false;
   if(localStorage.getItem('orbit_focus_sound')!=='off')playCompletionSound();
  }
 },[running,timer]);
 useEffect(()=>{
  if(!running)return;
  const i=setInterval(()=>setTimer(t=>Math.max(0,t-1)),1000);
  return()=>clearInterval(i);
 },[running]);
 useEffect(()=>{
  if(typeof document==='undefined')return;
  const closeHeaderPopups=e=>{
   const target=e.target;
   if(!target?.closest?.('.profile'))setProfileOpen(false);
   if(!target?.closest?.('.search'))setSearchOpen(false);
  };
  document.addEventListener('mousedown',closeHeaderPopups);
  return()=>document.removeEventListener('mousedown',closeHeaderPopups);
 },[]);
 useEffect(()=>{if(user)loadCloud()},[user]);
 useEffect(()=>{if(user&&googleProviderToken&&tasks.length)syncExistingTasksToCalendar()},[googleProviderToken]);
 useEffect(()=>{ if(selectedSubject && !subjects.some(s=>s.id===selectedSubject)) setSelectedSubject(null)},[subjects,selectedSubject]);
 async function loadCloud(){const [{data:s},{data:t},{data:ss}]=await Promise.all([supabase.from('subjects').select('*').order('created_at'),supabase.from('tasks').select('*').order('created_at',{ascending:false}),supabase.from('study_sessions').select('*').order('session_date',{ascending:false})]);setSubjects(s||[]);setTasks(t||[]);setSessions(ss||[])}
 async function syncExistingTasksToCalendar(){
  if(!googleProviderToken||!user||!tasks.length)return;
  const map=Object.fromEntries(subjects.map(s=>[s.id,s]));
  const candidates=tasks.filter(task=>task.due_date&&!task.timetable_cancelled);
  const results=[];
  for(let i=0;i<candidates.length;i+=6){
   const batch=candidates.slice(i,i+6);
   const syncedBatch=await Promise.all(batch.map(async task=>{
    try{
     const synced=await syncTaskToGoogleCalendar(googleProviderToken,task,map[task.subject_id]?.name);
     if(synced.google_event_id!==task.google_event_id){
      const {data,error}=await supabase.from('tasks').update({google_event_id:synced.google_event_id||null}).eq('id',task.id).select().single();
      return !error&&data?data:synced;
     }
     return task;
    }catch(error){
     if(error.status===401||error.status===403)console.warn('Google Calendar access issue:',error.message);
     else console.warn('Google Calendar sync failed:',error);
     return task;
    }
   }));
   results.push(...syncedBatch);
  }
  if(results.length){const mapById=new Map(results.map(x=>[x.id,x]));setTasks(x=>x.map(task=>mapById.get(task.id)||task));}
 }
 async function login(){setSettingsPanel(null);setAuthModal(true)}
 async function loginGoogle(){if(!cloudReady){alert('Cloud sign-in needs Supabase setup. Add your Supabase URL and publishable key first.');return}const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin,scopes:GOOGLE_CALENDAR_SCOPE,queryParams:{access_type:'offline',prompt:'consent'}}});if(error)alert(`Google sign-in failed. ${error.message}`);else setAuthModal(false)}
 async function logout(){if(supabase)await supabase.auth.signOut();setUser(null);setProfileOpen(false);setSettingsPanel(null)}
 async function saveSubject(v){const row={...v,user_id:user?.id,notes:v.notes||''};if(cloudReady&&user){const {data}=await supabase.from('subjects').insert(row).select().single();if(data)setSubjects(x=>[...x,data])}else setSubjects(x=>[...x,{...v,id:uid()}]);setModal(null)}
 async function updateSubject(subject,v){const changes={name:v.name.trim(),code:v.code.trim(),category:v.category,color:v.color,target_hours:Number(v.target_hours)||0,notes:v.notes||''};if(cloudReady&&user){const {data,error}=await supabase.from('subjects').update(changes).eq('id',subject.id).select().single();if(error){alert(`Could not update subject. ${error.message}`);return false}setSubjects(x=>x.map(s=>s.id===subject.id?{...s,...data}:s))}else setSubjects(x=>x.map(s=>s.id===subject.id?{...s,...changes}:s));setSubjectEdit(null);return true}
 async function saveTask(v){
  const isEdit=Boolean(v.id);
  const title=(v.title||'').trim();
  const startDate=v.start_date||v.due_date||null;
  const endDate=v.end_date||v.due_date||startDate;
  const autoMinutes=durationMinutes(startDate,v.start_time,endDate,v.end_time);
  if(v.start_time&&v.end_time&&(!startDate||!endDate||!autoMinutes)){alert('End date/time must be after the start date/time.');return}
  const normalized={
    ...v,title,subject_id:v.subject_id||null,due_date:endDate||null,start_date:startDate||null,end_date:endDate||null,start_time:v.start_time||null,end_time:v.end_time||null,
    priority:v.priority||'Medium',status:v.status||'Todo',estimated_minutes:autoMinutes??(v.estimated_minutes===''||v.estimated_minutes==null?null:Number(v.estimated_minutes)||null),
    notes:v.notes||'',tags:Array.isArray(v.tags)?v.tags:[]
  };
  const row={user_id:user?.id,title:normalized.title||null,priority:normalized.priority,status:normalized.status,notes:normalized.notes,tags:normalized.tags,subject_id:normalized.subject_id,due_date:normalized.due_date,start_date:normalized.start_date,end_date:normalized.end_date,start_time:normalized.start_time,end_time:normalized.end_time,estimated_minutes:normalized.estimated_minutes};
  if(isEdit)delete row.user_id;
  if(cloudReady&&user){
    const result=isEdit?await supabase.from('tasks').update(row).eq('id',v.id).select().single():await supabase.from('tasks').insert(row).select().single();
    if(result.error){alert(`${isEdit?'Could not update task':'Could not create task'}. ${result.error.message}`);return}
    let synced=result.data;
    if(googleProviderToken){
      try{
        synced=await syncTaskToGoogleCalendar(googleProviderToken,synced,subjectMap[synced.subject_id]?.name);
        if(synced.google_event_id!==(result.data.google_event_id||null)){
          const eventUpdate=await supabase.from('tasks').update({google_event_id:synced.google_event_id||null}).eq('id',synced.id).select().single();
          if(!eventUpdate.error&&eventUpdate.data)synced=eventUpdate.data;
        }
      }catch(calendarError){
        if(calendarError.status===401)alert('Task saved, but Google Calendar access has expired. Sign out and sign in with Google again to reconnect Calendar.');
        else if(calendarError.status===403)alert('Task saved, but Google Calendar denied access. Make sure Google Calendar API is enabled and Calendar permission was accepted, then sign out and sign in again.');
        else alert(`Task saved, but Google Calendar sync failed. ${calendarError.message||'Check the browser console for details.'}`)
      }
    }else if(synced.due_date){
      alert('Task saved, but Google Calendar is not connected. Sign out and sign in with Google again to connect Calendar.');
    }
    setTasks(x=>isEdit?x.map(t=>t.id===v.id?synced:t):[synced,...x]);
  }else if(isEdit)setTasks(x=>x.map(t=>t.id===v.id?{...t,...normalized}:t));
  else setTasks(x=>[{...normalized,id:uid()},...x]);
  setModal(null)
 }
 async function toggleTask(t){
  const status=t.status==='Done'?'Todo':'Done';
  const completed_at=status==='Done'?new Date().toISOString():null;
  if(cloudReady&&user){
    const {data,error}=await supabase.from('tasks').update({status,completed_at}).eq('id',t.id).select().single();
    if(error){alert(`Could not update task. ${error.message}`);return}
    let synced=data||{...t,status,completed_at};
    if(googleProviderToken){
      try{
        synced=await syncTaskToGoogleCalendar(googleProviderToken,synced,subjectMap[synced.subject_id]?.name);
        if(synced.google_event_id!==(data?.google_event_id||null)){
          const eventUpdate=await supabase.from('tasks').update({google_event_id:synced.google_event_id||null}).eq('id',t.id).select().single();
          if(!eventUpdate.error&&eventUpdate.data)synced=eventUpdate.data;
        }
      }catch(e){
        if(e.status===401)alert('Task updated, but Google Calendar access has expired. Sign out and sign in with Google again to reconnect Calendar.');
        else console.warn('Google Calendar sync failed:',e);
      }
    }
    setTasks(x=>x.map(a=>a.id===t.id?synced:a));
    return;
  }
  setTasks(x=>x.map(a=>a.id===t.id?{...a,status,completed_at}:a));
 }
 async function changeTaskStatus(t,status){
  if(!status||status===t.status)return;
  const completed_at=status==='Done'?(t.completed_at||new Date().toISOString()):null;
  if(cloudReady&&user){
    const {data,error}=await supabase.from('tasks').update({status,completed_at}).eq('id',t.id).select().single();
    if(error){alert(`Could not update task status. ${error.message}`);return}
    let synced=data||{...t,status,completed_at};
    if(googleProviderToken){
      try{
        synced=await syncTaskToGoogleCalendar(googleProviderToken,synced,subjectMap[synced.subject_id]?.name);
        if(synced.google_event_id!==(data?.google_event_id||null)){
          const eventUpdate=await supabase.from('tasks').update({google_event_id:synced.google_event_id||null}).eq('id',t.id).select().single();
          if(!eventUpdate.error&&eventUpdate.data)synced=eventUpdate.data;
        }
      }catch(e){if(e.status===401)alert('Task status updated, but Google Calendar access has expired. Sign out and sign in with Google again to reconnect Calendar.');else console.warn('Google Calendar sync failed:',e)}
    }
    setTasks(x=>x.map(a=>a.id===t.id?synced:a));
    setFilter(status);
    return;
  }
  setTasks(x=>x.map(a=>a.id===t.id?{...a,status,completed_at}:a));
  setFilter(status);
 }
 async function updateTask(t,changes){
  const next={...t,...changes,due_date:('due_date' in changes?(changes.due_date||null):t.due_date),start_date:('start_date' in changes?(changes.start_date||null):t.start_date||t.due_date),end_date:('end_date' in changes?(changes.end_date||null):t.end_date||t.due_date),subject_id:('subject_id' in changes?(changes.subject_id||null):t.subject_id),start_time:('start_time' in changes?(changes.start_time||null):t.start_time),end_time:('end_time' in changes?(changes.end_time||null):t.end_time)};
  if('start_date' in changes&&!('end_date' in changes))next.end_date=next.end_date||next.start_date;
  if('end_date' in changes&&!('start_date' in changes))next.start_date=next.start_date||next.end_date;
  next.due_date=next.end_date||next.due_date||null;
  const autoMinutes=durationMinutes(next.start_date,next.start_time,next.end_date,next.end_time);
  if(next.start_time&&next.end_time&&(!next.start_date||!next.end_date||!autoMinutes)){alert('End date/time must be after the start date/time.');return}
  if(autoMinutes!=null)next.estimated_minutes=autoMinutes;
  if(cloudReady&&user){
    const payload={};
    for(const key of ['subject_id','due_date','start_date','end_date','priority','estimated_minutes','start_time','end_time']) if(key in changes||key==='start_time'||key==='end_time'&&('start_time' in changes||'end_time' in changes)) payload[key]=next[key]===''||next[key]===undefined?null:next[key];
    const {data,error}=await supabase.from('tasks').update(payload).eq('id',t.id).select().single();
    if(error){alert(`Could not update task. ${error.message}`);return}
    let synced=data||next;
    if(googleProviderToken){
      try{
        synced=await syncTaskToGoogleCalendar(googleProviderToken,synced,subjectMap[synced.subject_id]?.name);
        if(synced.google_event_id!==(data?.google_event_id||null)){
          const eventUpdate=await supabase.from('tasks').update({google_event_id:synced.google_event_id||null}).eq('id',t.id).select().single();
          if(!eventUpdate.error&&eventUpdate.data)synced=eventUpdate.data;
        }
      }catch(e){if(e.status===401)alert('Task updated, but Google Calendar access has expired. Sign out and sign in with Google again to reconnect Calendar.');else console.warn('Google Calendar sync failed:',e)}
    }
    setTasks(x=>x.map(a=>a.id===t.id?synced:a));return
  }
  setTasks(x=>x.map(a=>a.id===t.id?next:a))
 }
 async function deleteTask(t){
  if(!window.confirm(`Delete “${t.title||'Untitled task'}”? This cannot be undone.`)) return;
  if(cloudReady&&user){
    if(t.google_event_id&&!googleProviderToken){
      alert('Sign out and sign in with Google again to reconnect Calendar before deleting this task.');
      return;
    }
    try{if(googleProviderToken)await deleteCalendarEventForTask(googleProviderToken,t)}catch(e){
      if(e.status===401)alert('Google Calendar access has expired. Sign out and sign in with Google again, then delete the task.');
      else alert(`Could not remove the task from Google Calendar. ${e.message||'Please try again.'}`);
      return;
    }
    const {error}=await supabase.from('tasks').delete().eq('id',t.id);
    if(error){alert(`Could not delete task. ${error.message}`);return}
  }
  setTasks(x=>x.filter(a=>a.id!==t.id));
 }
 async function deleteTimetableGroup(task){
  const seriesKey=String(task?.timetable_key||'').trim();
  const title=String(task?.title||'').trim()||'Class';
  const group=seriesKey
    ? tasks.filter(x=>x.timetable_source&&String(x.timetable_key||'').trim()===seriesKey)
    : tasks.filter(x=>x.timetable_source&&String(x.title||'').trim().toLowerCase()===title.toLowerCase());
  if(!group.length)return;
  if(!window.confirm(`Delete all ${group.length} scheduled “${title}” classes? This removes every timetable occurrence for this class and linked Google Calendar events.`))return;
  if(cloudReady&&user){
   if(!googleProviderToken){alert('Sign out and sign in with Google again to reconnect Calendar before deleting this class series.');return}
   try{
    await Promise.all(group.map(item=>deleteCalendarEventForTask(googleProviderToken,item)));
   }catch(e){
    if(e.status===401)alert('Google Calendar access has expired. Sign out and sign in with Google again, then delete the class series.');
    else alert(`Could not remove “${title}” from Google Calendar. ${e.message||''}`);
    return;
   }
   const {error}=await supabase.from('tasks').delete().in('id',group.map(x=>x.id));
   if(error){alert(`Could not delete the class series. ${error.message}`);return}
  }
  const ids=new Set(group.map(x=>x.id));
  setTasks(x=>x.filter(item=>!ids.has(item.id)));
 }
 async function deleteSubject(subject){
  if(!subject) return;
  const count=tasks.filter(t=>t.subject_id===subject.id).length;
  const message=count?`Delete “${subject.name}” and its ${count} task${count===1?'':'s'}? This cannot be undone.`:`Delete “${subject.name}”? This cannot be undone.`;
  if(!window.confirm(message)) return;
  if(cloudReady&&user){
   const subjectTasks=tasks.filter(t=>t.subject_id===subject.id);
   for(const task of subjectTasks){
    if(!task.google_event_id)continue;
    if(!googleProviderToken){alert('One or more tasks are linked to Google Calendar, but Calendar access is not connected. Sign out and sign in with Google again, then delete the subject.');return}
    try{await deleteGoogleCalendarEvent(googleProviderToken,task.google_event_id)}catch(e){if(e.status!==404){alert(`Could not remove a task from Google Calendar. ${e.message||'Please try again.'}`);return}}
   }
   const taskDelete=await supabase.from('tasks').delete().eq('subject_id',subject.id);
   if(taskDelete.error){alert(`Could not delete the subject tasks. ${taskDelete.error.message}`);return}
   const sessionDelete=await supabase.from('study_sessions').delete().eq('subject_id',subject.id);
   if(sessionDelete.error){alert(`Could not delete the subject sessions. ${sessionDelete.error.message}`);return}
   const subjectDelete=await supabase.from('subjects').delete().eq('id',subject.id);
   if(subjectDelete.error){alert(`Could not delete subject. ${subjectDelete.error.message}`);return}
  }
  setTasks(x=>x.filter(t=>t.subject_id!==subject.id));
  setSessions(x=>x.filter(session=>session.subject_id!==subject.id));
  setSubjects(x=>x.filter(s=>s.id!==subject.id));
  setSelectedSubject(null);
 }
 async function saveTimetableSeries(task,changes){
  if(!task?.timetable_source||!task.timetable_key){alert('This class is missing its recurring schedule information.');return}
  const effective=changes.effective_date||localDateKey(new Date());
  const nextStart=changes.start_time||task.start_time||null;
  const nextEnd=changes.end_time||task.end_time||null;
  if(!nextStart||!nextEnd){alert('Please select both a start and end time.');return}
  const series=tasks.filter(t=>t.timetable_source&&t.timetable_key===task.timetable_key&&t.due_date>=effective).sort((a,b)=>(a.due_date||'').localeCompare(b.due_date||''));
  if(!series.length){alert('There are no future occurrences to update from that date.');return}
  const payload={title:String(changes.title||task.title||'').trim(),start_time:nextStart,end_time:nextEnd,timetable_room:changes.room||null};
  if(!payload.title){alert('Class name is required.');return}
  const durationFor=item=>{const sd=item.start_date||item.due_date;let ed=item.end_date||item.due_date;if(timeToMinutes(nextEnd)<=timeToMinutes(nextStart)&&ed===sd)ed=nextDateKey(ed);return durationMinutes(sd,nextStart,ed,nextEnd)};
  if(cloudReady&&user){
   const updated=[];
   for(const item of series){
    const row={title:payload.title||null,start_time:payload.start_time,end_time:payload.end_time,estimated_minutes:durationFor(item),notes:payload.timetable_room?`Classroom: ${payload.timetable_room}`:'',timetable_room:payload.timetable_room};
    const {data,error}=await supabase.from('tasks').update(row).eq('id',item.id).select().single();
    if(error){alert(`Could not update the class series. ${error.message}`);return}
    let synced=data;
    if(googleProviderToken&&!item.timetable_cancelled){
     try{synced=await syncTaskToGoogleCalendar(googleProviderToken,data,subjectMap[data.subject_id]?.name);if(synced.google_event_id!==(data.google_event_id||null)){const eu=await supabase.from('tasks').update({google_event_id:synced.google_event_id||null}).eq('id',data.id).select().single();if(!eu.error&&eu.data)synced=eu.data}}
     catch(e){if(e.status===401)alert('The class was updated, but Google Calendar access expired. Sign out and sign in again to reconnect Calendar.');else console.warn('Calendar series update failed:',e)}
    }
    updated.push(synced);
   }
   setTasks(x=>x.map(t=>updated.find(u=>u.id===t.id)||t));
  }else{
   setTasks(x=>x.map(t=>series.some(u=>u.id===t.id)?{...t,...payload,notes:payload.timetable_room?`Classroom: ${payload.timetable_room}`:'',estimated_minutes:durationFor(t)}:t));
  }
  setTimetableSeriesEdit(null);
 }
 async function importTimetable(entries,startDate,endDate){
  const clean=entries.filter(e=>Number.isInteger(e.weekday)&&e.start_time&&e.end_time&&String(e.title||'').trim());
  if(!clean.length){alert('No valid classes were detected. Add or correct the rows and try again.');return}
  const rows=clean.flatMap(entry=>buildTimetableOccurrences(entry,startDate,endDate).map(occ=>timetableTaskRow(entry,occ,user?.id)));
  if(!rows.length){alert('No class dates fall inside the selected term range.');return}
  if(cloudReady&&user){
   const {data,error}=await supabase.from('tasks').insert(rows.map(({user_id,...r})=>({...r,user_id:user.id}))).select();
   if(error){alert(`Could not import timetable. ${error.message}`);return}
   const imported=data||[];
   setTasks(x=>[...imported,...x]);
   setTimetableModal(false);setTab('Timetable');
   if(googleProviderToken&&imported.length){
    // Sync Calendar in small parallel batches so importing a timetable never freezes the UI.
    const map=Object.fromEntries(subjects.map(s=>[s.id,s]));
    (async()=>{
     for(let i=0;i<imported.length;i+=6){
      const batch=imported.slice(i,i+6);
      const synced=await Promise.all(batch.map(async task=>{
       try{
        const next=await syncTaskToGoogleCalendar(googleProviderToken,task,map[task.subject_id]?.name);
        if(next.google_event_id){
         const updated=await supabase.from('tasks').update({google_event_id:next.google_event_id}).eq('id',task.id).select().single();
         return updated.error?next:updated.data;
        }
        return next;
       }catch(e){console.warn('Calendar timetable sync failed:',e);return task}
      }));
      const byId=new Map(synced.map(x=>[x.id,x]));
      setTasks(x=>x.map(t=>byId.get(t.id)||t));
     }
    })();
   }
  }else{
   const localRows=rows.map(r=>({...r,id:uid()}));
   setTasks(x=>[...localRows,...x]);
   setTimetableModal(false);setTab('Timetable');
  }
 }
 async function cancelClass(task){
  if(!task?.timetable_source)return;
  const action=task.timetable_cancelled?'restore':'cancel';
  if(!window.confirm(task.timetable_cancelled?`Restore “${task.title||'Class'}” for this occurrence?`:`Cancel “${task.title||'Class'}” for ${task.due_date||'this occurrence'}?`))return;
  if(cloudReady&&user){
   if(action==='cancel'&&googleProviderToken){try{await deleteCalendarEventForTask(googleProviderToken,task)}catch(e){if(e.status!==404){alert(`Could not remove this class from Google Calendar. ${e.message||''}`);return}}}
   if(action==='cancel'&&!googleProviderToken&&task.google_event_id){alert('This class is linked to Google Calendar. Sign out and sign in again to reconnect Calendar before cancelling it.');return}
   const {data,error}=await supabase.from('tasks').update({timetable_cancelled:!task.timetable_cancelled,google_event_id:action==='cancel'?null:task.google_event_id}).eq('id',task.id).select().single();
   if(error){alert(`Could not update class. ${error.message}`);return}
   let next=data;
   if(action==='restore'&&googleProviderToken){try{next=await syncTaskToGoogleCalendar(googleProviderToken,next,subjectMap[next.subject_id]?.name);if(next.google_event_id)data.google_event_id=next.google_event_id;await supabase.from('tasks').update({google_event_id:next.google_event_id||null}).eq('id',task.id)}catch(e){if(e.status===401)alert('Class restored, but Google Calendar access expired. Sign out and sign in again.')}}
   setTasks(x=>x.map(t=>t.id===task.id?next:t));return
  }
  setTasks(x=>x.map(t=>t.id===task.id?{...t,timetable_cancelled:!t.timetable_cancelled,google_event_id:action==='cancel'?null:t.google_event_id}:t));
 }
 async function logSession(minutes,subjectId,date,startTime,endTime){const mins=Math.max(1,Math.round(Number(minutes)||1));const row={user_id:user?.id,subject_id:subjectId||null,minutes:mins,session_date:date||localDateKey(new Date()),start_time:startTime||null,end_time:endTime||null,note:''};if(cloudReady&&user){const {data,error}=await supabase.from('study_sessions').insert(row).select().single();if(error)throw error;if(data)setSessions(x=>[data,...x])}else setSessions(x=>[{...row,id:uid()},...x]);setRunning(false);setSessionModal(false)}
 async function deleteSession(session){if(!session?.id)return;if(!window.confirm('Delete this logged session? This cannot be undone.'))return;if(cloudReady&&user){const {error}=await supabase.from('study_sessions').delete().eq('id',session.id);if(error){alert(`Could not delete this session. ${error.message}`);return}}setSessions(x=>x.filter(s=>s.id!==session.id))}
 const resetFocusState=(mode=focusMode,count=pomodoros)=>{setRunning(false);setFocusStartedAt(null);setFocusInitialSeconds(0);setPendingFocusReset(null);const mins=mode==='custom'?Number(customMinutes)||30:count*25;setTimer(mins*60)}
 const toggleFocusTimer=()=>{if(running){setRunning(false);return} if(timer<=0){resetFocusState();return} if(!focusStartedAt){setFocusStartedAt(new Date().toISOString());setFocusInitialSeconds(timer)} setRunning(true)}
 const requestFocusReset=()=>{const elapsedSeconds=Math.max(0,focusInitialSeconds-timer);if(focusStartedAt&&elapsedSeconds>=5){setRunning(false);setPendingFocusReset({startAt:focusStartedAt,endAt:new Date().toISOString(),minutes:Math.max(1,Math.round(elapsedSeconds/60)),elapsedSeconds});return} resetFocusState()}
 const savePausedFocusSession=async()=>{if(!pendingFocusReset)return;const start=new Date(pendingFocusReset.startAt),end=new Date(pendingFocusReset.endAt);try{await logSession(pendingFocusReset.minutes,null,localDateKey(start),`${String(start.getHours()).padStart(2,'0')}:${String(start.getMinutes()).padStart(2,'0')}`,`${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`)}catch(error){alert(`Could not save this focus session. ${error.message||'Please try again.'}`);return}resetFocusState()}
 const discardPausedFocusSession=()=>resetFocusState()
 const activeTasks=tasks.filter(t=>!t.timetable_cancelled&&!t.timetable_source); const done=activeTasks.filter(t=>t.status==='Done').length, progress=activeTasks.length?Math.round(done/activeTasks.length*100):0; const today=localDateKey(new Date()); const dueToday=activeTasks.filter(t=>t.due_date===today&&t.status!=='Done').length; const hours=Math.round((sessions.reduce((a,b)=>a+b.minutes,0)/60)*10)/10;
 const visibleTasks=activeTasks.filter(t=>!t.timetable_source&&(filter==='All'||t.status===filter||t.priority===filter)&&(`${t.title} ${t.notes} ${(t.tags||[]).join(' ')}`.toLowerCase().includes(search.toLowerCase()))).sort((a,b)=>{const ad=a.status==='Done',bd=b.status==='Done';if(ad!==bd)return ad?1:-1;return (a.due_date||'9999-12-31').localeCompare(b.due_date||'9999-12-31')});
 const subjectMap=Object.fromEntries(subjects.map(s=>[s.id,s]));
 const streakStats=getStreakStats(sessions,streakRequirement);
 const searchTerm=search.trim().toLowerCase();
 const searchResults=searchTerm?[
  ...tasks.filter(t=>`${t.title} ${t.notes||''} ${(t.tags||[]).join(' ')}`.toLowerCase().includes(searchTerm)).slice(0,8).map(t=>({type:'task',id:t.id,title:t.title,meta:subjectMap[t.subject_id]?.name||'Task',icon:CheckSquare})),
  ...subjects.filter(s=>`${s.name} ${s.code||''} ${s.category||''} ${s.notes||''}`.toLowerCase().includes(searchTerm)).slice(0,6).map(s=>({type:'subject',id:s.id,title:s.name,meta:s.category||'Subject',icon:BookOpen}))
 ].slice(0,8):[];
 const clearSearch=()=>setSearch('');
 const openSearchResult=(result)=>{
  if(result.type==='task'){setTab('Tasks');setFilter('All');}
  else {setTab('Subjects');setSelectedSubject(result.id);}
  clearSearch();
 };
 return <div className={'app density-'+density.toLowerCase()}><aside className={(mobile?'side open':'side')+(sidebarCollapsed?' collapsed':'')}><div className="brand"><div className="logo">✦</div><div className="brandCopy"><b>ORBIT Tracker</b><small>plan, organize, and get things done</small></div><button className="iconbtn close" onClick={()=>setMobile(false)} aria-label="Close sidebar"><X size={18}/></button></div><nav>{[['Dashboard',LayoutDashboard],['Tasks',CheckSquare],['Subjects',BookOpen],['Calendar',CalendarDays],['Timetable',CalendarClock],['Focus',Timer]].map(([n,I])=><button className={tab===n?'nav active':'nav'} onClick={()=>{setTab(n);setMobile(false)}} key={n}><I size={18}/><span>{n}</span></button>)}<button className={tab==='Settings'?'nav active':'nav'} onClick={()=>{setTab('Settings');setMobile(false)}}><Settings size={18}/><span>Settings</span></button></nav><div className="sideBottom"><button type="button" className={quoteChanging?"quoteCard quoteCardChanging":"quoteCard"} onClick={()=>{setQuoteChanging(true);setQuoteIndex(i=>{let next=Math.floor(Math.random()*ORBIT_QUOTES.length);if(ORBIT_QUOTES.length>1&&next===i)next=(next+1)%ORBIT_QUOTES.length;return next});window.setTimeout(()=>setQuoteChanging(false),420)}} aria-label="Show another ORBIT quote"><div className="quoteMark">“</div><p>{ORBIT_QUOTES[quoteIndex].title}</p><small>{ORBIT_QUOTES[quoteIndex].body}</small><div className="onlineStatus"><span className="dot onlineDot"/><span>Online</span></div></button></div></aside><main><header><button className="iconbtn menu" onClick={()=>{if(window.innerWidth<=800){setMobile(true)}else{setSidebarCollapsed(v=>{const next=!v;localStorage.setItem('orbit_sidebar_collapsed',next?'1':'0');return next})}}} aria-label={sidebarCollapsed?"Expand sidebar":"Collapse sidebar"} title={sidebarCollapsed?"Expand sidebar":"Collapse sidebar"}><Menu/></button><div className="crumb">{tab}<span> / </span><b>{tab==='Dashboard'?'Today':'Workspace'}</b></div><div className="headActions"><div className={'search '+(searchTerm?'searchActive':'')}><Search size={17}/><input value={search} onFocus={()=>searchTerm&&setSearchOpen(true)} onChange={e=>{setSearch(e.target.value);setSearchOpen(true)}} onKeyDown={e=>{if(e.key==='Enter'&&searchResults[0])openSearchResult(searchResults[0]);if(e.key==='Escape'){clearSearch();setSearchOpen(false)}}} placeholder="Search tasks, notes, subjects..." aria-label="Search tasks, notes, and subjects"/><button type="button" className={"searchClear"+(searchTerm?" searchClearVisible":"")} onClick={()=>{clearSearch();setSearchOpen(false)}} aria-label="Clear search" title="Clear search"><X size={15}/></button>{searchTerm&&searchOpen&&<div className="searchResults" role="listbox" aria-label="Search results">{searchResults.length?searchResults.map(result=>{const Icon=result.icon;return <button type="button" className="searchResult" key={result.type+'-'+result.id} onClick={()=>openSearchResult(result)}><span className="searchResultIcon"><Icon size={15}/></span><span className="searchResultText"><b>{result.title}</b><small>{result.meta}</small></span><ArrowUpRight size={14}/></button>}):<div className="searchNoResults"><Search size={16}/><span>No matching tasks or subjects</span></div>}</div>}</div>{user?<div className="profile"><button onClick={()=>setProfileOpen(!profileOpen)} className="avatar">{(user.user_metadata?.full_name||user.email||user.phone||'U')[0].toUpperCase()}</button>{profileOpen&&<div className="profileMenu"><b>{user.user_metadata?.full_name||'User'}</b><small>{user.email||user.phone}</small><button onClick={logout}><LogOut size={15}/> Sign out</button></div>}</div>:<button className="google" onClick={login}>Sign in</button>}</div></header>{tab==='Dashboard'&&<Dashboard progress={progress} dueToday={dueToday} hours={hours} tasks={tasks} subjects={subjects} subjectMap={subjectMap} toggleTask={toggleTask} updateTask={updateTask} setTab={setTab} setModal={setModal} onOpenSessionHistory={()=>setSessionHistoryDate(localDateKey(new Date()))} onOpenMomentum={()=>setMomentumModal(true)} streak={streakStats.current}/>} {tab==='Tasks'&&<Tasks tasks={visibleTasks} subjectMap={subjectMap} toggleTask={toggleTask} deleteTask={deleteTask} setModal={setModal} filter={filter} setFilter={setFilter}/>} {tab==='Subjects'&&(selectedSubject?<SubjectDetail subject={subjects.find(s=>s.id===selectedSubject)} tasks={tasks} setTasks={setTasks} subjects={subjects} setSubjects={setSubjects} setSelectedSubject={setSelectedSubject} setModal={setModal} cloudReady={cloudReady} user={user} deleteTask={deleteTask} deleteSubject={deleteSubject} onEditSubject={setSubjectEdit} toggleTask={toggleTask}/>:<Subjects subjects={subjects} tasks={tasks} setModal={setModal} onSelect={setSelectedSubject}/>)} {tab==='Calendar'&&<Calendar tasks={tasks.filter(t=>!t.timetable_cancelled)} subjectMap={subjectMap} setModal={setModal}/>} {tab==='Timetable'&&<Timetable tasks={tasks} onImport={()=>setTimetableModal(true)} onCancel={cancelClass} onEdit={t=>setModal({type:'task',task:t})} onEditSeries={t=>setTimetableSeriesEdit(t)} onDeleteSeries={deleteTimetableGroup}/>} {tab==='Focus'&&<Focus timer={timer} running={running} setRunning={setRunning} setTimer={setTimer} onToggle={toggleFocusTimer} onReset={requestFocusReset} onLogSession={()=>setSessionModal(true)} focusMode={focusMode} setFocusMode={setFocusMode} pomodoros={pomodoros} setPomodoros={setPomodoros} customMinutes={customMinutes} setCustomMinutes={setCustomMinutes}/>}  {tab==='Settings'&&<SettingsPage theme={theme} setTheme={setTheme} user={user} login={login} logout={logout} onOpen={setSettingsPanel}/>} {settingsPanel&&<SettingsDetail type={settingsPanel} theme={theme} setTheme={setTheme} density={density} setDensity={setDensity} user={user} googleProviderToken={googleProviderToken} login={login} logout={logout} onFocusLengthChange={m=>{setRunning(false);setFocusMode('custom');setCustomMinutes(m);setTimer(m*60)}} onClearLocalData={()=>{if(!window.confirm('Clear all local tasks, subjects, and sessions? This cannot be undone.'))return;localStorage.removeItem('orbit_subjects');localStorage.removeItem('orbit_tasks');localStorage.removeItem('orbit_sessions');setSubjects([]);setTasks([]);setSessions([]);setSelectedSubject(null);}} onClose={()=>setSettingsPanel(null)}/>} </main>{(modal==='task'||(modal?.type==='task'))&&<TaskModal subjects={subjects} initialDate={modal?.dueDate||''} initialTask={modal?.task||null} onClose={()=>setModal(null)} onSave={saveTask}/>} {modal==='subject'&&<SubjectModal onClose={()=>setModal(null)} onSave={saveSubject}/>} {subjectEdit&&<SubjectEditModal subject={subjectEdit} onClose={()=>setSubjectEdit(null)} onSave={v=>updateSubject(subjectEdit,v)}/>} {sessionModal&&<SessionModal subjects={subjects} defaultMinutes={Math.max(1,Math.round(timer/60))} onClose={()=>setSessionModal(false)} onSave={logSession}/>} {pendingFocusReset&&<FocusResetModal pending={pendingFocusReset} onSave={savePausedFocusSession} onDiscard={discardPausedFocusSession} onCancel={()=>setPendingFocusReset(null)}/>} {sessionHistoryDate&&<SessionHistoryModal date={sessionHistoryDate} sessions={sessions} subjects={subjects} onDateChange={setSessionHistoryDate} onDelete={deleteSession} onClose={()=>setSessionHistoryDate(null)}/>} {momentumModal&&<MomentumModal sessions={sessions} requirement={streakRequirement} onClose={()=>setMomentumModal(false)} onSave={v=>{setStreakRequirement(v);localStorage.setItem('orbit_streak_requirement',String(v));setMomentumModal(false)}}/>}  {authModal&&<AuthModal cloudReady={cloudReady} onClose={()=>setAuthModal(false)} onGoogle={loginGoogle}/>} {timetableModal&&<TimetableImportModal onClose={()=>setTimetableModal(false)} onImport={importTimetable}/>} {timetableSeriesEdit&&<TimetableSeriesEditModal task={timetableSeriesEdit} onClose={()=>setTimetableSeriesEdit(null)} onSave={saveTimetableSeries}/>}</div>
}
function Dropdown({value,onChange,options,ariaLabel='Select option',className='',optionLabels={},onDeleteOption}){
 const [open,setOpen]=useState(false); const ref=useRef(null);
 useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[]);
 return <div className={'dropdown '+className+(open?' dropdownOpen':'')} ref={ref}>
  <button type="button" className={'dropdownTrigger '+(open?'open':'')} onClick={()=>setOpen(v=>!v)} aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel}>
   <span>{optionLabels[value]||value}</span><ChevronDown size={18} className="dropdownChevron"/>
  </button>
  {open&&<div className="dropdownMenu" role="listbox">
   {options.map(option=>{const active=option===value;const deletable=onDeleteOption?.canDelete?.(option);return deletable?<div className="dropdownOptionRow" key={option}>
    <button type="button" role="option" aria-selected={active} className={'dropdownOption '+(active?'selected':'')} onClick={()=>{onChange(option);setOpen(false)}}><span>{optionLabels[option]||option}</span>{active&&<Check size={16}/>}</button>
    <button type="button" className="dropdownOptionDelete" aria-label={'Remove '+(optionLabels[option]||option)} title={'Remove '+(optionLabels[option]||option)} onClick={e=>{e.stopPropagation();onDeleteOption.remove(option)}}><X size={14}/></button>
   </div>:<button type="button" role="option" aria-selected={active} className={'dropdownOption '+(active?'selected':'')} key={option} onClick={()=>{onChange(option);setOpen(false)}}><span>{optionLabels[option]||option}</span>{active&&<Check size={16}/>}</button>})}
  </div>}
 </div>
}
function CategoryPicker({value,onChange}){
 const defaults=['Work','Personal','Learning','Health','Other'];
 const [categories,setCategories]=useState(()=>{try{return Array.from(new Set([...defaults,...JSON.parse(localStorage.getItem('orbit_categories')||'[]')]))}catch{return defaults}});
 const [adding,setAdding]=useState(false);
 const [custom,setCustom]=useState('');
 const addCategory=()=>{const name=custom.trim().replace(/\s+/g,' ');if(!name)return;const next=Array.from(new Set([...categories,name]));setCategories(next);localStorage.setItem('orbit_categories',JSON.stringify(next.filter(x=>!defaults.includes(x))));onChange(name);setCustom('');setAdding(false)};
 const removeCategory=(name)=>{if(defaults.includes(name))return;const next=categories.filter(x=>x!==name);setCategories(next);localStorage.setItem('orbit_categories',JSON.stringify(next.filter(x=>!defaults.includes(x))));if(value===name)onChange('Other')};
 const options=[...categories,'__add__'];
 return <div className="categoryPicker">
  <Dropdown value={value} onChange={v=>v==='__add__'?setAdding(true):onChange(v)} options={options} optionLabels={{'__add__':'+ Add custom category'}} ariaLabel="Select category" className="formDropdown" onDeleteOption={{canDelete:option=>option!=='__add__'&&!defaults.includes(option),remove:removeCategory}}/>
  {adding&&<div className="customCategoryEditor">
   <div className="customCategoryRow"><input autoFocus value={custom} onChange={e=>setCustom(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addCategory();if(e.key==='Escape'){setAdding(false);setCustom('')}}} placeholder="e.g. Freelance" aria-label="Custom category name"/><button type="button" className="secondary" onClick={addCategory} disabled={!custom.trim()}>Add</button></div>
   <button type="button" className="customCategoryCancel" onClick={()=>{setAdding(false);setCustom('')}}>Cancel</button>
  </div>}
 </div>
}
function SettingsPage({theme,setTheme,user,login,logout,onOpen}){
 const themes=[['dark','Dark',Moon,'Deep and easy on the eyes'],['light','Light',Sun,'Bright and clean for daytime'],['system','System',Monitor,'Follow your device preference']];
 const settingRows=[
  ['Account',CircleUser,'Manage your profile and sign-in preferences'],
  ['Appearance',Palette,'Theme, interface density and visual style'],
  ['Notifications',Bell,'Task reminders, deadlines and useful nudges'],
  ['Focus preferences',SlidersHorizontal,'Default focus length and planning preferences'],
  ['Privacy & sync',ShieldCheck,'Cloud sync, local storage and data controls'],
 ];
 return <section className="page settingsPage">
  <div className="sectionTop"><div><span className="eyebrow">WORKSPACE CONTROL</span><h1>Settings</h1><p>Shape Orbit around the way you actually work.</p></div></div>
  <div className="settingsGrid">
   <div className="panel settingsPanel"><div className="panelHead"><div><span className="eyebrow">APPEARANCE</span><h2>Theme</h2></div><Palette size={19}/></div><p className="settingsHint">Choose how Orbit looks. Your choice is saved on this device.</p><div className="themeChoices">{themes.map(([id,label,Icon,desc])=><button key={id} className={'themeChoice '+(theme===id?'selected':'')} onClick={()=>setTheme(id)}><div className="themeIcon"><Icon size={18}/></div><div><b>{label}</b><small>{desc}</small></div><span className="radio">{theme===id?'✓':''}</span></button>)}</div></div>
   <div className="panel settingsPanel"><div className="panelHead"><div><span className="eyebrow">PREFERENCES</span><h2>Settings</h2></div><Settings size={19}/></div><div className="settingsList">{settingRows.map(([label,Icon,desc])=><button type="button" key={label} className="settingRow" onClick={()=>onOpen(label)}><div className="settingIcon"><Icon size={17}/></div><div><b>{label}</b><small>{desc}</small></div><ArrowUpRight size={15}/></button>)}</div></div>
  </div>
 </section>
}

function SettingsDetail({type,theme,setTheme,density,setDensity,user,googleProviderToken,login,logout,onClose,onFocusLengthChange,onClearLocalData}){
 const [notifications,setNotifications]=useState(()=>localStorage.getItem('orbit_notifications')!=='off');
 const [sound,setSound]=useState(()=>localStorage.getItem('orbit_focus_sound')!=='off');
 const [focusLength,setFocusLength]=useState(()=>Number(localStorage.getItem('orbit_default_focus')||25));
 const save=(key,val)=>localStorage.setItem(key,val);
 const title=type;
 return <div className="overlay settingsOverlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}} ><div className="modal settingsDetail" onMouseDown={e=>e.stopPropagation()}>
  <div className="modalHead"><div><span className="eyebrow">SETTINGS</span><h2>{title}</h2></div><button className="iconbtn" onClick={onClose}><X/></button></div>
  {type==='Account'&&<div className="detailSettingsContent">{user?<><div className="accountCard"><div className="accountAvatar">{(user.user_metadata?.full_name||user.email||'U')[0].toUpperCase()}</div><div><b>{user.user_metadata?.full_name||'User'}</b><small>{user.email}</small></div></div><button className="secondary full" onClick={logout}><LogOut size={16}/> Sign out</button></>:<><div className="accountCard"><div className="accountAvatar"><CircleUser/></div><div><b>Not signed in</b><small>Sign in to sync your workspace across devices.</small></div></div><button type="button" className="primary full" onMouseDown={e=>e.stopPropagation()} onClick={login}>Sign in</button></>}</div>}
  {type==='Appearance'&&<div className="detailSettingsContent"><div className="detailSection"><b>Theme</b><small>Choose the interface style used across Orbit.</small><div className="detailChoices">{[['dark','Dark',Moon],['light','Light',Sun],['system','System',Monitor]].map(([id,label,Icon])=><button type="button" className={'detailChoice '+(theme===id?'selected':'')} onClick={()=>setTheme(id)} key={id}><Icon size={16}/><span>{label}</span>{theme===id&&<Check size={15}/>}</button>)}</div></div><div className="detailSection"><b>Interface density</b><small>Control how spacious lists and cards feel.</small><div className="detailChoices">{['Compact','Comfortable','Spacious'].map(x=><button type="button" className={'detailChoice '+(density===x?'selected':'')} onClick={()=>{setDensity(x);save('orbit_density',x)}} key={x}><span>{x}</span>{density===x&&<Check size={15}/>}</button>)}</div></div></div>}
  {type==='Notifications'&&<div className="detailSettingsContent"><ToggleRow label="Task reminders" desc="Allow Orbit to surface reminders for upcoming work." checked={notifications} onChange={v=>{setNotifications(v);save('orbit_notifications',v?'on':'off')}}/><div className="detailDivider"/><ToggleRow label="Focus sounds" desc="Use a sound cue when a focus session finishes." checked={sound} onChange={v=>{setSound(v);save('orbit_focus_sound',v?'on':'off')}}/></div>}
  {type==='Focus preferences'&&<div className="detailSettingsContent"><div className="detailSection"><b>Default focus length</b><small>This duration will be used when you open Focus.</small><div className="focusLengthGrid">{[15,25,45,60].map(m=><button type="button" className={'detailChoice '+(focusLength===m?'selected':'')} onClick={()=>{setFocusLength(m);save('orbit_default_focus',m);onFocusLengthChange?.(m)}} key={m}><span>{m} min</span>{focusLength===m&&<Check size={15}/>}</button>)}</div></div></div>}
  {type==='Privacy & sync'&&<div className="detailSettingsContent"><div className="infoBox"><ShieldCheck size={18}/><div><b>Cloud workspace</b><small>{user?'Your tasks, subjects and focus sessions are tied to your Google account and load when you sign in again.':'Sign in with Google to sync your workspace across devices.'}</small></div></div><div className="infoBox"><CalendarDays size={18}/><div><b>Google Calendar</b><small>{user?(googleProviderToken?'Connected — scheduled tasks are mirrored to your primary Google Calendar.':'Signed in, but Calendar permission is not connected. Sign out and sign in with Google again.'):'Sign in with Google to enable Calendar sync.'}</small></div></div><button type="button" className="secondary full" onClick={onClearLocalData}>Clear local workspace data</button></div>}
 </div></div>
}

function ToggleRow({label,desc,checked,onChange}){return <div className="toggleRow"><div><b>{label}</b><small>{desc}</small></div><button type="button" className={'switch '+(checked?'on':'')} aria-pressed={checked} onClick={()=>onChange(!checked)}><span/></button></div>}

function Empty({text}){return <div className="empty">{text}</div>}
function DateField({value,onChange,label='Deadline',compact=false,onCancel}){
 const [open,setOpen]=useState(false);
 const [cursor,setCursor]=useState(()=>{const d=value?new Date(value+'T00:00:00'):new Date();d.setDate(1);return d});
 const ref=useRef(null);
 useEffect(()=>{if(value){const d=new Date(value+'T00:00:00');d.setDate(1);setCursor(d)}},[value]);
 useEffect(()=>{
  if(!open)return;
  const close=e=>{
   if(ref.current&&!ref.current.contains(e.target)){setOpen(false);onCancel?.()}
  };
  const onKey=e=>{if(e.key==='Escape'){setOpen(false);onCancel?.()}};
  document.addEventListener('pointerdown',close,true);
  document.addEventListener('keydown',onKey);
  return()=>{document.removeEventListener('pointerdown',close,true);document.removeEventListener('keydown',onKey)};
 },[open,onCancel]);
 const selected=value?new Date(value+'T00:00:00'):null;
 const pretty=value?new Date(value+'T00:00:00').toLocaleDateString(undefined,{day:'2-digit',month:'short',year:'numeric'}):'Select a date';
 const monthLabel=cursor.toLocaleDateString(undefined,{month:'long',year:'numeric'});
 const firstDay=new Date(cursor.getFullYear(),cursor.getMonth(),1).getDay();
 const daysInMonth=new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate();
 const cells=Array.from({length:firstDay+daysInMonth},(_,i)=>i<firstDay?null:i-firstDay+1);
 const pick=(d)=>{onChange(localDateKey(d));setOpen(false)};
 const shiftMonth=n=>setCursor(d=>new Date(d.getFullYear(),d.getMonth()+n,1));
 const today=new Date();today.setHours(0,0,0,0);
 const isSame=(a,b)=>a&&b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
 return <div className={'dateField '+(compact?'dateFieldCompact':'')} ref={ref}>
  <button type="button" className={'dateFieldButton '+(!value?'placeholder':'')+(open?' open':'')} onClick={()=>setOpen(v=>!v)} aria-expanded={open} aria-haspopup="dialog" aria-label={`${label}: ${pretty}`}>
   <span className="dateValue"><small>{value?'DATE':'DEADLINE'}</small>{pretty}</span>
   <span className="dateIconWrap" aria-hidden="true"><CalendarDays size={17}/></span>
  </button>
  {open&&<div className="datePicker" role="dialog" aria-label="Choose date">
   <div className="dateQuick"><button type="button" onClick={()=>pick(today)}>Today</button><button type="button" onClick={()=>{const d=new Date(today);d.setDate(d.getDate()+1);pick(d)}}>Tomorrow</button><button type="button" onClick={()=>{const d=new Date(today);d.setDate(d.getDate()+7);pick(d)}}>Next week</button></div>
   <div className="datePickerHead"><button type="button" className="dateNav" onClick={()=>shiftMonth(-1)} aria-label="Previous month">‹</button><b>{monthLabel}</b><button type="button" className="dateNav" onClick={()=>shiftMonth(1)} aria-label="Next month">›</button></div>
   <div className="dateWeek"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div>
   <div className="dateGrid">{cells.map((day,i)=>day===null?<span className="dateBlank" key={'blank-'+i}/>:<button type="button" key={day} className={'dateCell '+(selected&&selected.getFullYear()===cursor.getFullYear()&&selected.getMonth()===cursor.getMonth()&&selected.getDate()===day?'selected':'')+((today.getFullYear()===cursor.getFullYear()&&today.getMonth()===cursor.getMonth()&&today.getDate()===day)?' today':'')} onClick={()=>pick(new Date(cursor.getFullYear(),cursor.getMonth(),day))}>{day}</button>)}</div>
   {value&&<button type="button" className="dateClear" onClick={()=>{onChange('');setOpen(false)}}>Clear date</button>}
  </div>}
 </div>
}
function TimeField({value,onChange,label='Time'}){
 const [open,setOpen]=useState(false);
 const fieldRef=useRef(null);
 const menuRef=useRef(null);
 const parsed=value?value.split(':').map(Number):[null,null];
 const rawH=Number.isFinite(parsed[0])?parsed[0]:null;
 const minute=Number.isFinite(parsed[1])?parsed[1]:0;
 const hour12=rawH==null?12:(rawH%12||12);
 const period=rawH==null?'AM':rawH>=12?'PM':'AM';
 const pretty=value?`${hour12}:${String(minute).padStart(2,'0')} ${period}`:'Select time';
 const options=Array.from({length:96},(_,i)=>{
   const h24=Math.floor(i/4), m=(i%4)*15, p=h24>=12?'PM':'AM', h12=h24%12||12;
   return {value:`${String(h24).padStart(2,'0')}:${String(m).padStart(2,'0')}`, label:`${h12}:${String(m).padStart(2,'0')} ${p}`};
 });
 const toggle=()=>setOpen(v=>!v);
 useEffect(()=>{
   if(!open)return;
   const close=e=>{
     const t=e.target;
     if(fieldRef.current?.contains(t)||menuRef.current?.contains(t))return;
     setOpen(false);
   };
   document.addEventListener('pointerdown',close,true);
   const key=e=>{if(e.key==='Escape')setOpen(false)};
   document.addEventListener('keydown',key);
   requestAnimationFrame(()=>menuRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({block:'center'}));
   return()=>{document.removeEventListener('pointerdown',close,true);document.removeEventListener('keydown',key)};
 },[open]);
 return <div className="timeField" ref={fieldRef}>
   <button type="button" className={'timeFieldButton '+(open?'open':'')+(value?' hasValue':'')} onClick={toggle} aria-expanded={open} aria-haspopup="listbox">
    <span className="timeValue"><small>{value?'TIME':label.toUpperCase()}</small><span>{pretty}</span></span><Clock3 size={18}/>
   </button>
   {open&&<div className="timeMenu" ref={menuRef} role="listbox" aria-label={`Choose ${label}`}>
      <div className="timeMenuHead"><div><span className="eyebrow">{label.toUpperCase()}</span><b>{pretty}</b></div><button type="button" className="timeMenuClear" onClick={()=>{onChange('');setOpen(false)}} disabled={!value}>Clear</button></div>
      <div className="timeQuickRow"><button type="button" onClick={()=>onChange('09:00')}>9:00 AM</button><button type="button" onClick={()=>onChange('12:00')}>12:00 PM</button><button type="button" onClick={()=>onChange('18:00')}>6:00 PM</button><button type="button" onClick={()=>onChange('21:00')}>9:00 PM</button></div>
      <div className="timeOptions">{options.map(o=><button type="button" key={o.value} role="option" aria-selected={value===o.value} className={'timeOption '+(value===o.value?'selected':'')} onClick={()=>{onChange(o.value);setOpen(false)}}><span>{o.label}</span>{value===o.value&&<Check size={15}/>}</button>)}</div>
   </div>}
 </div>
}
function TaskModal({subjects,initialDate='',initialTask=null,onClose,onSave}){
 const [v,setV]=useState(()=>{
  if(initialTask){const startDate=initialTask.start_date||initialTask.due_date||'';const endDate=initialTask.end_date||initialTask.due_date||startDate;return {...initialTask,start_date:startDate,end_date:endDate,start_time:initialTask.start_time||'',end_time:initialTask.end_time||''}}
  return {title:'',subject_id:null,start_date:initialDate||'',end_date:initialDate||'',start_time:'',end_time:'',priority:'Medium',status:'Todo',estimated_minutes:null,notes:'',tags:[]}
 });
 const editing=Boolean(initialTask?.id); const autoMinutes=durationMinutes(v.start_date,v.start_time,v.end_date,v.end_time); const set=(key,value)=>setV(x=>({...x,[key]:value}));
 const clearStart=()=>setV(x=>({...x,start_date:'',start_time:''})); const clearEnd=()=>setV(x=>({...x,end_date:'',end_time:''}));
 return <Modal title={editing?'Edit task':'New task'} onClose={onClose}>
  <label>Task title <small className="optional">Optional</small><input autoFocus value={v.title||''} onChange={e=>set('title',e.target.value)} placeholder="e.g. Finish the first draft"/></label>
  <div className="formGrid">
   <label>Subject <small className="optional">Optional</small><Dropdown value={subjects.find(s=>s.id===v.subject_id)?.name||'Select subject'} onChange={name=>{const s=subjects.find(x=>x.name===name);set('subject_id',s?.id||null)}} options={subjects.map(s=>s.name)} ariaLabel="Select subject" className="formDropdown"/></label>
   <div className="dateRangeField"><span className="fieldLabel">Schedule <small className="optional">Optional</small></span><div className="dateRangeGrid"><label><span>Start date</span><DateField value={v.start_date||''} onChange={date=>set('start_date',date)} label="Start date"/></label><label><span>End date</span><DateField value={v.end_date||''} onChange={date=>set('end_date',date)} label="End date"/></label></div></div>
   <label>Start time <small className="optional">Optional</small><TimeField value={v.start_time} onChange={time=>set('start_time',time)} label="Start time"/></label>
   <label>End time <small className="optional">Optional</small><TimeField value={v.end_time} onChange={time=>set('end_time',time)} label="End time"/></label>
   <label>Priority <small className="optional">Optional</small><Dropdown value={v.priority||'Medium'} onChange={priority=>set('priority',priority||'Medium')} options={['Low','Medium','High','Urgent']} ariaLabel="Select priority" className="formDropdown"/></label>
   <label>Minutes <small className="optional">Optional</small><input type="number" min="0" value={autoMinutes??(v.estimated_minutes??'')} readOnly={autoMinutes!=null} onChange={e=>set('estimated_minutes',e.target.value)} placeholder={autoMinutes!=null?'Calculated automatically':'e.g. 30'}/>{autoMinutes!=null&&<small className="timeHint">Calculated from start and end date/time</small>}</label>
  </div>
  <label>Description <small className="optional">Optional</small><textarea value={v.notes||''} onChange={e=>set('notes',e.target.value)} placeholder="Add details, context, links, or anything useful for this task..."/></label>
  <button className="primary full" onClick={()=>onSave({...v,estimated_minutes:autoMinutes??v.estimated_minutes,due_date:v.end_date||null})}>{editing?'Save changes':'Create task'}</button>
 </Modal>
}
function SubjectEditModal({subject,onClose,onSave}){
 const [v,setV]=useState({name:subject?.name||'',code:subject?.code||'',category:subject?.category||'Work',color:subject?.color||'#8b5cf6',target_hours:subject?.target_hours||0,notes:subject?.notes||''});
 const [saving,setSaving]=useState(false);
 const submit=async()=>{if(!v.name.trim()||saving)return;setSaving(true);try{await onSave(v)}finally{setSaving(false)}};
 return <Modal title="Edit subject" onClose={onClose} className="subjectEditModal">
  <label>Subject name<input autoFocus value={v.name} onChange={e=>setV({...v,name:e.target.value})} placeholder="e.g. Product Design"/></label>
  <div className="formGrid">
   <label>Category<CategoryPicker value={v.category} onChange={category=>setV({...v,category})}/></label>
   <label>Code<input value={v.code} onChange={e=>setV({...v,code:e.target.value})} placeholder="CS / IT"/></label>
   <label>Target hours<input type="number" min="0" value={v.target_hours} onChange={e=>setV({...v,target_hours:+e.target.value})}/></label>
   <label>Accent<input type="color" value={v.color} onChange={e=>setV({...v,color:e.target.value})}/></label>
  </div>
  <label>Description<small className="optional">Optional</small><textarea value={v.notes} onChange={e=>setV({...v,notes:e.target.value})} placeholder="Describe this subject, project, goal, or anything useful to remember..."/></label>
  <div className="modalActions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button type="button" className="primary" disabled={!v.name.trim()||saving} onClick={submit}>{saving?'Saving...':'Save changes'}</button></div>
 </Modal>
}
function SubjectModal({onClose,onSave}){const [v,setV]=useState({name:'',code:'',category:'Work',color:'#8b5cf6',target_hours:20,notes:''});return <Modal title="Add subject" onClose={onClose}><label>Subject name<input autoFocus value={v.name} onChange={e=>setV({...v,name:e.target.value})} placeholder="e.g. Product Design"/></label><div className="formGrid"><label>Category<CategoryPicker value={v.category} onChange={category=>setV({...v,category})}/></label><label>Code<input value={v.code} onChange={e=>setV({...v,code:e.target.value})} placeholder="CS / IT"/></label><label>Target hours<input type="number" min="0" value={v.target_hours} onChange={e=>setV({...v,target_hours:+e.target.value})}/></label><label>Accent<input type="color" value={v.color} onChange={e=>setV({...v,color:e.target.value})}/></label></div><label>Description<textarea value={v.notes} onChange={e=>setV({...v,notes:e.target.value})} placeholder="Describe this subject, project, goal, or anything useful to remember..."/></label><button className="primary full" disabled={!v.name.trim()} onClick={()=>onSave(v)}>Create subject</button></Modal>}
function Stat({icon:Icon,label,value,sub,onClick,accent='purple',detail}){return <button type="button" className={'stat statClickable '+accent} onClick={onClick} aria-label={`${label}: ${value}. ${sub}`}><div className="statTop"><div className="statIcon"><Icon size={19}/></div><span className="statArrow"><ArrowUpRight size={15}/></span></div><div className="statBody"><small>{label}</small><strong>{value}</strong><span>{sub}</span></div>{detail&&<span className="statDetail">{detail}</span>}</button>}
function Dashboard(p){const upcoming=p.tasks.filter(t=>t.status!=='Done').sort((a,b)=>(a.due_date||'9').localeCompare(b.due_date||'9')).slice(0,5);return <section className="page"><div className="hero"><div><span className="eyebrow">{formatDashboardDate()}</span><h1>Make progress, <em>not pressure.</em></h1><p>Your tasks, projects, and plans, in one calm workspace.</p></div><button className="primary" onClick={()=>p.setModal('task')}><Plus size={18}/> Add task</button></div><div className="stats"><Stat icon={Target} label="Overall progress" value={p.progress+'%'} sub="across your tasks" detail={`${p.tasks.filter(t=>t.status==='Done').length} completed`} onClick={()=>p.setTab('Tasks')} accent="purple"/><Stat icon={Clock3} label="Time logged" value={p.hours+'h'} sub="all-time sessions" detail="View daily history" onClick={p.onOpenSessionHistory} accent="cyan"/><Stat icon={CheckSquare} label="Due today" value={p.dueToday} sub="tasks to finish" detail={p.dueToday?'Needs attention':'All clear today'} onClick={()=>p.setTab('Calendar')} accent="green"/><Stat icon={Flame} label="Momentum" value={`${p.streak} day${p.streak===1?'':'s'}`} sub="current study streak" detail="Set streak goal" onClick={p.onOpenMomentum} accent="orange"/></div><div className="grid2"><div className="panel"><div className="panelHead"><div><span className="eyebrow">UP NEXT</span><h2>Your priority queue</h2></div><button className="textBtn" onClick={()=>p.setTab('Tasks')}>View all <ArrowUpRight size={15}/></button></div>{upcoming.length?<div className="taskList">{upcoming.map(t=><TaskRow key={t.id} t={t} subject={p.subjectMap[t.subject_id]} subjects={p.subjects} toggle={p.toggleTask} updateTask={p.updateTask}/>)}</div>:<Empty text="You're all caught up. ✨"/>}</div><div className="panel"><div className="panelHead"><div><span className="eyebrow">SUBJECT PULSE</span><h2>Where your time goes</h2></div><button className="textBtn" onClick={()=>p.setModal('subject')}><Plus size={15}/> Subject</button></div><div className="subjectBars">{p.subjects.slice(0,5).map(s=>{const total=p.tasks.filter(t=>t.subject_id===s.id).length;const d=p.tasks.filter(t=>t.subject_id===s.id&&t.status==='Done').length;return <div className="barRow" key={s.id}><div className="barLabel"><span className="subjectDot" style={{background:s.color}}/><b>{s.name}</b><span>{d}/{total}</span></div><div className="bar"><i style={{width:`${total?d/total*100:0}%`,background:s.color}}/></div></div>})}</div></div></div></section>}
function InlineEdit({children,className='',onEdit,title}){return <button type="button" className={'inlineEdit '+className} onClick={onEdit} title={title}>{children}</button>}
function TaskRow({t,subject,toggle,updateTask,subjects=[]}){
 const [editing,setEditing]=useState(null);
 const [value,setValue]=useState('');
 const begin=(type,v)=>{setEditing(type);setValue(v??'')};
 const save=(type,v=value)=>{if(type==='date') updateTask(t,{due_date:v||''}); if(type==='minutes') updateTask(t,{estimated_minutes:Math.max(1,Number(v)||1)}); setEditing(null)};
 return <div className={'taskRow '+(t.status==='Done'?'taskCompleted':'')}><button className={t.status==='Done'?'check done':'check'} onClick={()=>toggle(t)} aria-label={t.status==='Done'?'Mark task incomplete':'Mark task complete'}>{t.status==='Done'&&<Check size={14}/>}</button><div className="taskInfo"><b>{t.title}</b><div>
 {editing==='subject'?<Dropdown value={subject?.name||'Unassigned'} onChange={name=>{const s=subjects.find(x=>x.name===name);updateTask(t,{subject_id:s?.id||null});setEditing(null)}} options={subjects.map(s=>s.name)} ariaLabel="Edit task subject" className="inlineDropdown"/>:<InlineEdit className="taskPillButton" title="Click to edit subject" onEdit={()=>begin('subject',subject?.name||'') }><span className="pill" style={{borderColor:subject?.color,color:subject?.color}}>{subject?.name||'Unassigned'}</span></InlineEdit>}
 {editing==='date'?<DateField value={value} onChange={next=>{save('date',next)}} label="Deadline" compact onCancel={()=>setEditing(null)}/>:<InlineEdit className="metaEdit" title="Click to edit deadline" onEdit={()=>begin('date',t.due_date||'')}><span>{t.due_date||'No deadline'}</span></InlineEdit>}
 {editing==='minutes'?<input autoFocus className="inlineField minutesEdit" type="number" min={1} value={value} onChange={e=>setValue(e.target.value)} onBlur={()=>save('minutes')} onKeyDown={e=>{if(e.key==='Enter')save('minutes');if(e.key==='Escape')setEditing(null)}}/>:<InlineEdit className="metaEdit" title="Click to edit estimated time" onEdit={()=>begin('minutes',t.estimated_minutes||1)}><span>{t.estimated_minutes||0}m</span></InlineEdit>}
 </div></div>
 {editing==='priority'?<Dropdown value={t.priority} onChange={priority=>{updateTask(t,{priority});setEditing(null)}} options={['Low','Medium','High','Urgent']} ariaLabel="Edit task priority" className="inlinePriority"/>:<InlineEdit className={'priority '+t.priority.toLowerCase()} title="Click to edit priority" onEdit={()=>begin('priority',t.priority)}>{t.priority}</InlineEdit>}
 </div>}
function Tasks({tasks,subjectMap,toggleTask,deleteTask,setModal,filter,setFilter}){const priorityFilter=['All','High','Urgent'].includes(filter)?filter:'All';const orderedTasks=[...tasks].sort((a,b)=>{const ad=a.status==='Done',bd=b.status==='Done';if(ad!==bd)return ad?1:-1;return (a.due_date||'9999-12-31').localeCompare(b.due_date||'9999-12-31')});return <section className="page"><div className="sectionTop"><div><span className="eyebrow">WORK QUEUE</span><h1>Tasks</h1><p>Break big goals into small, finishable moves.</p></div><button className="primary" onClick={()=>setModal('task')}><Plus size={18}/> New task</button></div><div className="filters"><div className="seg">{['All','Todo','In Progress','Done'].map(x=><button className={filter===x?'selected':''} onClick={()=>setFilter(x)} key={x}>{x}</button>)}</div><Dropdown value={priorityFilter} onChange={setFilter} options={['All','High','Urgent']} ariaLabel="Filter tasks by priority" className="priorityDropdown"/></div><div className="panel tablePanel">{orderedTasks.length?orderedTasks.map(t=><div className={'taskRow detailed '+(t.status==='Done'?'taskCompleted':'')} key={t.id}><button className={t.status==='Done'?'check done':'check'} onClick={()=>toggleTask(t)} aria-label={t.status==='Done'?'Mark task incomplete':'Mark task complete'}>{t.status==='Done'&&<Check size={14}/>}</button><div className="taskInfo"><b>{t.title}</b><div><span className="pill" style={{borderColor:subjectMap[t.subject_id]?.color,color:subjectMap[t.subject_id]?.color}}>{subjectMap[t.subject_id]?.name||'Unassigned'}</span>{(t.tags||[]).map(x=><span key={x}>#{x}</span>)}<span>{t.due_date||'No deadline'}</span></div>{t.notes&&<p className="taskNotesPreview">{t.notes}</p>}</div><Dropdown value={t.status||'Todo'} onChange={status=>changeTaskStatus(t,status)} options={['Todo','In Progress','Done']} ariaLabel={`Change status for ${t.title||'task'}`} className={'taskStatusDropdown status-'+(t.status||'Todo').toLowerCase().replace(/\s+/g,'-')}/><span className={'priority '+t.priority.toLowerCase()}>{t.priority}</span><div className="taskActions"><button type="button" className="iconbtn" onClick={()=>setModal({type:'task',task:t})} aria-label={`Edit ${t.title}`} title="Edit task"><Pencil size={15}/></button><button type="button" className="iconbtn dangerIcon" onClick={()=>deleteTask(t)} aria-label={`Delete ${t.title}`} title="Delete task"><Trash2 size={15}/></button></div></div>):<Empty text="No tasks yet. Add your first task."/>}</div></section>}
function Subjects({subjects,tasks,setModal,onSelect}){return <section className="page"><div className="sectionTop"><div><span className="eyebrow">YOUR ORGANIZATION</span><h1>Subjects</h1><p>Organize the areas of your life and keep the big picture in view.</p></div><button className="primary" onClick={()=>setModal('subject')}><Plus size={18}/> Add subject</button></div><div className="subjectGrid">{subjects.map(s=>{const total=tasks.filter(t=>t.subject_id===s.id).length,done=tasks.filter(t=>t.subject_id===s.id&&t.status==='Done').length;return <button className="subjectCard clickableSubject" key={s.id} onClick={()=>onSelect(s.id)}><div className="subjectAccent" style={{background:s.color}}/><div className="subjectTop"><div className="bigIcon" style={{background:s.color+'22',color:s.color}}><BookOpen size={22}/></div><span className="category">{s.category}</span></div><h3>{s.name}</h3><small>{s.code||'CUSTOM'} · {s.target_hours||0} target hours</small><div className="subjectProgress"><span>{done}/{total} tasks complete</span><b>{total?Math.round(done/total*100):0}%</b></div><div className="bar"><i style={{width:`${total?done/total*100:0}%`,background:s.color}}/></div><span className="subjectOpenHint">Open subject <ArrowUpRight size={13}/></span></button>})}<button className="addCard" onClick={()=>setModal('subject')}><Plus/> <b>Add another subject</b><span>Work, personal, learning, or anything else</span></button></div></section>}

function SubjectDetail({subject,tasks,setTasks,subjects,setSubjects,setSelectedSubject,setModal,cloudReady,user,deleteTask,deleteSubject,onEditSubject,toggleTask}){
 const [section,setSection]=useState('tasks');
 const [description,setDescription]=useState(subject?.notes||'');
 const [pdfs,setPdfs]=useState([]);
 const [files,setFiles]=useState([]);
 const [syllabus,setSyllabus]=useState([]);
 const [fileBusy,setFileBusy]=useState(false);
 const [chapterDraft,setChapterDraft]=useState('');
 const [topicDraft,setTopicDraft]=useState({});
 const [editingTopic,setEditingTopic]=useState(null);
 const [editingChapter,setEditingChapter]=useState(null);
 const fileInputRef=useRef(null);
 const syllabusFileInputRef=useRef(null);
 useEffect(()=>{setDescription(subject?.notes||'');setSection('tasks');setChapterDraft('');setTopicDraft({});setEditingTopic(null);setEditingChapter(null);loadPdfs();loadFiles();loadSyllabus()},[subject?.id]);
 async function loadPdfs(){if(!subject)return;try{setPdfs(await listSubjectPdfs(subject.id))}catch{setPdfs([])}}
 async function loadFiles(){if(!subject)return;try{setFiles(await listSubjectFiles(subject.id))}catch{setFiles([])}}
 async function loadSyllabus(){if(!subject)return;try{setSyllabus(await loadSubjectSyllabus(subject.id))}catch{setSyllabus([])}}
 if(!subject) return null;
 const subjectTasks=tasks.filter(t=>t.subject_id===subject.id).sort((a,b)=>{const ad=a.status==='Done',bd=b.status==='Done';if(ad!==bd)return ad?1:-1;return (a.due_date||'9999').localeCompare(b.due_date||'9999')});
 const completed=subjectTasks.filter(t=>t.status==='Done').length;
 const progress=subjectTasks.length?Math.round(completed/subjectTasks.length*100):0;
 const topicCount=syllabus.reduce((n,ch)=>n+(ch.items?.length||0),0),doneTopics=syllabus.reduce((n,ch)=>n+(ch.items||[]).filter(x=>x.done).length,0);
 async function persistSyllabus(next){setSyllabus(next);try{await saveSubjectSyllabus(subject.id,next)}catch(err){alert(`Could not save syllabus. ${err?.message||''}`)}}
 function addChapter(){const title=chapterDraft.trim();if(!title)return;persistSyllabus([...syllabus,{id:uid(),title,items:[]}]);setChapterDraft('')}
 function addTopic(chapterId){const title=String(topicDraft[chapterId]||'').trim();if(!title)return;persistSyllabus(syllabus.map(ch=>ch.id===chapterId?{...ch,items:[...(ch.items||[]),{id:uid(),title,done:false}]}:ch));setTopicDraft(v=>({...v,[chapterId]:''}))}
 function toggleTopic(chapterId,itemId){persistSyllabus(syllabus.map(ch=>ch.id===chapterId?{...ch,items:(ch.items||[]).map(x=>x.id===itemId?{...x,done:!x.done}:x)}:ch))}
 function deleteTopic(chapterId,itemId){if(!confirm('Delete this subtopic?'))return;persistSyllabus(syllabus.map(ch=>ch.id===chapterId?{...ch,items:(ch.items||[]).filter(x=>x.id!==itemId)}:ch))}
 function deleteChapter(chapterId){if(!confirm('Delete this chapter and all its subtopics?'))return;persistSyllabus(syllabus.filter(ch=>ch.id!==chapterId))}
function saveChapterEdit(chapterId,value){const title=value.trim();if(!title)return;persistSyllabus(syllabus.map(ch=>ch.id===chapterId?{...ch,title}:ch));setEditingChapter(null)}
 function saveTopicEdit(chapterId,itemId,value){const title=value.trim();if(!title)return;persistSyllabus(syllabus.map(ch=>ch.id===chapterId?{...ch,items:(ch.items||[]).map(x=>x.id===itemId?{...x,title}:x)}:ch));setEditingTopic(null)}
 async function uploadFiles(e){const selected=[...(e.target.files||[])];if(!selected.length)return;setFileBusy(true);try{for(const file of selected)await saveSubjectFile(subject.id,file);await loadFiles()}catch(err){alert(`Could not add file${selected.length>1?'s':''}. ${err?.message||''}`)}finally{setFileBusy(false);e.target.value=''}}
 async function openFile(id,download=false){const row=await readSubjectFile(id);if(!row?.blob)return;const url=URL.createObjectURL(row.blob);if(download){const a=document.createElement('a');a.href=url;a.download=row.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}else{window.open(url,'_blank','noopener,noreferrer');setTimeout(()=>URL.revokeObjectURL(url),60000)}}
 async function removeFile(id){if(!confirm('Remove this file from the subject?'))return;await deleteSubjectFile(id);await loadFiles()}
 async function uploadSyllabusFiles(e){const selected=[...(e.target.files||[])];if(!selected.length)return;setFileBusy(true);try{for(const file of selected)await saveSubjectFile(subject.id,file);await loadFiles();setSection('resources')}catch(err){alert(`Could not add syllabus file. ${err?.message||''}`)}finally{setFileBusy(false);e.target.value=''}}
 async function toggle(t){if(toggleTask){await toggleTask(t);return}const status=t.status==='Done'?'Todo':'Done';if(cloudReady&&user)await supabase.from('tasks').update({status,completed_at:status==='Done'?new Date().toISOString():null}).eq('id',t.id);setTasks(x=>x.map(a=>a.id===t.id?{...a,status}:a))}
 async function saveDescription(){if(cloudReady&&user)await supabase.from('subjects').update({notes:description}).eq('id',subject.id);setSubjects(x=>x.map(s=>s.id===subject.id?{...s,notes:description}:s));setSection('description')}
 return <section className="page subjectDetailPage">
   <button className="backBtn" onClick={()=>setSelectedSubject(null)}>← Back to subjects</button>
   <div className="detailHero"><div><span className="eyebrow">SUBJECT</span><div className="detailTitle"><div className="bigIcon" style={{background:subject.color+'22',color:subject.color}}><BookOpen size={25}/></div><div><h1>{subject.name}</h1><p>{subject.category} · {subject.code||'CUSTOM'} · {subject.target_hours||0} target hours</p></div></div></div><div className="detailHeroActions"><div className="detailProgress"><span>Progress</span><b>{progress}%</b><div className="bar"><i style={{width:`${progress}%`,background:subject.color}}/></div><small>{completed}/{subjectTasks.length} tasks complete</small></div><div className="subjectActionStack"><button type="button" className="secondary editSubjectAction" onClick={()=>onEditSubject?.(subject)}><Pencil size={15}/> Edit subject <ArrowUpRight size={14}/></button><button type="button" className="secondary dangerAction" onClick={()=>deleteSubject(subject)}><Trash2 size={15}/> Delete subject</button></div></div></div>
   <div className="detailTabs">
    <button className={section==='tasks'?'selected':''} onClick={()=>setSection('tasks')}><CheckSquare size={16}/> Tasks <span>{subjectTasks.length}</span></button>
    <button className={section==='syllabus'?'selected':''} onClick={()=>setSection('syllabus')}><BookOpen size={16}/> Syllabus <span>{topicCount}</span></button>
    <button className={section==='description'?'selected':''} onClick={()=>setSection('description')}><FileText size={16}/> Description</button>
    <button className={section==='resources'?'selected':''} onClick={()=>setSection('resources')}><FilePlus2 size={16}/> Resources <span>{files.length+pdfs.length}</span></button>
   </div>
   {section==='tasks'&&<div className="panel subjectTaskPanel">{subjectTasks.length?subjectTasks.map(t=><div className={'taskRow detailed '+(t.status==='Done'?'taskCompleted':'')} key={t.id}><button className={t.status==='Done'?'check done':'check'} onClick={()=>toggle(t)} aria-label={t.status==='Done'?'Mark task incomplete':'Mark task complete'}>{t.status==='Done'&&<Check size={14}/>}</button><div className="taskInfo"><b>{t.title}</b><div>{(t.tags||[]).map(x=><span key={x}>#{x}</span>)}<span>{t.due_date||'No deadline'}</span>{formatTaskTimeRange(t)&&<span>{formatTaskTimeRange(t)}</span>}<span>{t.estimated_minutes||0} min</span></div>{t.notes&&<p className="taskNotesPreview">{t.notes}</p>}</div><span className={'priority '+t.priority.toLowerCase()}>{t.priority}</span><div className="taskActions"><button type="button" className="iconbtn" onClick={()=>setModal({type:'task',task:t})} aria-label={`Edit ${t.title}`} title="Edit task"><Pencil size={15}/></button><button type="button" className="iconbtn dangerIcon" onClick={()=>deleteTask(t)} aria-label={`Delete ${t.title}`} title="Delete task"><Trash2 size={15}/></button></div></div>):<Empty text="No tasks in this subject yet. Add a task and assign it here."/>}</div>}
   {section==='syllabus'&&<div className="panel syllabusPanel"><div className="panelHead"><div><span className="eyebrow">SUBJECT SYLLABUS</span><h2>Chapters & subtopics</h2><p className="pdfIntro">Build the syllabus manually, track every subtopic, or attach a syllabus file for reference.</p></div><div className="syllabusHeaderActions"><input ref={syllabusFileInputRef} className="hiddenFileInput" type="file" accept=".pdf,.doc,.docx,.csv,.txt,.md,.json,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.css" multiple onChange={uploadSyllabusFiles}/><button className="secondary" onClick={()=>syllabusFileInputRef.current?.click()} disabled={fileBusy}><Upload size={15}/> Add syllabus file</button></div></div><div className="syllabusSummary"><span><b>{syllabus.length}</b> chapters</span><span><b>{topicCount}</b> subtopics</span><span><b>{doneTopics}</b> completed</span></div><div className="chapterAddRow"><input value={chapterDraft} onChange={e=>setChapterDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addChapter()}} placeholder="Add a chapter, e.g. Chapter 1 — Introduction"/><button className="primary" onClick={addChapter} disabled={!chapterDraft.trim()}><Plus size={15}/> Add chapter</button></div>{syllabus.length?<div className="syllabusList">{syllabus.map((ch,index)=><div className="syllabusChapter" key={ch.id}><div className="syllabusChapterHead"><div className="syllabusChapterTitle"> <span className="chapterNumber">CHAPTER {index+1}</span>{editingChapter?.id===ch.id?<input autoFocus className="syllabusChapterEdit" value={editingChapter.value} onChange={e=>setEditingChapter({...editingChapter,value:e.target.value})} onKeyDown={e=>{if(e.key==='Enter')saveChapterEdit(ch.id,editingChapter.value);if(e.key==='Escape')setEditingChapter(null)}} onBlur={()=>saveChapterEdit(ch.id,editingChapter.value)}/>:<h3>{ch.title}</h3>}</div><div className="syllabusChapterActions"><button className="iconbtn" onClick={()=>setEditingChapter({id:ch.id,value:ch.title})} title="Edit chapter"><Pencil size={14}/></button><button className="iconbtn dangerIcon" onClick={()=>deleteChapter(ch.id)} title="Delete chapter"><Trash2 size={15}/></button></div></div><div className="syllabusTopics">{(ch.items||[]).map(item=><div className={'syllabusTopic '+(item.done?'syllabusTopicDone':'')} key={item.id}><button className={'check '+(item.done?'done':'')} onClick={()=>toggleTopic(ch.id,item.id)} aria-label={item.done?'Mark subtopic incomplete':'Mark subtopic complete'}>{item.done&&<Check size={13}/>}</button>{editingTopic?.chapterId===ch.id&&editingTopic?.itemId===item.id?<input autoFocus className="syllabusTopicEdit" value={editingTopic.value} onChange={e=>setEditingTopic({...editingTopic,value:e.target.value})} onKeyDown={e=>{if(e.key==='Enter')saveTopicEdit(ch.id,item.id,editingTopic.value);if(e.key==='Escape')setEditingTopic(null)}} onBlur={()=>saveTopicEdit(ch.id,item.id,editingTopic.value)}/>:<span className="syllabusTopicTitle" onDoubleClick={()=>setEditingTopic({chapterId:ch.id,itemId:item.id,value:item.title})}>{item.title}</span>}<button className="iconbtn" onClick={()=>setEditingTopic({chapterId:ch.id,itemId:item.id,value:item.title})} title="Edit subtopic"><Pencil size={13}/></button><button className="iconbtn dangerIcon" onClick={()=>deleteTopic(ch.id,item.id)} title="Delete subtopic"><Trash2 size={13}/></button></div>)}{!(ch.items||[]).length&&<div className="syllabusEmpty">No subtopics yet. Add the first one below.</div>}</div><div className="topicAddRow"><input value={topicDraft[ch.id]||''} onChange={e=>setTopicDraft(v=>({...v,[ch.id]:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter')addTopic(ch.id)}} placeholder="Add a subtopic"/><button className="secondary" onClick={()=>addTopic(ch.id)} disabled={!String(topicDraft[ch.id]||'').trim()}><Plus size={14}/> Add subtopic</button></div></div>)}</div>:<div className="syllabusEmpty large"><BookOpen size={22}/><b>No syllabus added yet</b><span>Create chapters manually or add a syllabus file.</span></div>}<div className="pdfStorageHint"><ShieldCheck size={15}/><span>Syllabus progress is stored in this browser for this device. You can edit it anytime.</span></div></div>}
   {section==='description'&&<div className="panel subjectNotesPanel"><div className="panelHead"><div><span className="eyebrow">SUBJECT DESCRIPTION</span><h2>Description</h2></div><span className="notesSaved">A quick overview that stays with this subject</span></div><textarea className="subjectNotes" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe this subject, project, goal, or anything useful to remember..."/><div className="notesActions"><button className="secondary" onClick={()=>setDescription(subject.notes||'')}>Reset</button><button className="primary" onClick={saveDescription}>Save description</button></div></div>}
   {section==='resources'&&<div className="panel subjectNotesPanel pdfPanel"><div className="panelHead"><div><span className="eyebrow">SUBJECT RESOURCES</span><h2>Files & notes</h2><p className="pdfIntro">Keep your syllabus, lecture notes, PDFs, Word files, images, spreadsheets, code, and other study material together.</p></div><div><input ref={fileInputRef} className="hiddenFileInput" type="file" accept=".pdf,.doc,.docx,.csv,.txt,.md,.json,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.css" multiple onChange={uploadFiles}/><button className="primary" onClick={()=>fileInputRef.current?.click()} disabled={fileBusy}><Upload size={16}/>{fileBusy?'Adding…':'Add files'}</button></div></div>{files.length||pdfs.length?<div className="pdfList">{[...files,...pdfs.map(x=>({...x,legacyPdf:true}))].map(file=><div className="pdfCard" key={(file.legacyPdf?'pdf-':'file-')+file.id}><div className="pdfIcon"><File size={20}/></div><div className="pdfInfo"><b title={file.name}>{file.name}</b><span>{formatBytes(file.size)} · Added {new Date(file.created_at).toLocaleDateString()}</span></div><div className="pdfActions"><button className="iconbtn" onClick={()=>file.legacyPdf?openPdf(file.id):openFile(file.id)} aria-label={`Open ${file.name}`} title="Open"><ExternalLink size={16}/></button><button className="iconbtn" onClick={()=>file.legacyPdf?openPdf(file.id,true):openFile(file.id,true)} aria-label={`Download ${file.name}`} title="Download"><Download size={16}/></button><button className="iconbtn dangerIcon" onClick={()=>file.legacyPdf?removePdf(file.id):removeFile(file.id)} aria-label={`Remove ${file.name}`} title="Remove"><Trash2 size={16}/></button></div></div>)}</div>:<div className="pdfEmpty"><div className="pdfEmptyIcon"><FilePlus2 size={24}/></div><b>No resources yet</b><span>Add PDFs, Word documents, CSVs, images, code files, or other study resources.</span><button className="secondary" onClick={()=>fileInputRef.current?.click()}><Upload size={15}/> Add your first file</button></div>}<div className="pdfStorageHint"><ShieldCheck size={15}/><span>Files are stored securely in this browser for this device. Your subject and cloud data remain separate.</span></div></div>}
 </section>
}
function taskOccursOnDate(task,dateKey){const start=task.start_date||task.due_date,end=task.end_date||task.due_date;if(!start&&!end)return false;const a=fromDateKey(start||end),b=fromDateKey(end||start),d=fromDateKey(dateKey);return d>=a&&d<=b}
function Calendar({tasks,subjectMap,setModal}){
 const [view,setView]=useState('today');
 const [selectedDate,setSelectedDate]=useState(localDateKey(new Date()));
 const [cursor,setCursor]=useState(()=>{const d=new Date();d.setDate(1);d.setHours(0,0,0,0);return d});
 const today=localDateKey(new Date());
 const selectDate=(ds)=>setSelectedDate(ds);
 const addForDate=(ds)=>{selectDate(ds);setModal({type:'task',dueDate:ds});};
 const dayTasks=tasks.filter(t=>taskOccursOnDate(t,selectedDate));
 const selectedDateObj=fromDateKey(selectedDate);
 const titleDate=selectedDateObj.toLocaleDateString('en',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
 const shift=(n)=>{const d=new Date(cursor); if(view==='month') d.setMonth(d.getMonth()+n); else if(view==='year') d.setFullYear(d.getFullYear()+n); setCursor(d)};
 const resetToday=()=>{const d=new Date();d.setHours(0,0,0,0);setSelectedDate(localDateKey(d));setCursor(()=>{const x=new Date(d);x.setDate(1);return x});};
 const monthLabel=cursor.toLocaleDateString('en',{month:'long',year:'numeric'});
 const yearLabel=String(cursor.getFullYear());
 const renderTask=function(t){const done=t.status==='Done';const timeRange=formatTaskTimeRange(t);return <div className={'event '+(done?'eventDone':'')} style={{borderLeftColor:subjectMap[t.subject_id]?.color||'#8b5cf6'}} key={t.id}><div className="eventTitle">{done?<Check size={11}/>:null}{t.title||'Untitled task'}</div><small>{timeRange?`${timeRange} · `:''}{subjectMap[t.subject_id]?.name||'Unassigned'} · {t.priority}</small></div>};
 const dayCell=(d,opts={})=>{const ds=localDateKey(d);const list=tasks.filter(t=>taskOccursOnDate(t,ds));const isToday=ds===today;const isSelected=ds===selectedDate;const isWeekend=[0,6].includes(d.getDay());return <button type="button" className={'day calendarDayBtn '+(isToday?'today ':'')+(isSelected?'selectedDay ':'')+(isWeekend?'weekend ':'')+(opts.muted?'mutedDay':'')} onClick={()=>selectDate(ds)} key={ds}><div className="dayHead"><div><b>{d.toLocaleDateString('en',{weekday:'short'})}</b><small>{d.toLocaleDateString('en',{month:'short'})}</small></div><strong>{d.getDate()}</strong></div><div className="dayEvents">{list.slice(0,4).map(renderTask)}{list.length>4&&<div className="moreEvents">+{list.length-4} more</div>}{!list.length&&<div className="dayEmpty">No tasks</div>}</div><span className="dayAdd" onClick={(e)=>{e.stopPropagation();addForDate(ds)}}><Plus size={12}/> Add</span></button>};
 const renderToday=()=>{const d=selectedDateObj;return <div className="calendarSingle"><button type="button" className={'largeDay '+(selectedDate===today?'today':'')} onClick={()=>selectDate(selectedDate)}><div><span className="eyebrow">SELECTED DAY</span><h3>{d.toLocaleDateString('en',{weekday:'long'})}</h3><b>{d.toLocaleDateString('en',{month:'long',day:'numeric',year:'numeric'})}</b></div><div className="largeDayCount">{dayTasks.length}<small>{dayTasks.length===1?'task':'tasks'}</small></div></button></div>};
 const renderThree=()=>{const base=fromDateKey(today);base.setDate(base.getDate()-1);return <div className="threeGrid">{[0,1,2].map(i=>{const d=new Date(base);d.setDate(base.getDate()+i);return dayCell(d)})}</div>};
 const renderMonth=()=>{const y=cursor.getFullYear(),m=cursor.getMonth();const first=new Date(y,m,1);const start=new Date(y,m,1-first.getDay());const cells=Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d});return <div className="monthWrap"><div className="weekLabels">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=><span key={x}>{x}</span>)}</div><div className="monthGrid">{cells.map(d=>dayCell(d,{muted:d.getMonth()!==m}))}</div></div>};
 const renderYear=()=>{const y=cursor.getFullYear();return <div className="yearGrid">{Array.from({length:12},(_,m)=>{const first=new Date(y,m,1);const start=new Date(y,m,1-first.getDay());const cells=Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d});return <div className="miniMonth" key={m}><div className="miniMonthTitle"><b>{first.toLocaleDateString('en',{month:'long'})}</b><span>{cells.filter(d=>localDateKey(d)===today).length?'Today':''}</span></div><div className="miniWeekLabels">{['S','M','T','W','T','F','S'].map((x,i)=><span key={i}>{x}</span>)}</div><div className="miniMonthGrid">{cells.map(d=>{const ds=localDateKey(d);const list=tasks.filter(t=>taskOccursOnDate(t,ds));const muted=d.getMonth()!==m;const isToday=ds===today;const isSelected=ds===selectedDate;return <button type="button" key={ds} className={'miniDate '+(muted?'muted ':'')+(isToday?'today ':'')+(isSelected?'selected':'')} onClick={()=>selectDate(ds)} title={list.length?`${list.length} task${list.length>1?'s':''}`:'No tasks'}>{d.getDate()}{list.length?<i/>:null}</button>})}</div></div>})}</div>};
 const views={today:renderToday,three:renderThree,month:renderMonth,year:renderYear};
 return <section className="page"><div className="sectionTop"><div><span className="eyebrow">PLANNING VIEW</span><h1>Calendar</h1><p>Pick a view, select any date, and see or add tasks for that day.</p></div><div className="calendarControls"><div className="calendarTabs">{[['today','Today'],['three','3 Days'],['month','Month'],['year','Year']].map(([id,label])=><button key={id} className={view===id?'active':''} onClick={()=>{setView(id);if(id==='today')resetToday();}}>{label}</button>)}</div><div className="calendarNav"><button className="secondary" onClick={resetToday}>Today</button>{view!=='today'&&view!=='three'&&<><button className="iconbtn navArrow" onClick={()=>shift(-1)} aria-label="Previous">‹</button><span>{view==='month'?monthLabel:yearLabel}</span><button className="iconbtn navArrow" onClick={()=>shift(1)} aria-label="Next">›</button></>}</div></div></div><div className="calendarLegend"><span><i className="legendDot"/>Tasks</span><span><i className="legendRing"/>Today</span><span>{tasks.length} task{tasks.length===1?'':'s'} scheduled</span></div>{views[view]()}<div className="selectedDayPanel panel"><div className="panelHead"><div><span className="eyebrow">SELECTED DATE</span><h2>{titleDate}</h2></div><button className="primary" onClick={()=>addForDate(selectedDate)}><Plus size={16}/> Add task</button></div>{dayTasks.length?<div className="calendarTaskList">{dayTasks.map(renderTask)}</div>:<div className="calendarNoTasks">No tasks scheduled for this date yet.<button className="textBtn" onClick={()=>addForDate(selectedDate)}>Create the first task <ArrowUpRight size={14}/></button></div>}</div></section>
}

function fromDateKey(key){const [y,m,d]=key.split('-').map(Number);const x=new Date(y,m-1,d);x.setHours(0,0,0,0);return x}
function formatTaskTimeRange(task){if(!task?.start_time&&!task?.end_time)return '';const fmt=v=>{if(!v)return '';const [h,m]=v.split(':').map(Number);const d=new Date(2000,0,1,h,m);return d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})};return task.start_time&&task.end_time?`${fmt(task.start_time)} – ${fmt(task.end_time)}`:fmt(task.start_time||task.end_time)}
function Timetable({tasks,onImport,onCancel,onEdit,onEditSeries,onDeleteSeries}){
 const now=localDateKey(new Date());
 const classes=tasks.filter(t=>t.timetable_source&&!t.timetable_cancelled&&t.due_date>=now).sort((a,b)=>`${a.due_date} ${a.start_time||''}`.localeCompare(`${b.due_date} ${b.start_time||''}`));
 const cancelled=tasks.filter(t=>t.timetable_source&&t.timetable_cancelled).sort((a,b)=>(b.due_date||'').localeCompare(a.due_date||'')).slice(0,8);
 const grouped=classes.slice(0,24).reduce((acc,t)=>{(acc[t.due_date] ||= []).push(t);return acc},{});
 const next=classes[0];
 const prettyTime=v=>{if(!v)return '';const [h,m]=v.split(':').map(Number);const d=new Date(2000,0,1,h,m);return d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})};
 const prettyDate=v=>fromDateKey(v).toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'});
 return <section className="page timetablePage"><div className="sectionTop"><div><span className="eyebrow">WEEKLY CLASS SCHEDULE</span><h1>Timetable</h1><p>Import your class schedule once, then manage each occurrence as it happens.</p></div><button className="primary" onClick={onImport}><Upload size={16}/> Import timetable</button></div>
  <div className="timetableHero"><div><span className="eyebrow">NEXT UP</span><h2>{next?.title||'No upcoming classes'}</h2>{next?<p>{prettyDate(next.due_date)} · {prettyTime(next.start_time)} – {prettyTime(next.end_time)}{next.timetable_room?` · ${next.timetable_room}`:''}</p>:<p>Upload a timetable image or CSV to populate your schedule.</p>}</div><div className="timetableStats"><div><strong>{classes.length}</strong><span>upcoming</span></div><div><strong>{cancelled.length}</strong><span>cancelled</span></div></div></div>
  {classes.length?<div className="timetableGroups">{Object.entries(grouped).map(([date,list])=><div className="timetableDay" key={date}><div className="timetableDayHead"><div><span className="eyebrow">{fromDateKey(date).toLocaleDateString(undefined,{weekday:'short'}).toUpperCase()}</span><b>{prettyDate(date)}</b></div><span>{list.length} class{list.length===1?'':'es'}</span></div><div className="timetableList">{list.map(t=><div className="timetableClass" key={t.id}><div className="classTime"><b>{prettyTime(t.start_time)}</b><span>{prettyTime(t.end_time)}</span></div><div className="classLine"/><div className="classInfo"><b>{t.title||'Untitled class'}</b><small>{t.timetable_room||'Class'}</small></div><div className="timetableActions"><button type="button" className="iconbtn" onClick={()=>onEdit?.(t)} title="Edit this occurrence" aria-label={`Edit ${t.title||'class'}`}><Pencil size={14}/></button><button type="button" className="iconbtn seriesEditIcon" onClick={()=>onEditSeries?.(t)} title="Edit future occurrences" aria-label={`Edit future ${t.title||'class'} occurrences`}><SlidersHorizontal size={14}/></button><button type="button" className="iconbtn dangerIcon seriesDeleteIcon" onClick={()=>onDeleteSeries?.(t)} title="Delete all occurrences of this class" aria-label={`Delete all ${t.title||'class'} occurrences`}><Trash2 size={14}/></button><button type="button" className="secondary cancelClassBtn" onClick={()=>onCancel(t)}><X size={14}/><span>Cancel</span></button></div></div>)}</div></div>)}</div>:<div className="panel timetableEmpty"><CalendarClock size={24}/><div><b>Your timetable is empty</b><p>Upload a timetable and ORBIT will generate recurring class occurrences for the selected term.</p></div><button className="secondary" onClick={onImport}><Upload size={15}/> Import schedule</button></div>}
  {cancelled.length>0&&<div className="panel cancelledClasses"><div className="panelHead"><div><span className="eyebrow">LAST-MINUTE CHANGES</span><h2>Cancelled classes</h2></div><span className="notesSaved">Cancellation only affects that occurrence.</span></div>{cancelled.map(t=><div className="cancelledClass" key={t.id}><div><b>{t.title}</b><span>{prettyDate(t.due_date)} · {prettyTime(t.start_time)} – {prettyTime(t.end_time)}</span></div><button className="secondary" onClick={()=>onCancel(t)}>Restore</button></div>)}</div>}
 </section>
}

function groupTimetableEntries(rows){
 const groups=[]; const map=new Map();
 for(const row of rows||[]){
  const key=`${row.title||''}|${row.room||''}|${row.start_date||''}|${row.end_date||''}`.toLowerCase();
  let group=map.get(key);
  if(!group){group={title:row.title||'',room:row.room||'',start_date:row.start_date||'',end_date:row.end_date||'',slots:[]};map.set(key,group);groups.push(group)}
  if(row.weekday!=null&&row.start_time&&row.end_time)group.slots.push({weekday:row.weekday,start_time:row.start_time,end_time:row.end_time});
 }
 return groups;
}

function TimetableSeriesEditModal({task,onClose,onSave}){
 const today=localDateKey(new Date());
 const [v,setV]=useState({title:task.title||'',room:task.timetable_room||'',effective_date:today,start_time:task.start_time||'',end_time:task.end_time||''});
 const [saving,setSaving]=useState(false);
 const submit=async()=>{if(!v.title.trim()){alert('Class name is required.');return}if(!v.start_time||!v.end_time){alert('Select both start and end time.');return}setSaving(true);try{await onSave(task,v)}finally{setSaving(false)}};
 return <Modal title="Edit class schedule" onClose={onClose} className="timetableSeriesModal">
  <div className="seriesIntro"><span className="seriesIcon"><SlidersHorizontal size={17}/></span><div><b>Update future classes together</b><p>Change the recurring class once instead of editing every occurrence individually.</p></div></div>
  <div className="seriesFields">
   <label className="seriesWide"><span>Class / subject</span><input value={v.title} onChange={e=>setV(x=>({...x,title:e.target.value}))} placeholder="Class / subject"/></label>
   <label><span>Room</span><input value={v.room} onChange={e=>setV(x=>({...x,room:e.target.value}))} placeholder="Optional"/></label>
   <label><span>Apply changes from</span><input type="date" value={v.effective_date} min={today} onChange={e=>setV(x=>({...x,effective_date:e.target.value}))}/></label>
   <div className="seriesTime"><span>New time</span><div><TimeField value={v.start_time} onChange={x=>setV(y=>({...y,start_time:x}))} label="Start"/><span className="seriesTimeArrow">→</span><TimeField value={v.end_time} onChange={x=>setV(y=>({...y,end_time:x}))} label="End"/></div></div>
  </div>
  <div className="seriesNote"><SlidersHorizontal size={14}/><span>Past occurrences stay unchanged. Future occurrences from the selected date are updated together and linked Google Calendar events are refreshed.</span></div>
  <div className="seriesActions"><button type="button" className="secondary seriesCancelBtn" onClick={onClose}><X size={15}/><span>Cancel</span></button><button type="button" className="primary seriesSaveBtn" onClick={submit} disabled={saving}><Check size={15}/><span>{saving?'Updating…':'Update future classes'}</span></button></div>
 </Modal>
}

function TimetableImportModal({onClose,onImport}){
 const today=localDateKey(new Date()); const endDefault=(()=>{const d=fromDateKey(today);d.setDate(d.getDate()+TIMETABLE_WEEKS*7);return localDateKey(d)})();
 const [entries,setEntries]=useState([]); const [startDate,setStartDate]=useState(today); const [endDate,setEndDate]=useState(endDefault); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(''); const [ocrText,setOcrText]=useState(''); const [dragging,setDragging]=useState(false);
 const update=(i,key,value)=>setEntries(xs=>xs.map((x,n)=>n===i?{...x,[key]:value}:x));
 const updateSlot=(i,si,key,value)=>setEntries(xs=>xs.map((x,n)=>n!==i?x:{...x,slots:x.slots.map((slot,j)=>j===si?{...slot,[key]:value}:slot)}));
 const addSlot=i=>setEntries(xs=>xs.map((x,n)=>n===i?{...x,slots:[...x.slots,{weekday:1,start_time:'09:00',end_time:'10:00'}]}:x));
 const removeSlot=(i,si)=>setEntries(xs=>xs.map((x,n)=>n===i?{...x,slots:x.slots.filter((_,j)=>j!==si)}:x));
 const addRow=()=>setEntries(xs=>[...xs,{title:'New class',room:'',start_date:startDate,end_date:endDate,slots:[{weekday:1,start_time:'09:00',end_time:'10:00'}],source:'manual'}]);
 const removeRow=i=>setEntries(xs=>xs.filter((_,n)=>n!==i));
 const processFile=async file=>{if(!file)return;setBusy(true);setMessage('');try{
   const lower=file.name.toLowerCase(); let parsed=[];
   if(lower.endsWith('.csv')||file.type==='text/csv'){
    const text=await file.text(); parsed=parseTimetableCsv(text).map(x=>({...x,start_date:startDate,end_date:endDate}));setOcrText(text);setMessage(parsed.length?`Detected ${parsed.length} schedule row${parsed.length===1?'':'s'}. Review before importing.`:'No rows matched. Check the CSV format.');
   }else{
    const T=await loadTesseract();let text='';
    if(lower.endsWith('.pdf')||file.type==='application/pdf'){const result=await ocrPdfFile(file,T);text=result.text;parsed=result.rows;setMessage(parsed.length?`Detected ${parsed.length} possible class${parsed.length===1?'':'es'} from the PDF. Review and remove anything that does not belong to you.`:'No classes were confidently detected from the PDF. Try a clearer file or add classes manually.')} 
    else{const result=await recognizeTimetableImage(file,T);text=result.text;parsed=result.rows;setMessage(parsed.length?`Detected ${parsed.length} possible class${parsed.length===1?'':'es'}. Review and remove anything that does not belong to you.`:'No classes were confidently detected. Try a clearer scan or add classes manually.')}
    parsed=parsed.map(x=>({...x,start_date:startDate,end_date:endDate}));setOcrText(text);
   }
   setEntries(groupTimetableEntries(parsed));
  }catch(err){setMessage(err?.message||'Could not read that timetable file.')}finally{setBusy(false)}};
 const fileChange=e=>{const file=e.target.files?.[0];processFile(file);e.target.value=''};
 const drop=e=>{e.preventDefault();setDragging(false);processFile(e.dataTransfer.files?.[0])};
 const submit=()=>{
  if(!entries.length){setMessage('Add at least one class before importing.');return}
  if(!startDate||!endDate||startDate>endDate){setMessage('Choose a valid overall schedule range.');return}
  const clean=[];
  for(const entry of entries){
   if(!entry.title?.trim()){setMessage('Every class needs a name.');return}
   const sd=entry.start_date||startDate,ed=entry.end_date||endDate;
   if(!sd||!ed||sd>ed){setMessage(`Check the date range for “${entry.title}”.`);return}
   if(!entry.slots?.length){setMessage(`Add at least one day/time for “${entry.title}”.`);return}
   for(const slot of entry.slots){if(slot.weekday==null||!slot.start_time||!slot.end_time){setMessage(`Complete every day and time for “${entry.title}”.`);return}clean.push({...entry,weekday:Number(slot.weekday),start_time:slot.start_time,end_time:slot.end_time,start_date:sd,end_date:ed})}
  }
  onImport(clean,startDate,endDate)
 };
 return <Modal title="Import timetable" onClose={onClose} className="timetableImportModal">
  <div className="timetableUpload">
   <input id="timetable-file" className="hiddenFileInput" type="file" accept="image/png,image/jpeg,image/webp,application/pdf,.csv,text/csv" onChange={fileChange}/>
   <label htmlFor="timetable-file" className={'uploadDrop '+(dragging?'isDragging':'')} onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragEnter={e=>{e.preventDefault();setDragging(true)}} onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setDragging(false)}} onDrop={drop}>
    <span className="uploadIcon"><Upload size={22}/></span><span className="uploadCopy"><b>{busy?'Reading timetable…':'Drop your timetable here'}</b><small>or choose a file · PNG, JPG, WEBP, PDF, CSV</small></span><span className="uploadAction">Choose file</span>
   </label>
  </div>
  <div className="termGrid"><label>Overall schedule starts<input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/></label><label>Overall schedule ends<input type="date" value={endDate} min={startDate} onChange={e=>setEndDate(e.target.value)}/></label></div>
  {message&&<div className="importMessage">{message}</div>}
  <div className="importHeader"><div><span className="eyebrow">SCHEDULE ENTRIES</span><b>{entries.length} class{entries.length===1?'':'es'}</b></div><button type="button" className="secondary addClassBtn" onClick={addRow}><Plus size={14}/> Add class</button></div>
  {entries.length?<div className="importRows">{entries.map((e,i)=><div className="importCard" key={i}>
    <div className="importCardTop"><div className="importCardTitle"><span className="classIndex">{String(i+1).padStart(2,'0')}</span><div><input className="classTitleInput" value={e.title||''} onChange={x=>update(i,'title',x.target.value)} placeholder="Class / subject"/><input className="classRoomInput" value={e.room||''} onChange={x=>update(i,'room',x.target.value)} placeholder="Room (optional)"/></div></div><button type="button" className="iconbtn dangerIcon" onClick={()=>removeRow(i)} title="Remove class"><Trash2 size={15}/></button></div>
    <div className="importSlots">{(e.slots||[]).map((slot,si)=><div className="importSlot" key={si}><div className="slotDay"><Dropdown value={WEEKDAYS[slot.weekday]||'Monday'} onChange={name=>updateSlot(i,si,'weekday',WEEKDAYS.indexOf(name))} options={WEEKDAYS} ariaLabel={`Day ${si+1} for ${e.title||'class'}`} className="timetableDayDropdown"/></div><TimeField value={slot.start_time||''} onChange={v=>updateSlot(i,si,'start_time',v)} label="Start"/><TimeField value={slot.end_time||''} onChange={v=>updateSlot(i,si,'end_time',v)} label="End"/><button type="button" className="iconbtn subtleDelete" onClick={()=>removeSlot(i,si)} disabled={(e.slots||[]).length===1} title="Remove day"><X size={15}/></button></div>)}</div>
    <button type="button" className="addDayBtn" onClick={()=>addSlot(i)}><Plus size={14}/> Add another day / time</button>
    <div className="importDates"><label>Class starts<input type="date" value={e.start_date||startDate} min={startDate} max={e.end_date||endDate} onChange={x=>update(i,'start_date',x.target.value)}/></label><span className="dateArrow">→</span><label>Class ends<input type="date" value={e.end_date||endDate} min={e.start_date||startDate} onChange={x=>update(i,'end_date',x.target.value)}/></label></div>
   </div>)}</div>:<div className="importEmpty"><FileText size={18}/><span>No classes yet. Drop a timetable above or add a class manually.</span></div>}
  {ocrText&&<details className="ocrDetails"><summary>View extracted text</summary><textarea value={ocrText} onChange={e=>setOcrText(e.target.value)} placeholder="OCR text"/></details>}
  <button className="primary full importScheduleBtn" onClick={submit} disabled={busy||!entries.length}><CalendarClock size={16}/> Add to schedule</button>
 </Modal>
}

function Focus({timer,running,setRunning,setTimer,onToggle,onReset,onLogSession,focusMode,setFocusMode,pomodoros,setPomodoros,customMinutes,setCustomMinutes}){
 const mm=String(Math.floor(timer/60)).padStart(2,'0'),ss=String(timer%60).padStart(2,'0');
 const setPreset=(minutes,mode='pomodoro',count=1)=>{setRunning(false);setFocusMode(mode);if(mode==='pomodoro')setPomodoros(count);setTimer(minutes*60)};
 const applyCustom=()=>{const mins=Math.min(180,Math.max(1,Number(customMinutes)||1));setPreset(mins,'custom',1)};
 return <section className="page focusPage"><div className={"focusCard "+(running?"isRunning":"")}><span className="eyebrow">FOCUS MODE</span><h1>One thing at a time.</h1><p>Choose a preset or set exactly how long you want to focus.</p>
 <div className="focusOptions">
  <button className={'focusOption '+(focusMode==='pomodoro'&&pomodoros===1?'selected':'')} onClick={()=>setPreset(25,'pomodoro',1)}><b>1 Pomodoro</b><span>25 minutes</span></button>
  <button className={'focusOption '+(focusMode==='pomodoro'&&pomodoros===2?'selected':'')} onClick={()=>setPreset(50,'pomodoro',2)}><b>2 Pomodoros</b><span>50 minutes</span></button>
  <button className={'focusOption '+(focusMode==='pomodoro'&&pomodoros===3?'selected':'')} onClick={()=>setPreset(75,'pomodoro',3)}><b>3 Pomodoros</b><span>75 minutes</span></button>
  <div className={'focusOption customFocus '+(focusMode==='custom'?'selected':'')}><div><b>Custom</b><span>Set your own time</span></div><div className="customControl"><input aria-label="Custom focus minutes" type="number" min="1" max="180" value={customMinutes} onChange={e=>setCustomMinutes(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')applyCustom()}}/><span>min</span><button className="secondary mini" onClick={applyCustom}>Apply</button></div></div>
 </div>
 <div className="timer">{mm}<span>:</span>{ss}</div><div className="timerMeta">{focusMode==='custom'?'Custom session':`${pomodoros} ${pomodoros===1?'Pomodoro':'Pomodoros'}`}</div>
 <div className="timerActions"><button className="primary big" onClick={onToggle}>{running?<Pause/>:<Play/>}{running?'Pause':'Start focus'}</button><button className="secondary" onClick={onReset}><RotateCcw size={17}/> Reset</button></div><button type="button" className="manualSessionBtn" onClick={onLogSession}><Clock3 size={15}/><span>Log a session manually</span><ArrowUpRight size={14}/></button></div></section>}

function SessionModal({subjects,defaultMinutes,onClose,onSave}){
 const now=new Date();
 const initialStart=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
 const [subjectId,setSubjectId]=useState('');
 const [date,setDate]=useState(localDateKey(now));
 const [startTime,setStartTime]=useState(initialStart);
 const [endTime,setEndTime]=useState('');
 const [minutes,setMinutes]=useState(String(defaultMinutes||25));
 const calculated=sessionDuration(date,startTime,endTime);
 useEffect(()=>{if(calculated)setMinutes(String(calculated))},[calculated]);
 const submit=e=>{e.preventDefault();const mins=calculated||Math.max(1,Math.round(Number(minutes)||1));onSave(mins,subjectId||null,date,startTime||null,endTime||null)};
 return <div className="overlay sessionOverlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <form className="modal sessionModal" onSubmit={submit} onMouseDown={e=>e.stopPropagation()}>
   <div className="modalHead"><div><span className="eyebrow">FOCUS LOG</span><h2>Log a session</h2></div><button className="iconbtn" type="button" onClick={onClose} aria-label="Close session dialog"><X/></button></div>
   <p className="settingsHint">Record exactly when you studied. ORBIT calculates the duration from your start and end time.</p>
   <div className="sessionFields">
    <label><span>Date</span><input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
    <label><span>Subject <small>(optional)</small></span><div className="selectWrap"><select className="input" value={subjectId} onChange={e=>setSubjectId(e.target.value)}><option value="">No subject</option>{subjects.map(s=><option value={s.id} key={s.id}>{s.name}{s.code?` · ${s.code}`:''}</option>)}</select><ChevronDown size={16}/></div></label>
    <label><span>Start time</span><input className="input" type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} required/></label>
    <label><span>End time</span><input className="input" type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} required/></label>
    <label className="sessionDurationField"><span>Minutes <small>{calculated?'Calculated automatically':'Optional fallback'}</small></span><input className="input" type="number" min="1" max="1440" value={minutes} onChange={e=>setMinutes(e.target.value)} readOnly={!!calculated}/></label>
   </div>
   {calculated&&<div className="sessionCalc"><Clock3 size={16}/><span><b>{calculated} minutes</b> · {formatTimeValue(startTime)} – {formatTimeValue(endTime)}{endTime<=startTime?' · crosses midnight':''}</span></div>}
   <div className="modalActions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button type="submit" className="primary"><Clock3 size={16}/> Log session</button></div>
  </form>
 </div>
}

function getStreakStats(sessions, requirement){
 const required=Math.max(1,Number(requirement)||180);
 const days=new Set(sessions.filter(s=>Number(s.minutes||0)>0).map(s=>s.session_date));
 const today=localDateKey(new Date());
 let cursor=new Date(today+'T12:00:00');
 let current=0;
 while(days.has(localDateKey(cursor))){current++;cursor.setDate(cursor.getDate()-1)}
 let best=0,run=0,all=[...days].sort();
 let prev=null;
 for(const key of all){if(prev){const d=new Date(prev+'T12:00:00');d.setDate(d.getDate()+1);if(localDateKey(d)===key)run++;else run=1}else run=1;best=Math.max(best,run);prev=key}
 // Recalculate streak using the daily requirement, not merely any session.
 const totals={};
 sessions.forEach(s=>{if(s.session_date)totals[s.session_date]=(totals[s.session_date]||0)+Number(s.minutes||0)});
 const qualified=new Set(Object.entries(totals).filter(([,m])=>m>=required).map(([d])=>d));
 cursor=new Date(today+'T12:00:00');current=0;
 while(qualified.has(localDateKey(cursor))){current++;cursor.setDate(cursor.getDate()-1)}
 best=0;run=0;prev=null;
 for(const key of [...qualified].sort()){if(prev){const d=new Date(prev+'T12:00:00');d.setDate(d.getDate()+1);run=localDateKey(d)===key?run+1:1}else run=1;best=Math.max(best,run);prev=key}
 return {current,best,required};
}

function FocusResetModal({pending,onSave,onDiscard,onCancel}){
 const start=new Date(pending.startAt),end=new Date(pending.endAt);
 const fmt=d=>d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'});
 const date=start.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'});
 return <div className="overlay focusResetOverlay" onMouseDown={e=>{if(e.target===e.currentTarget)onCancel()}}>
  <div className="modal focusResetModal" onMouseDown={e=>e.stopPropagation()}>
   <div className="modalHead"><div><span className="eyebrow">FOCUS SESSION</span><h2>Save this session?</h2></div><button className="iconbtn" type="button" onClick={onCancel} aria-label="Close"><X/></button></div>
   <p className="settingsHint">You paused the timer before resetting. Save the time you actually focused, or discard it.</p>
   <div className="focusResetSummary"><div><span>DATE</span><b>{date}</b></div><div><span>STARTED</span><b>{fmt(start)}</b></div><div><span>ENDED</span><b>{fmt(end)}</b></div><div><span>FOCUS TIME</span><b>{pending.minutes} min</b></div></div>
   <div className="modalActions focusResetActions"><button type="button" className="secondary focusResetDiscard" onClick={onDiscard}><X size={16}/> Discard</button><button type="button" className="primary focusResetSave" onClick={onSave}><Check size={16}/> Save session</button></div><div className="focusResetActionHint">The timer will reset after your choice.</div>
  </div>
 </div>
}

function MomentumModal({sessions,requirement,onClose,onSave}){
 const stats=getStreakStats(sessions,requirement);
 const [hours,setHours]=useState(String((Number(requirement)||180)/60));
 const minutes=Math.max(1,Math.round(Number(hours)*60||1));
 return <div className="overlay momentumOverlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><form className="modal momentumModal" onSubmit={e=>{e.preventDefault();onSave(minutes)}} onMouseDown={e=>e.stopPropagation()}>
  <div className="modalHead"><div><span className="eyebrow">MOMENTUM</span><h2>Build your streak</h2></div><button className="iconbtn" type="button" onClick={onClose} aria-label="Close momentum settings"><X/></button></div>
  <p className="settingsHint">Set the minimum amount of study time you need to log each day for that day to count toward your streak.</p>
  <div className="streakStats"><div><span>Current streak</span><b>{stats.current} days</b></div><div><span>Best streak</span><b>{stats.best} days</b></div></div>
  <label className="streakRequirement"><span>Daily study requirement</span><div className="streakInput"><input autoFocus type="number" min="0.25" max="24" step="0.25" value={hours} onChange={e=>setHours(e.target.value)}/><b>hours / day</b></div><small>Example: 3 hours means you need at least 180 logged minutes that day.</small></label>
  <div className="streakPreview"><Flame size={18}/><span>Current rule: <b>{minutes} minutes per day</b></span></div>
  <div className="modalActions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button type="submit" className="primary"><Check size={16}/> Save streak goal</button></div>
 </form></div>
}

function SessionHistoryModal({date,sessions,subjects,onDateChange,onDelete,onClose}){
 const daySessions=sessions.filter(s=>s.session_date===date).sort((a,b)=>(a.start_time||'99:99').localeCompare(b.start_time||'99:99'));
 const total=daySessions.reduce((sum,s)=>sum+Number(s.minutes||0),0);
 const shiftDate=(delta)=>{const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+delta);onDateChange(localDateKey(d))};
 const label=new Date(`${date}T12:00:00`).toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
 return <div className="overlay sessionHistoryOverlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <div className="modal sessionHistoryModal" onMouseDown={e=>e.stopPropagation()}>
   <div className="modalHead"><div><span className="eyebrow">ACTIVITY HISTORY</span><h2>Time logged</h2><p className="historyDateLabel">{label}</p></div><button className="iconbtn" type="button" onClick={onClose} aria-label="Close history"><X/></button></div>
   <div className="historyDateBar"><button type="button" className="secondary mini historyNav" onClick={()=>shiftDate(-1)} aria-label="Previous day">‹</button><div className="historyDatePicker"><DateField value={date} onChange={onDateChange} label="History date" compact/></div><button type="button" className="secondary mini historyNav" onClick={()=>shiftDate(1)} aria-label="Next day">›</button><button type="button" className="secondary historyToday" onClick={()=>onDateChange(localDateKey(new Date()))}>Today</button></div>
   <div className="historySummary"><div><span>Total</span><b>{total} min</b></div><div><span>Sessions</span><b>{daySessions.length}</b></div><div><span>Focus time</span><b>{(total/60).toFixed(1)}h</b></div></div>
   <div className="sessionHistoryList">{daySessions.length?daySessions.map(s=>{const subject=subjects.find(x=>x.id===s.subject_id);return <div className="historySession" key={s.id}><div className="historyTime"><b>{formatTimeValue(s.start_time)||'—'}</b><span>{formatTimeValue(s.end_time)||'Time not recorded'}</span></div><div className="historyLine"><i/></div><div className="historySessionInfo"><b>{subject?.name||'General focus'}</b><span>{s.minutes} minutes{subject?.code?` · ${subject.code}`:''}</span></div><button type="button" className="iconbtn historyDelete" onClick={()=>onDelete?.(s)} aria-label="Delete session" title="Delete session"><Trash2 size={15}/></button></div>}):<div className="historyEmpty"><div className="historyEmptyIcon"><Clock3 size={20}/></div><b>No sessions logged</b><span>There are no focus or study sessions recorded for this day.</span></div>}</div>
   <div className="modalActions"><button type="button" className="secondary" onClick={onClose}>Close</button></div>
  </div>
 </div>
}

function AuthModal({cloudReady,onClose,onGoogle}){
 return <div className="overlay authOverlay" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}>
  <div className="modal authModal" onMouseDown={e=>e.stopPropagation()}>
   <div className="modalHead">
    <div><span className="eyebrow">WELCOME TO ORBIT</span><h2>Sign in</h2></div>
    <button className="iconbtn" type="button" onClick={onClose} aria-label="Close sign in"><X/></button>
   </div>
   <p className="settingsHint">Sign in with Google to sync your ORBIT workspace and connect Google Calendar.</p>
   <div className="authChoices">
    <button type="button" className="authMethod" onClick={onGoogle} disabled={!cloudReady}>
     <span className="googleMark" aria-hidden="true">G</span>
     <span><b>Continue with Google</b><small>Sync your Orbit workspace + Google Calendar</small></span>
     <ArrowUpRight size={16}/>
    </button>
   </div>
   {!cloudReady&&<div className="authNotice">Cloud sign-in is not configured yet. Add your Supabase URL and publishable key to the environment first.</div>}
   <small className="authFinePrint">By continuing, you use your Google account to sign in to ORBIT Tracker.</small>
  </div>
 </div>
}


function Modal({title,onClose,children,className=""}){return <div className="overlay" onMouseDown={onClose}><div className={`modal ${className}`.trim()} onMouseDown={e=>e.stopPropagation()}><div className="modalHead"><h2>{title}</h2><button className="iconbtn" onClick={onClose}><X/></button></div>{children}</div></div>}
createRoot(document.getElementById('root')).render(<App/>);
